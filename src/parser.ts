import {
	type CallExpression,
	type Expression,
	Node,
	type ObjectLiteralExpression,
	type Project,
	type SourceFile,
	SyntaxKind,
	type TemplateExpression,
	type VariableDeclaration,
} from 'ts-morph'
import { NEXT_INTL_GET_TRANSLATIONS_LOCALE, NEXT_INTL_GET_TRANSLATIONS_NAMESPACE } from './constants.js'
import { printDiagnostic, Severity } from './diagnostics.js'
import { log } from './logger.js'
import type { IntlWatcherOptions } from './types.js'

/** @internal */
export function extractTranslationKeysFromProject(
	project: Project,
	options: IntlWatcherOptions,
): readonly [string[], string[]] {
	const sourceFiles = project.getSourceFiles()

	const clientTranslationKeys: string[] = []
	const serverTranslationKeys: string[] = []
	const suppressedExpressionKinds = options.suppressExpressionWarnings
	const encounteredKinds = new Set<string>()

	const clientFunctions = options.applyPartitioning ? [options.partitioningOptions.clientFunction] : []
	const serverFunctions = options.applyPartitioning
		? [options.partitioningOptions.serverFunction]
		: options.translationFunctions

	for (const sourceFile of sourceFiles) {
		const variableDeclarations = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration)
		for (const variableDeclaration of variableDeclarations) {
			const translationAlias = variableDeclaration.getName()

			for (const fnName of clientFunctions) {
				clientTranslationKeys.push(
					...extractTranslationKeysForAlias(
						variableDeclaration,
						translationAlias,
						fnName,
						TranslationCallMode.Client,
						suppressedExpressionKinds,
						encounteredKinds,
					),
				)
			}

			for (const fnName of serverFunctions) {
				serverTranslationKeys.push(
					...extractTranslationKeysForAlias(
						variableDeclaration,
						translationAlias,
						fnName,
						TranslationCallMode.Server,
						suppressedExpressionKinds,
						encounteredKinds,
					),
				)
			}
		}
	}

	for (const kind of suppressedExpressionKinds) {
		if (!encounteredKinds.has(kind)) {
			log.warn(`'${kind}' in suppressExpressionWarnings did not suppress any warnings. Consider removing it.`)
		}
	}

	return [
		Array.from(new Set(clientTranslationKeys)).toSorted(),
		Array.from(new Set(serverTranslationKeys)).toSorted(),
	]
}

function extractTranslationKeysForAlias(
	variableDeclaration: VariableDeclaration,
	translationAlias: string,
	translationFunction: string,
	mode: TranslationCallMode,
	suppressedExpressionKinds: string[],
	encounteredKinds: Set<string>,
): readonly string[] {
	const result = isTranslationAliasDeclaration(variableDeclaration, translationFunction, mode)
	if (result.valid) {
		const translationKeys = extractTranslationKeysFromSourceFile(
			variableDeclaration.getSourceFile(),
			translationAlias,
			suppressedExpressionKinds,
			encounteredKinds,
		)
		return translationKeys.map((key) => (result.namespace ? `${result.namespace}.${key}` : key))
	}
	return []
}

const TranslationCallMode = { Client: 'Client', Server: 'Server' } as const
type TranslationCallMode = (typeof TranslationCallMode)[keyof typeof TranslationCallMode]
type TranslationAliasResult = { valid: false } | { valid: true; namespace?: string }

function isTranslationAliasDeclaration(
	variableDeclaration: VariableDeclaration,
	expectedTranslationAlias: string,
	mode: TranslationCallMode,
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

	if (!(mode === TranslationCallMode.Server && isServerOptions(argument))) {
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

function isServerOptions(node: Node): node is ObjectLiteralExpression {
	return (
		Node.isObjectLiteralExpression(node) &&
		(Node.isPropertyAssignment(node.getProperty(NEXT_INTL_GET_TRANSLATIONS_LOCALE)) ||
			Node.isShorthandPropertyAssignment(node.getProperty(NEXT_INTL_GET_TRANSLATIONS_LOCALE)))
	)
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
	suppressedExpressionKinds: string[],
	encounteredKinds: Set<string>,
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
			translationKeys.push(
				...extractTranslationKeysFromExpression(firstArgument, suppressedExpressionKinds, encounteredKinds),
			)
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

function extractTranslationKeysFromExpression(
	expression: Expression,
	suppressedExpressionKinds: string[],
	encounteredKinds: Set<string>,
): readonly string[] {
	if (Node.isStringLiteral(expression)) {
		return [expression.getLiteralText()]
	}
	if (Node.isIdentifier(expression)) {
		return extractLiteralValuesFromExpression(expression)
	}
	if (Node.isTemplateExpression(expression)) {
		return extractTranslationKeysFromTemplateLiteral(expression, suppressedExpressionKinds, encounteredKinds)
	}
	if (Node.isPropertyAccessExpression(expression)) {
		return extractLiteralValuesFromExpression(expression)
	}
	const kindName = expression.getKindName()
	if (suppressedExpressionKinds.includes(kindName)) {
		encounteredKinds.add(kindName)
		return []
	}
	printDiagnostic(
		expression,
		expression.getParentOrThrow(),
		Severity.Warn,
		`Unsupported expression of kind ${kindName} detected.`,
		'This syntax is not currently supported. If you need support for it, please open a feature request',
		'detailing the syntax kind and the entire expression. Submit your request here:',
		'https://github.com/ChristianIvicevic/intl-watcher/issues/new?template=03-feature.yml',
		'',
		`To suppress this warning, add '${kindName}' to suppressExpressionWarnings in your config.`,
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

function extractTranslationKeysFromTemplateLiteral(
	templateExpression: TemplateExpression,
	suppressedExpressionKinds: string[],
	encounteredKinds: Set<string>,
): readonly string[] {
	const translationKeys: string[] = []
	const head = templateExpression.getHead().getLiteralText()

	for (const span of templateExpression.getTemplateSpans()) {
		const expressionKeys = extractTranslationKeysFromExpression(
			span.getExpression(),
			suppressedExpressionKinds,
			encounteredKinds,
		)
		const suffix = span.getLiteral().getLiteralText()
		for (const value of expressionKeys) {
			translationKeys.push(`${head}${value}${suffix}`)
		}
	}

	return translationKeys
}
