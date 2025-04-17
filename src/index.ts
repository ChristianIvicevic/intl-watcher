import type { NextConfig } from 'next'
import pc from 'picocolors'
import { log } from './logger.js'
import { IntlWatcher, buildIntlWatcherOptions } from './plugin.js'
import type { CreateIntlWatcherOptions, IntlWatcherOptions } from './types.js'
import { runOnce } from './utils.js'

export type { CreateIntlWatcherOptions }

/**
 * Wraps your Next.js configuration to enable automatic scanning and syncing of i18n keys.
 *
 * @param options Configuration for file watching and dictionary synchronization.
 * @returns A Next.js config enhancer that starts the watcher in development mode.
 *
 * @example
 * const withIntlWatcher = createIntlWatcher({
 * 	i18nDictionaryPaths: ['./i18n/en.json', './i18n/de.json'],
 * })
 *
 * export default withIntlWatcher({
 *   reactStrictMode: true,
 *   // other Next.js config options
 * })
 */
export function createIntlWatcher(options: CreateIntlWatcherOptions): (config: NextConfig) => NextConfig {
	const fullOptions = buildIntlWatcherOptions(options)
	return function withIntlWatcher(config) {
		runOnce(() => setupIntlWatcher(fullOptions))
		return config
	}
}

function setupIntlWatcher(options: IntlWatcherOptions): void {
	const env = process.env['NODE_ENV'.trim()]
	if (env !== 'development') {
		return
	}

	log.info(`   🌐 ${pc.blue(pc.bold('intl-watcher plugin for Next.js'))}`)
	log.info()
	log.success('Starting...')
	const watcher = new IntlWatcher(options)
	watcher.scanSourceFilesForTranslationKeys()
	log.info()
	watcher.startWatching()
}
