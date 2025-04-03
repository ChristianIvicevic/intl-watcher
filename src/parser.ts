import {
	type CallExpression,
	type Expression,
	type Identifier,
	Node,
	Project,
	type SourceFile,
	SyntaxKind,
	type TemplateExpression,
	type VariableDeclaration,
} from 'ts-morph'
import { log } from './logger.js'
import type { IntlWatcherOptions } from './types.js'

export function extractTranslationKeysFromProject(
	options: IntlWatcherOptions,
): readonly [string[], string[]] {
	const project = new Project({ tsConfigFilePath: options.tsConfigFilePath })
	const sourceFiles = project.getSourceFiles()

	const clientTranslationKeys: string[] = []
	const serverTranslationKeys: string[] = []

	for (const sourceFile of sourceFiles) {
		const variableDeclarations = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration)
		for (const variableDeclaration of variableDeclarations) {
			const translationAlias = variableDeclaration.getName()

			const clientAlias = isTranslationAliasDeclaration(
				variableDeclaration,
				options.partitioningOptions.clientFunction,
			)
			if (clientAlias.valid) {
				const translationKeys = extractTranslationKeysFromSourceFile(sourceFile, translationAlias)
				clientTranslationKeys.push(
					...translationKeys.map((key) => (clientAlias.namespace ? `${clientAlias.namespace}.${key}` : key)),
				)
			}

			const serverAlias = isTranslationAliasDeclaration(
				variableDeclaration,
				options.partitioningOptions.serverFunction,
			)
			if (serverAlias.valid) {
				const translationKeys = extractTranslationKeysFromSourceFile(sourceFile, translationAlias)
				serverTranslationKeys.push(
					...translationKeys.map((key) => (serverAlias.namespace ? `${serverAlias.namespace}.${key}` : key)),
				)
			}
		}
	}

	return [
		Array.from(new Set(clientTranslationKeys)).toSorted(),
		Array.from(new Set(serverTranslationKeys)).toSorted(),
	]
}

type TranslationAliasResult = { valid: false } | { valid: true; namespace?: string }

function isTranslationAliasDeclaration(
	variableDeclaration: VariableDeclaration,
	expectedTranslationAlias: string,
): TranslationAliasResult {
	let currentExpression = variableDeclaration.getInitializer()
	if (currentExpression === undefined) {
		return { valid: false }
	}

	while (Node.isAwaitExpression(currentExpression)) {
		currentExpression = currentExpression.getExpression()
	}
	if (!Node.isCallExpression(currentExpression)) {
		return { valid: false }
	}

	const callee = currentExpression.getExpression()
	if (!Node.isIdentifier(callee) || callee.getText() !== expectedTranslationAlias) {
		return { valid: false }
	}

	const args = currentExpression.getArguments()
	if (args.length === 0) {
		return { valid: true }
	}

	const resolvedNamespace = resolveStringLiteral(args[0])
	if (resolvedNamespace) {
		return { valid: true, namespace: resolvedNamespace }
	}

	// TODO: Add diagnostics.
	log.warn(
		'A dynamic namespace value was provided instead of a literal string. For reliable extraction of translation keys, please ensure that the namespace is defined as a static string literal (or a variable that unequivocally resolves to one).',
	)
	return { valid: false }
}

function resolveStringLiteral(node: Node): string | undefined {
	const type = node.getType()
	if (type.isStringLiteral()) {
		return String(type.getLiteralValue())
	}
}

function extractTranslationKeysFromSourceFile(
	sourceFile: SourceFile,
	translationAlias: string,
): readonly string[] {
	const translationKeys: string[] = []
	const callExpressions = sourceFile
		.getDescendantsOfKind(SyntaxKind.CallExpression)
		.filter((it) => isTranslationCall(it, translationAlias))
	for (const callExpression of callExpressions) {
		const args = callExpression.getArguments()
		if (args.length === 0) {
			continue
		}
		const firstArgument = args[0]
		if (Node.isExpression(firstArgument)) {
			translationKeys.push(...extractTranslationKeysFromExpression(firstArgument))
		}
	}
	return translationKeys
}

function isTranslationCall(callExpression: CallExpression, expectedTranslationAlias: string): boolean {
	const expression = callExpression.getExpression()
	if (Node.isIdentifier(expression) && expression.getText() === expectedTranslationAlias) {
		return true
	}
	if (Node.isPropertyAccessExpression(expression)) {
		const objectNode = expression.getExpression()
		const propertyName = expression.getName()
		// next-intl specific `t.rich()` syntax
		if (objectNode.getText() === expectedTranslationAlias && propertyName === 'rich') {
			return true
		}
	}
	return false
}

function extractTranslationKeysFromExpression(argument: Expression): readonly string[] {
	if (Node.isStringLiteral(argument)) {
		return [argument.getLiteralText()]
	}
	if (Node.isIdentifier(argument)) {
		return extractLiteralValuesFromIdentifier(argument)
	}
	if (Node.isTemplateExpression(argument)) {
		return extractTranslationKeysFromTemplateLiteral(argument)
	}
	if (Node.isPropertyAccessExpression(argument)) {
		const unwrappedExpression = unwrapPropertyAccess(argument)
		return extractTranslationKeysFromExpression(unwrappedExpression)
	}
	return []
}

function extractLiteralValuesFromIdentifier(identifier: Identifier): readonly string[] {
	const identifierType = identifier.getType()
	if (identifierType.isStringLiteral()) {
		return [String(identifierType.getLiteralValue())]
	}
	if (identifierType.isUnion()) {
		return identifierType
			.getUnionTypes()
			.map((t) => t.getLiteralValue())
			.filter((value) => typeof value === 'string')
	}
	return []
}

function extractTranslationKeysFromTemplateLiteral(argument: TemplateExpression): readonly string[] {
	const translationKeys: string[] = []
	const head = argument.getHead().getLiteralText()

	for (const span of argument.getTemplateSpans()) {
		const unwrappedExpression = unwrapPropertyAccess(span.getExpression())
		if (!Node.isIdentifier(unwrappedExpression)) {
			continue
		}
		const identifierValues = extractLiteralValuesFromIdentifier(unwrappedExpression)
		const suffix = span.getLiteral().getLiteralText()
		for (const value of identifierValues) {
			translationKeys.push(`${head}${value}${suffix}`)
		}
	}

	return translationKeys
}

function unwrapPropertyAccess(expression: Expression): Expression {
	let currentExpression = expression
	while (Node.isPropertyAccessExpression(currentExpression)) {
		currentExpression = currentExpression.getExpression()
	}
	return currentExpression
}
