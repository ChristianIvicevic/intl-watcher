import pc from 'picocolors'
import type { Node } from 'ts-morph'
import { log } from './logger.js'
import { getCommonPrefix } from './utils.js'

export function printDiagnostic(
	child: Node,
	parent: Node,
	errorLabel: string,
	detailedMessage: string,
	suggestion: string[],
	logFn: (msg: string) => void = log.error,
): void {
	const sourceFile = parent.getSourceFile()
	const projectFiles = sourceFile.getProject().getSourceFiles()
	const rootDirectory = getCommonPrefix(projectFiles.map((file) => file.getFilePath()))
	const filePath = sourceFile.getFilePath().substring(rootDirectory.length)

	const { line: parentStartLine, column: parentStartColumn } = sourceFile.getLineAndColumnAtPos(
		parent.getStart(),
	)
	const { line: childLine, column: childColumn } = sourceFile.getLineAndColumnAtPos(child.getStart())

	const parentTextLines = parent.getText().split('\n')
	const relativeLineIndex = childLine - parentStartLine
	const snippetLine = parentTextLines[relativeLineIndex] || parentTextLines[0]

	const relativeColumn = childLine === parentStartLine ? childColumn - parentStartColumn : childColumn - 1
	const childText = child.getText()
	const underline = ' '.repeat(relativeColumn) + pc.red('^'.repeat(childText.length))

	const headerLine = childLine
	const headerColumn = childColumn
	const linePadding = headerLine.toString().length
	const header = `${filePath}:${headerLine}:${headerColumn} ${'━'.repeat(Math.max(0, 100 - filePath.length - headerLine.toString().length - headerColumn.toString().length - 2))}`

	const diagnosticMessage = `${header}

  ${errorLabel} ${detailedMessage}

  ${pc.red(pc.bold('>'))} ${headerLine.toString().padStart(linePadding)} | ${snippetLine}
    ${' '.repeat(linePadding)} | ${underline}

  ${pc.green(pc.bold('ℹ'))} ${suggestion.map((line) => pc.green(line)).join('\n    ')}`
	logFn(diagnosticMessage)
	log.info()
}
