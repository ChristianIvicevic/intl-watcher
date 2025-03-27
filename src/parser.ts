import { Project, type SourceFile, createWrappedNode, ts } from 'ts-morph'
import type { IntlWatcherOptions } from './types.js'

export function extractTranslationKeysFromProject(options: IntlWatcherOptions) {
	const project = new Project({ tsConfigFilePath: options.tsConfigFilePath })

	const sourceFiles = project.getSourceFiles()
	const typeChecker = project.getTypeChecker().compilerObject

	const clientTranslationKeys = new Set<string>()
	const serverTranslationKeys = new Set<string>()

	for (const sourceFile of sourceFiles) {
		// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: It is what it is.
		sourceFile.forEachDescendant((node) => {
			if (!ts.isVariableDeclaration(node.compilerNode)) {
				return
			}
			const variableName = node.compilerNode.name.getText()
			const identifiers = new Set([variableName])

			if (isTranslationFunctionCandidate(node.compilerNode, options.partitioningOptions.clientFunction)) {
				for (const key of extractTranslationKeysFromSourceFile(sourceFile, typeChecker, identifiers)) {
					clientTranslationKeys.add(key)
				}
			}

			if (isTranslationFunctionCandidate(node.compilerNode, options.partitioningOptions.serverFunction)) {
				for (const key of extractTranslationKeysFromSourceFile(sourceFile, typeChecker, identifiers)) {
					serverTranslationKeys.add(key)
				}
			}
		})
	}

	return [Array.from(clientTranslationKeys).toSorted(), Array.from(serverTranslationKeys).toSorted()] as const
}

function isTranslationFunctionCandidate(
	variableDeclaration: ts.VariableDeclaration,
	translationType: string,
) {
	// TODO: Investigate how to make this way more robust. This prohibits parameters and strict equalities would need
	//		to take into account keywords such as await. The change to add the parenthese was necessary in the first place
	//		since we only compared against `translationType` which would give false positives if it was a suffix such as
	//		`translate` and `translateOnServer`.
	return variableDeclaration.initializer?.getText()?.includes(`${translationType}()`)
}

function extractTranslationKeysFromSourceFile(
	sourceFile: SourceFile,
	typeChecker: ts.TypeChecker,
	identifiers: Set<string>,
) {
	const extractedKeys = new Set<string>()

	sourceFile.forEachDescendant((innerNode) => {
		const compilerNode = innerNode.compilerNode
		if (!(ts.isCallExpression(compilerNode) && isTranslationCall(compilerNode, identifiers))) {
			return
		}
		const argument = compilerNode.arguments[0]
		if (!argument) {
			return
		}
		for (const value of extractTranslationKeysFromArgument(argument, typeChecker)) {
			extractedKeys.add(value)
		}
	})

	return Array.from(extractedKeys)
}

function isTranslationCall(callExpression: ts.CallExpression, identifiers: Set<string>) {
	const expressionNode = callExpression.expression
	if (ts.isIdentifier(expressionNode) && identifiers.has(expressionNode.getText())) {
		return true
	}
	if (ts.isPropertyAccessExpression(expressionNode)) {
		const objectNode = expressionNode.expression
		const propertyName = expressionNode.name.text
		if (identifiers.has(objectNode.getText()) && propertyName === 'rich') {
			return true
		}
	}
	return false
}

function extractTranslationKeysFromArgument(argument: ts.Expression, typeChecker: ts.TypeChecker) {
	const extractedKeys = new Set<string>()

	if (ts.isStringLiteral(argument)) {
		extractedKeys.add(argument.text)
	} else if (ts.isIdentifier(argument)) {
		for (const value of extractLiteralValuesFromIdentifier(argument, typeChecker)) {
			extractedKeys.add(value)
		}
	} else if (ts.isTemplateExpression(argument)) {
		for (const value of extractTemplateLiteralTranslations(argument, typeChecker)) {
			extractedKeys.add(value)
		}
	} else if (ts.isPropertyAccessExpression(argument)) {
		let expression = argument
		while (ts.isPropertyAccessExpression(expression.name)) {
			expression = expression.name
		}
		// TODO: processArgument might be used recursively.
		if (ts.isIdentifier(expression.name)) {
			for (const value of extractLiteralValuesFromIdentifier(expression.name, typeChecker)) {
				extractedKeys.add(value)
			}
		}
	}

	return extractedKeys
}

function extractLiteralValuesFromIdentifier(identifier: ts.Identifier, typeChecker: ts.TypeChecker) {
	const identifierType = createWrappedNode(identifier, { typeChecker }).getType()
	const extractedKeys = new Set<string>()

	if (identifierType.isStringLiteral()) {
		extractedKeys.add(identifierType.getLiteralValue() as string)
	} else if (identifierType.isUnion()) {
		const literalValues = identifierType
			.getUnionTypes()
			.map((t) => t.getLiteralValue())
			.filter((value) => typeof value === 'string')
		for (const value of literalValues) {
			extractedKeys.add(value)
		}
	}

	return extractedKeys
}

function extractTemplateLiteralTranslations(argument: ts.TemplateExpression, typeChecker: ts.TypeChecker) {
	const extractedKeys = new Set<string>()
	const head = createWrappedNode(argument.head).asKindOrThrow(ts.SyntaxKind.TemplateHead).getLiteralText()

	for (const span of argument.templateSpans) {
		const unwrappedExpression = unwrapPropertyAccess(span.expression)
		if (!ts.isIdentifier(unwrappedExpression)) {
			continue
		}

		const identifierValues = extractLiteralValuesFromIdentifier(unwrappedExpression, typeChecker)
		const suffix = span.literal.text
		for (const value of identifierValues) {
			extractedKeys.add(`${head}${value}${suffix}`)
		}
	}

	return extractedKeys
}

function unwrapPropertyAccess(expression: ts.Expression): ts.Expression {
	let currentExpression = expression
	while (ts.isPropertyAccessExpression(currentExpression)) {
		currentExpression = currentExpression.name
	}
	return currentExpression
}
