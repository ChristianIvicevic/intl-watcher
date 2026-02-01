import dedent from 'dedent'
import pc from 'picocolors'
import type { Node, SourceFile } from 'ts-morph'
import { ERROR, log, WARN } from './logger.js'
import { getCommonPrefix } from './utils.js'

export const Severity = { Error: 'Error', Warn: 'Warn' } as const
export type Severity = (typeof Severity)[keyof typeof Severity]

type DiagnosticConfig = {
	label: string
	logger: (message: string) => void
	formatter: (message: string) => string
}

function getDiagnosticConfig(severity: Severity): DiagnosticConfig {
	return severity === Severity.Error
		? { label: ERROR, logger: log.error, formatter: pc.red }
		: { label: WARN, logger: log.warn, formatter: pc.yellow }
}

function generateHeader(sourceFile: SourceFile, targetLine: number, targetColumn: number): string {
	const projectFiles = sourceFile.getProject().getSourceFiles()
	const rootDirectory = getCommonPrefix(projectFiles.map((file) => file.getFilePath()))
	const filePath = sourceFile.getFilePath().slice(rootDirectory.length)
	return `${filePath}:${targetLine}:${targetColumn} ${'━'.repeat(
		Math.max(0, 100 - filePath.length - targetLine.toString().length - targetColumn.toString().length - 2),
	)}`
}

function buildSnippet(contextNode: Node, targetNode: Node): string {
	const sourceFile = contextNode.getSourceFile()
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
						? line.slice(contextStartColumn - 1, targetColumn - 1)
						: line.slice(0, targetColumn - 1)
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

	return snippetWithUnderline
		.split('\n')
		.map((line) => `${' '.repeat(8)}${line}`)
		.join('\n')
}

function formatSuggestions(suggestions: string[]): string {
	return suggestions.join('\n').replaceAll('\n', `\n${' '.repeat(10)}`)
}

export function printDiagnostic(
	targetNode: Node,
	contextNode: Node,
	severity: Severity,
	detailedMessage: string,
	...suggestions: string[]
): void {
	const sourceFile = contextNode.getSourceFile()
	const { line: targetLine, column: targetColumn } = sourceFile.getLineAndColumnAtPos(targetNode.getStart())

	const header = generateHeader(sourceFile, targetLine, targetColumn)
	const snippet = buildSnippet(contextNode, targetNode)
	const formattedSuggestions = formatSuggestions(suggestions)
	const { label, logger, formatter } = getDiagnosticConfig(severity)

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
	return line.replaceAll('\t', ' '.repeat(tabSize))
}
