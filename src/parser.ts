import {
	type CallExpression,
	type Expression,
	Node,
	Project,
	type SourceFile,
	SyntaxKind,
	type TemplateExpression,
	type VariableDeclaration,
} from 'ts-morph'
import { NEXT_INTL_GET_TRANSLATIONS_LOCALE, NEXT_INTL_GET_TRANSLATIONS_NAMESPACE } from './constants.js'
import { Severity, printDiagnostic } from './diagnostics.js'
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
				TranslationCallMode.Server,
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

// biome-ignore lint/style/useNamingConvention: Pseudo enum.
const TranslationCallMode = { Client: 'Client', Server: 'Server' } as const
type TranslationCallMode = (typeof TranslationCallMode)[keyof typeof TranslationCallMode]
type TranslationAliasResult = { valid: false } | { valid: true; namespace?: string }

function isTranslationAliasDeclaration(
	variableDeclaration: VariableDeclaration,
	expectedTranslationAlias: string,
	mode: TranslationCallMode = TranslationCallMode.Client,
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

	const argument = args[0]
	let resolvedNamespace = resolveStringLiteral(argument)
	if (resolvedNamespace) {
		return { valid: true, namespace: resolvedNamespace }
	}

	if (
		!(
			mode === TranslationCallMode.Server &&
			Node.isObjectLiteralExpression(argument) &&
			Node.isPropertyAssignment(argument.getProperty(NEXT_INTL_GET_TRANSLATIONS_LOCALE))
		)
	) {
		printDiagnostic(
			argument,
			variableDeclaration.getParentOrThrow(),
			Severity.Error,
			'A dynamic namespace value was provided instead of a literal string.',
			'For reliable extraction of translation keys, please ensure that the namespace is defined',
			'as a static string literal (or a variable that unequivocally resolves to one).',
		)
		return { valid: false }
	}

	const namespaceProperty = argument.getProperty(NEXT_INTL_GET_TRANSLATIONS_NAMESPACE)
	if (!(namespaceProperty && Node.isPropertyAssignment(namespaceProperty))) {
		return { valid: true }
	}

	const initializer = namespaceProperty.getInitializer()
	if (initializer) {
		resolvedNamespace = resolveStringLiteral(initializer)
	}

	return resolvedNamespace ? { valid: true, namespace: resolvedNamespace } : { valid: true }
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

function extractTranslationKeysFromExpression(expression: Expression): readonly string[] {
	if (Node.isStringLiteral(expression)) {
		return [expression.getLiteralText()]
	}
	if (Node.isIdentifier(expression)) {
		return extractLiteralValuesFromExpression(expression)
	}
	if (Node.isTemplateExpression(expression)) {
		return extractTranslationKeysFromTemplateLiteral(expression)
	}
	if (Node.isPropertyAccessExpression(expression)) {
		return extractLiteralValuesFromExpression(expression)
	}
	printDiagnostic(
		expression,
		expression.getParentOrThrow(),
		Severity.Warn,
		`Unsupported expression of kind ${expression.getKindName()} detected.`,
		"If you'd like to request support for this expression syntax, please open a feature request at:",
		'https://github.com/ChristianIvicevic/intl-watcher/issues/new?template=03-feature.yml',
		'and include the syntax kind and the full text of the expression in your request.',
	)
	return []
}

function extractLiteralValuesFromExpression(expression: Expression): readonly string[] {
	const type = expression.getType()
	if (type.isStringLiteral()) {
		return [String(type.getLiteralValue())]
	}
	if (type.isUnion()) {
		return type
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
		const expressionKeys = extractTranslationKeysFromExpression(span.getExpression())
		const suffix = span.getLiteral().getLiteralText()
		for (const value of expressionKeys) {
			translationKeys.push(`${head}${value}${suffix}`)
		}
	}

	return translationKeys
}
