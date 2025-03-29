import path from 'node:path'
import { setTimeout } from 'node:timers'
import chokidar from 'chokidar'
import debounce from 'debounce'
import lodash from 'lodash'
import properLockfile from 'proper-lockfile'
import { objectKeys } from 'ts-extras'
import { log } from './logger.js'
import { extractTranslationKeysFromProject } from './parser.js'
import type { CreateIntlWatcherOptions, IntlWatcherOptions } from './types.js'
import { formatDuration, readDictionaryFile, writeDictionaryFile } from './utils.js'

export function buildIntlWatcherOptions(options: CreateIntlWatcherOptions): IntlWatcherOptions {
	return {
		debounceDelay: options.debounceDelay ?? 500,
		i18nDictionaryPaths: options.i18nDictionaryPaths.map((dictionaryPath) => path.resolve(dictionaryPath)),
		sourceDirectory: options.sourceDirectory ?? './src',
		partitioningOptions: {
			clientFunction: options.partitioningOptions?.clientFunction ?? 'useTranslations',
			serverFunction: options.partitioningOptions?.serverFunction ?? 'getTranslations',
		},
		removeUnusedKeys: options.removeUnusedKeys ?? false,
		applyPartitioning: options.applyPartitioning ?? false,
		defaultTranslationGeneratorFn: options.defaultTranslationGeneratorFn ?? ((key) => `[NYT: ${key}]`),
		tsConfigFilePath: options.tsConfigFilePath ?? 'tsconfig.json',
	}
}

export class IntlWatcher {
	private _isSelfTriggerGuardActive = false

	public constructor(private readonly _options: IntlWatcherOptions) {}

	public startWatching(): void {
		const debouncedScan = debounce(
			() => this.scanSourceFilesForTranslationKeys(),
			this._options.debounceDelay,
		)
		const watcher = chokidar
			.watch(this._options.sourceDirectory, { ignoreInitial: true })
			.on('all', (_event, filename) => {
				const absoluteFilename = path.resolve(filename)
				if (
					!this.shouldProcessFile(absoluteFilename) ||
					(this._options.i18nDictionaryPaths.includes(absoluteFilename) && this._isSelfTriggerGuardActive)
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
		const [clientTranslationKeys, serverTranslationKeys] = extractTranslationKeysFromProject(this._options)

		for (const dictionaryPath of this._options.i18nDictionaryPaths) {
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
				if (this._options.removeUnusedKeys) {
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
				existingMessages[key] ??= this._options.defaultTranslationGeneratorFn(key)
			}

			const updatedMessages = lodash.pick(existingMessages, objectKeys(existingMessages).toSorted())
			this.enabledSelfTriggerGuard()
			writeDictionaryFile(dictionaryPath, updatedMessages)

			if (this._options.applyPartitioning) {
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
		const isDictionary = this._options.i18nDictionaryPaths.includes(filename)
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
		}, this._options.debounceDelay)
	}
}
