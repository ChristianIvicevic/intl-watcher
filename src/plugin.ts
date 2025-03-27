import path from 'node:path'
import { setTimeout } from 'node:timers'
import chokidar from 'chokidar'
import debounce from 'debounce'
import lodash from 'lodash'
import type { NextConfig } from 'next'
import pc from 'picocolors'
import properLockfile from 'proper-lockfile'
import { objectKeys } from 'ts-extras'
import { log } from './logger.js'
import { extractTranslationKeysFromProject } from './parser.js'
import type { CreateIntlWatcherOptions, IntlWatcherOptions } from './types.js'
import { formatDuration, readDictionaryFile, runOnce, writeDictionaryFile } from './utils.js'

export const IntlWatcherOptionsDefaults = {
	debounceDelay: 500,
	sourceDirectory: './src',
	partitioningOptions: {
		clientFunction: 'useTranslations',
		serverFunction: 'getTranslations',
	},
	removeUnusedKeys: false,
	applyPartitioning: false,
	defaultTranslationGeneratorFn: (key: string) => `[NYT: ${key}]`,
	tsConfigFilePath: 'tsconfig.json',
} as const

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
export function createIntlWatcher({
	debounceDelay = IntlWatcherOptionsDefaults.debounceDelay,
	i18nDictionaryPaths,
	sourceDirectory = IntlWatcherOptionsDefaults.sourceDirectory,
	partitioningOptions,
	removeUnusedKeys = IntlWatcherOptionsDefaults.removeUnusedKeys,
	applyPartitioning = IntlWatcherOptionsDefaults.applyPartitioning,
	defaultTranslationGeneratorFn = IntlWatcherOptionsDefaults.defaultTranslationGeneratorFn,
	tsConfigFilePath = IntlWatcherOptionsDefaults.tsConfigFilePath,
}: CreateIntlWatcherOptions): (config: NextConfig) => NextConfig {
	return function withIntlWatcher(config) {
		runOnce(() =>
			setupIntlWatcher({
				debounceDelay,
				i18nDictionaryPaths: i18nDictionaryPaths.map((dictionaryPath) => path.resolve(dictionaryPath)),
				sourceDirectory,
				partitioningOptions: {
					clientFunction:
						partitioningOptions?.clientFunction ??
						IntlWatcherOptionsDefaults.partitioningOptions.clientFunction,
					serverFunction:
						partitioningOptions?.serverFunction ??
						IntlWatcherOptionsDefaults.partitioningOptions.serverFunction,
				},
				removeUnusedKeys,
				applyPartitioning,
				defaultTranslationGeneratorFn,
				tsConfigFilePath,
			}),
		)
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

export class IntlWatcher {
	private _isSelfTriggerGuardActive = false

	public constructor(private readonly options: IntlWatcherOptions) {}

	public startWatching(): void {
		const debouncedScan = debounce(() => this.scanSourceFilesForTranslationKeys(), this.options.debounceDelay)
		const watcher = chokidar
			.watch(this.options.sourceDirectory, { ignoreInitial: true })
			.on('all', (_event, filename) => {
				const absoluteFilename = path.resolve(filename)
				if (
					!this.shouldProcessFile(absoluteFilename) ||
					(this.options.i18nDictionaryPaths.includes(absoluteFilename) && this._isSelfTriggerGuardActive)
				) {
					return
				}

				debouncedScan()
			})
		process.on('exit', async () => {
			await watcher.close()
		})
	}

	public scanSourceFilesForTranslationKeys(): void {
		log.waiting('Scanning...')
		const startTime = process.hrtime.bigint()

		let skipLogging = false
		const [clientTranslationKeys, serverTranslationKeys] = extractTranslationKeysFromProject(this.options)

		for (const dictionaryPath of this.options.i18nDictionaryPaths) {
			this.synchronizeDictionaryFile(
				dictionaryPath,
				clientTranslationKeys,
				serverTranslationKeys,
				skipLogging,
			)
			skipLogging = true
		}

		const endTime = process.hrtime.bigint()
		const delta = Number(endTime - startTime) / 1e6
		log.success(`Finished in ${formatDuration(delta)}`)
	}

	private synchronizeDictionaryFile(
		dictionaryPath: string,
		clientTranslationKeys: string[],
		serverTranslationKeys: string[],
		skipLogging: boolean,
	): void {
		const release = properLockfile.lockSync(dictionaryPath)
		try {
			const existingMessages = readDictionaryFile(dictionaryPath)

			const unusedKeys = objectKeys(existingMessages).filter(
				(key) => !(clientTranslationKeys.includes(key) || serverTranslationKeys.includes(key)),
			)
			for (const key of unusedKeys) {
				if (this.options.removeUnusedKeys) {
					existingMessages[key] = undefined
					if (!skipLogging) {
						log.success(`Removed unused i18n key \`${key}\``)
					}
				} else if (!skipLogging) {
					log.warn(`Unused i18n key \`${key}\``)
				}
			}

			for (const key of [...clientTranslationKeys, ...serverTranslationKeys]) {
				if (existingMessages[key] === undefined && !skipLogging) {
					log.success(`Added new i18n key \`${key}\``)
				}
				existingMessages[key] ??= this.options.defaultTranslationGeneratorFn(key)
			}

			const updatedMessages = lodash.pick(existingMessages, objectKeys(existingMessages).toSorted())
			this.enabledSelfTriggerGuard()
			writeDictionaryFile(dictionaryPath, updatedMessages)

			if (this.options.applyPartitioning) {
				this.partitionTranslationKeys(
					updatedMessages,
					clientTranslationKeys,
					serverTranslationKeys,
					dictionaryPath,
				)
			}
		} finally {
			release()
		}
	}

	private shouldProcessFile(filename: string): boolean {
		const isTsFile = filename.endsWith('.ts') || filename.endsWith('.tsx')
		const isDictionary = this.options.i18nDictionaryPaths.includes(filename)
		const isDeclarationFile = filename.endsWith('.d.ts') || filename.endsWith('.d.json.ts')

		return (isTsFile || isDictionary) && !isDeclarationFile
	}

	private partitionTranslationKeys(
		messages: Record<string, string | undefined>,
		extractedClientKeys: string[],
		extractedServerKeys: string[],
		dictionaryPath: string,
	): void {
		const clientMessages = lodash.pick(messages, extractedClientKeys)
		const serverMessages = lodash.pick(
			messages,
			extractedServerKeys.filter((variable) => !extractedClientKeys.includes(variable)),
		)

		const { dir, ext, name } = path.parse(dictionaryPath)
		writeDictionaryFile(path.join(dir, `${name}.client${ext}`), clientMessages)
		writeDictionaryFile(path.join(dir, `${name}.server${ext}`), serverMessages)
	}

	private enabledSelfTriggerGuard(): void {
		this._isSelfTriggerGuardActive = true
		setTimeout(() => {
			this._isSelfTriggerGuardActive = false
		}, this.options.debounceDelay)
	}
}
