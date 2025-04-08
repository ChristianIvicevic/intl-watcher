import dedent from 'dedent'
import pc from 'picocolors'
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
	type VariableDeclarationList,
} from 'ts-morph'
import { NEXT_INTL_GET_TRANSLATIONS_LOCALE, NEXT_INTL_GET_TRANSLATIONS_NAMESPACE } from './constants.js'
import { log } from './logger.js'
import type { IntlWatcherOptions } from './types.js'
import { getCommonPrefix } from './utils.js'

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
		printDynamicNamespaceWarning(variableDeclaration, argument)
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

function printDynamicNamespaceWarning(
	variableDeclaration: VariableDeclaration,
	namespaceArgument: Node,
): void {
	const sourceFiles = variableDeclaration.getProject().getSourceFiles()
	const rootDirectory = getCommonPrefix(sourceFiles.map((file) => file.getFilePath()))
	const sourceFile = variableDeclaration.getSourceFile()
	const filePath = sourceFile.getFilePath().substring(rootDirectory.length)

	const variableDeclarationList = variableDeclaration.getParent() as VariableDeclarationList

	const { line: startLine } = sourceFile.getLineAndColumnAtPos(variableDeclarationList.getStart())
	const { line: endLine } = sourceFile.getLineAndColumnAtPos(variableDeclarationList.getEnd())
	const linePadding = Math.max(startLine.toString().length, (endLine + 1).toString().length)

	const { column: startColumn } = sourceFile.getLineAndColumnAtPos(namespaceArgument.getStart())
	const { column: endColumn } = sourceFile.getLineAndColumnAtPos(namespaceArgument.getEnd())

	const diagnosticMessage = dedent`
	${filePath}:${startLine}:${startColumn} ${Array.from({ length: 100 - filePath.length - startLine.toString().length - startColumn.toString().length - 2 }).join('━')}
	
	    ${pc.red(pc.bold('⨯'))} ${pc.red('A dynamic namespace value was provided instead of a literal string.')}
	
	    ${pc.red(pc.bold('>'))} ${startLine.toString().padStart(linePadding)} | ${variableDeclarationList.getText()}
	      ${''.padStart(linePadding)} | ${Array.from({ length: startColumn - 1 }).join(' ')}${Array.from({ length: endColumn - startColumn + 1 }).join(pc.red('^'))}
	      ${(endLine + 1).toString().padStart(linePadding)} |
	
	    ${pc.green(pc.bold('ℹ'))} ${pc.green('For reliable extraction of translation keys, please ensure that the namespace is defined')}
	      ${pc.green('as a static string literal (or a variable that unequivocally resolves to one).')}
	`

	log.error(diagnosticMessage)
	log.info()
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
