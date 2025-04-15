import dedent from 'dedent'
import pc from 'picocolors'
import type { Node } from 'ts-morph'
import { ERROR, WARN, log } from './logger.js'
import { getCommonPrefix } from './utils.js'

// biome-ignore lint/style/useNamingConvention: Pseudo enum.
export const Severity = { Error: 'Error', Warn: 'Warn' } as const
export type Severity = (typeof Severity)[keyof typeof Severity]

export function printDiagnostic(
	targetNode: Node,
	contextNode: Node,
	severity: Severity,
	detailedMessage: string,
	...suggestions: string[]
): void {
	const sourceFile = contextNode.getSourceFile()
	const projectFiles = sourceFile.getProject().getSourceFiles()
	const rootDirectory = getCommonPrefix(projectFiles.map((file) => file.getFilePath()))
	const filePath = sourceFile.getFilePath().substring(rootDirectory.length)

	const { line: contextStartLine, column: contextStartColumn } = sourceFile.getLineAndColumnAtPos(
		contextNode.getStart(),
	)
	const { line: targetLine, column: targetColumn } = sourceFile.getLineAndColumnAtPos(targetNode.getStart())

	const contextTextLines = contextNode.getText().split('\n')
	const targetRelativeLineIndex = targetLine - contextStartLine
	const maxLineNumber = contextStartLine + contextTextLines.length - 1
	const lineNumberPadding = maxLineNumber.toString().length

	const snippetWithUnderline = contextTextLines
		.map((line, index) => {
			const expandedLine = expandTabs(line)
			const currentLineNumber = (contextStartLine + index).toString().padStart(lineNumberPadding)
			if (index === targetRelativeLineIndex) {
				const leadingText =
					targetLine === contextStartLine
						? line.substring(contextStartColumn - 1, targetColumn - 1)
						: line.substring(0, targetColumn - 1)
				const expandedLeadingText = expandTabs(leadingText)
				const effectiveOffset = expandedLeadingText.length
				const targetText = targetNode.getText()
				const firstLineOfTarget = targetText.split('\n')[0]
				const expandedTargetFirstLine = expandTabs(firstLineOfTarget)
				const underline = ' '.repeat(effectiveOffset) + pc.red('^'.repeat(expandedTargetFirstLine.length))
				return `${currentLineNumber} | ${expandedLine}\n${' '.repeat(lineNumberPadding)} | ${underline}`
			}
			return `${currentLineNumber} | ${expandedLine}`
		})
		.join('\n')

	const headerLine = targetLine
	const headerColumn = targetColumn
	const header = `${filePath}:${headerLine}:${headerColumn} ${'━'.repeat(
		Math.max(0, 100 - filePath.length - headerLine.toString().length - headerColumn.toString().length - 2),
	)}`

	const { label, logger, formatter } =
		severity === Severity.Error
			? { label: ERROR, logger: log.error, formatter: pc.red }
			: { label: WARN, logger: log.warn, formatter: pc.yellow }
	const snippet = snippetWithUnderline
		.split('\n')
		.map((line) => `${' '.repeat(8)}${line}`)
		.join('\n')
	const formattedSuggestions = suggestions.join('\n').replace(/\n/g, `\n${' '.repeat(10)}`)

	const diagnosticMessage = dedent`
    ${header}

        ${label} ${formatter(detailedMessage)}

        ${snippet}

        ${pc.green(pc.bold('ℹ'))} ${pc.green(formattedSuggestions)}
  `
	logger(diagnosticMessage)
	log.info()
}

function expandTabs(line: string, tabSize = 2): string {
	return line.replace(/\t/g, ' '.repeat(tabSize))
}
