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

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Expected complexity.
export function extractTranslationKeysFromProject(
	options: IntlWatcherOptions,
): readonly [string[], string[]] {
	const project = new Project({ tsConfigFilePath: options.tsConfigFilePath })

	const sourceFiles = project.getSourceFiles()

	const clientTranslationKeys = new Set<string>()
	const serverTranslationKeys = new Set<string>()

	for (const sourceFile of sourceFiles) {
		const variableDeclarations = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration)
		for (const variableDeclaration of variableDeclarations) {
			const variableName = variableDeclaration.getName()
			const identifiers = new Set([variableName])

			if (isTranslationFunctionCandidate(variableDeclaration, options.partitioningOptions.clientFunction)) {
				const keys = extractTranslationKeysFromSourceFile(sourceFile, identifiers)
				for (const key of keys) {
					clientTranslationKeys.add(key)
				}
			}
			if (isTranslationFunctionCandidate(variableDeclaration, options.partitioningOptions.serverFunction)) {
				const keys = extractTranslationKeysFromSourceFile(sourceFile, identifiers)
				for (const key of keys) {
					serverTranslationKeys.add(key)
				}
			}
		}
	}

	return [Array.from(clientTranslationKeys).toSorted(), Array.from(serverTranslationKeys).toSorted()] as const
}

function isTranslationFunctionCandidate(
	variableDeclaration: VariableDeclaration,
	functionName: string,
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
		currentExpression.getExpression().getText() === functionName
	)
}

function extractTranslationKeysFromSourceFile(sourceFile: SourceFile, identifiers: Set<string>): string[] {
	const extractedKeys = new Set<string>()
	const callExpressions = sourceFile
		.getDescendantsOfKind(SyntaxKind.CallExpression)
		.filter((it) => isTranslationCall(it, identifiers))

	for (const callExpression of callExpressions) {
		const callArguments = callExpression.getArguments()
		if (callArguments.length === 0) {
			continue
		}

		const head = callArguments[0]
		if (!Node.isExpression(head)) {
			continue
		}

		for (const value of extractTranslationKeysFromFunctionArgument(head)) {
			extractedKeys.add(value)
		}
	}

	return Array.from(extractedKeys)
}

function isTranslationCall(callExpression: CallExpression, identifiers: Set<string>): boolean {
	const expression = callExpression.getExpression()

	if (Node.isIdentifier(expression) && identifiers.has(expression.getText())) {
		return true
	}

	if (Node.isPropertyAccessExpression(expression)) {
		const objectNode = expression.getExpression()
		const propertyName = expression.getName()
		if (identifiers.has(objectNode.getText()) && propertyName === 'rich') {
			return true
		}
	}

	return false
}

function extractTranslationKeysFromFunctionArgument(argument: Expression): Set<string> {
	const extractedKeys = new Set<string>()

	// TODO: Replace Set.add with return.
	if (Node.isStringLiteral(argument)) {
		extractedKeys.add(argument.getLiteralText())
	} else if (Node.isIdentifier(argument)) {
		for (const value of extractLiteralValuesFromIdentifier(argument)) {
			extractedKeys.add(value)
		}
	} else if (Node.isTemplateExpression(argument)) {
		for (const value of extractTemplateLiteralTranslations(argument)) {
			extractedKeys.add(value)
		}
	} else if (Node.isPropertyAccessExpression(argument)) {
		const unwrappedExpression = unwrapPropertyAccess(argument)
		// TODO: Call this recursively?
		if (Node.isIdentifier(unwrappedExpression)) {
			for (const value of extractLiteralValuesFromIdentifier(unwrappedExpression)) {
				extractedKeys.add(value)
			}
		}
	}

	return extractedKeys
}

function extractLiteralValuesFromIdentifier(identifier: Identifier): Set<string> {
	const identifierType = identifier.getType()

	if (identifierType.isStringLiteral()) {
		return new Set([String(identifierType.getLiteralValue())])
	}

	if (identifierType.isUnion()) {
		const literalValues = identifierType
			.getUnionTypes()
			.map((t) => t.getLiteralValue())
			.filter((value) => typeof value === 'string')
		return new Set(literalValues)
	}

	return new Set([])
}

function extractTemplateLiteralTranslations(argument: TemplateExpression): Set<string> {
	const extractedKeys = new Set<string>()
	const head = argument.getHead().getLiteralText()

	for (const span of argument.getTemplateSpans()) {
		const unwrappedExpression = unwrapPropertyAccess(span.getExpression())
		if (!Node.isIdentifier(unwrappedExpression)) {
			continue
		}

		const identifierValues = extractLiteralValuesFromIdentifier(unwrappedExpression)

		const suffix = span.getLiteral().getLiteralText()
		for (const value of identifierValues) {
			extractedKeys.add(`${head}${value}${suffix}`)
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
