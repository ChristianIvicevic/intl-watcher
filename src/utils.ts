import fs from 'node:fs'
import { log } from './logger.js'

export function runOnce(fn: () => void): void {
	if (process.env.__INTL_WATCHER_INITIALIZED === 'true') {
		return
	}
	process.env.__INTL_WATCHER_INITIALIZED = 'true'
	fn()
}

export function readDictionaryFile(filepath: string): Record<string, string | undefined> {
	try {
		const content = fs.readFileSync(filepath).toString()
		return JSON.parse(content)
	} catch (e) {
		log.warn(`Error reading dictionary file at \`${filepath}\`: ${e}`)
		return {}
	}
}

export function writeDictionaryFile(filepath: string, messages: Record<string, string | undefined>): void {
	const newContent = `${JSON.stringify(messages, undefined, '\t')}\n`
	let currentContent: string | null = null
	try {
		currentContent = fs.readFileSync(filepath, 'utf8')
	} catch (_error) {
		// File will be created.
	}
	if (currentContent !== newContent) {
		fs.writeFileSync(filepath, newContent, { flag: 'w' })
	}
}

export function formatDuration(ms: number): string {
	if (ms < 1_000) {
		return `${ms.toFixed(0).toLocaleString()}ms`
	}
	return `${(ms / 1_000).toPrecision(2).toLocaleString()}s`
}
