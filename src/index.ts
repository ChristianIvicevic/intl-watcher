import type { NextConfig } from 'next'
import pc from 'picocolors'
import { log } from './logger.js'
import { IntlWatcher, buildIntlWatcherOptions } from './plugin.js'
import type { CreateIntlWatcherOptions, IntlWatcherOptions } from './types.js'
import { runOnce } from './utils.js'

export type { CreateIntlWatcherOptions }

/**
 * Initializes and configures the intl-watcher plugin for Next.js.
 *
 * This function creates a higher-order function that wraps your Next.js configuration. It sets up a file watcher to
 * scan your source files for i18n translation keys and synchronizes these keys with JSON dictionary files. The options
 * allow you to adjust debouncing, specify the source directory, define the dictionary file paths, partition keys for
 * client and server translation functions, decide whether to remove unused keys, and customize the default value
 * generation for new keys.
 *
 * @param options - Configuration options for the i18n watcher.
 *
 * @returns A function that takes a Next.js configuration, initializes the watcher, and returns the modified
 * configuration.
 *
 * @example
 * const withIntlWatcher = createIntlWatcher({
 *   debounceDelay: 600,
 *   i18nDictionaryPaths: ['./locales/i18n.json'],
 *   sourceDirectory: './src',
 *   partitioningOptions: { clientFunction: 'translate', serverFunction: 'translateOnServer' },
 *   removeUnusedKeys: true,
 *   applyPartitioning: true,
 *   defaultTranslationGeneratorFn: (key) => `Missing: ${key}`,
 * });
 *
 * export default withIntlWatcher({
 *   reactStrictMode: true,
 *   // other Next.js config options
 * });
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
