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
			const translateIdentifier = variableDeclaration.getName()

			if (isTranslationFunctionCandidate(variableDeclaration, options.partitioningOptions.clientFunction)) {
				clientTranslationKeys.push(...extractTranslationKeysFromSourceFile(sourceFile, translateIdentifier))
			}
			if (isTranslationFunctionCandidate(variableDeclaration, options.partitioningOptions.serverFunction)) {
				serverTranslationKeys.push(...extractTranslationKeysFromSourceFile(sourceFile, translateIdentifier))
			}
		}
	}

	return [
		Array.from(new Set(clientTranslationKeys)).toSorted(),
		Array.from(new Set(serverTranslationKeys)).toSorted(),
	]
}

function isTranslationFunctionCandidate(
	variableDeclaration: VariableDeclaration,
	translateIdentifier: string,
): boolean {
	let currentExpression = variableDeclaration.getInitializerOrThrow()
	if (currentExpression === undefined) {
		return false
	}
	while (Node.isAwaitExpression(currentExpression)) {
		currentExpression = currentExpression.getExpression()
	}
	return (
		Node.isCallExpression(currentExpression) &&
		Node.isIdentifier(currentExpression.getExpression()) &&
		currentExpression.getExpression().getText() === translateIdentifier
	)
}

function extractTranslationKeysFromSourceFile(
	sourceFile: SourceFile,
	translateIdentifier: string,
): readonly string[] {
	const extractedKeys: string[] = []
	const callExpressions = sourceFile
		.getDescendantsOfKind(SyntaxKind.CallExpression)
		.filter((it) => isTranslationCall(it, translateIdentifier))
	for (const callExpression of callExpressions) {
		const allArguments = callExpression.getArguments()
		if (allArguments.length === 0) {
			continue
		}
		const firstArgument = allArguments[0]
		if (Node.isExpression(firstArgument)) {
			extractedKeys.push(...extractTranslationKeysFromExpression(firstArgument))
		}
	}
	return extractedKeys
}

function isTranslationCall(callExpression: CallExpression, translateIdentifier: string): boolean {
	const expression = callExpression.getExpression()
	if (Node.isIdentifier(expression) && translateIdentifier === expression.getText()) {
		return true
	}
	if (Node.isPropertyAccessExpression(expression)) {
		const objectNode = expression.getExpression()
		const propertyName = expression.getName()
		// next-intl specific `t.rich()` syntax
		if (translateIdentifier === objectNode.getText() && propertyName === 'rich') {
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
	const extractedKeys: string[] = []
	const head = argument.getHead().getLiteralText()

	for (const span of argument.getTemplateSpans()) {
		const unwrappedExpression = unwrapPropertyAccess(span.getExpression())
		if (!Node.isIdentifier(unwrappedExpression)) {
			continue
		}
		const identifierValues = extractLiteralValuesFromIdentifier(unwrappedExpression)
		const suffix = span.getLiteral().getLiteralText()
		for (const value of identifierValues) {
			extractedKeys.push(`${head}${value}${suffix}`)
		}
	}

	return extractedKeys
}

function unwrapPropertyAccess(expression: Expression): Expression {
	let currentExpression = expression
	while (Node.isPropertyAccessExpression(currentExpression)) {
		currentExpression = currentExpression.getExpression()
	}
	return currentExpression
}
