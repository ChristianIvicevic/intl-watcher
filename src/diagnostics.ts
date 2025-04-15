import dedent from 'dedent'
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
	const childRelativeLineIndex = childLine - parentStartLine
	const maxLineNumber = parentStartLine + parentTextLines.length - 1
	const lineNumberPadding = maxLineNumber.toString().length

	const snippetWithUnderline = parentTextLines
		.map((line, index) => {
			const expandedLine = expandTabs(line)
			const currentLineNumber = (parentStartLine + index).toString().padStart(lineNumberPadding)
			if (index === childRelativeLineIndex) {
				const leadingText =
					childLine === parentStartLine
						? line.substring(parentStartColumn - 1, childColumn - 1)
						: line.substring(0, childColumn - 1)
				const expandedLeadingText = expandTabs(leadingText)
				const effectiveOffset = expandedLeadingText.length
				const childText = child.getText()
				const firstLineOfChild = childText.split('\n')[0]
				const expandedChildFirstLine = expandTabs(firstLineOfChild)
				const underline = ' '.repeat(effectiveOffset) + pc.red('^'.repeat(expandedChildFirstLine.length))
				return `${currentLineNumber} | ${expandedLine}\n${' '.repeat(lineNumberPadding)} | ${underline}`
			}
			return `${currentLineNumber} | ${expandedLine}`
		})
		.join('\n')

	const headerLine = childLine
	const headerColumn = childColumn
	const header = `${filePath}:${headerLine}:${headerColumn} ${'━'.repeat(
		Math.max(0, 100 - filePath.length - headerLine.toString().length - headerColumn.toString().length - 2),
	)}`

	const snippet = snippetWithUnderline
		.split('\n')
		.map((line) => `${' '.repeat(8)}${line}`)
		.join('\n')
	const formattedSuggestion = suggestion.join('\n').replace(/\n/g, `\n${' '.repeat(10)}`)

	const diagnosticMessage = dedent`
    ${header}

        ${pc.red(pc.bold(errorLabel))} ${pc.red(detailedMessage)}

${snippet}

        ${pc.green(pc.bold('ℹ'))} ${pc.green(formattedSuggestion)}
  `

	logFn(diagnosticMessage)
	log.info()
}

function expandTabs(line: string, tabSize = 2): string {
	return line.replace(/\t/g, ' '.repeat(tabSize))
}
