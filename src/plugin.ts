import path from 'node:path'
import { setTimeout } from 'node:timers'
import chokidar from 'chokidar'
import debounce from 'debounce'
import lodash from 'lodash'
import properLockfile from 'proper-lockfile'
import { Project } from 'ts-morph'
import { NEXT_INTL_GET_TRANSLATIONS_FUNCTION, NEXT_INTL_USE_TRANSLATIONS_FUNCTION } from './constants.js'
import { log } from './logger.js'
import { extractTranslationKeysFromProject } from './parser.js'
import type { CreateIntlWatcherOptions, IntlWatcherOptions } from './types.js'
import {
	flattenDictionary,
	formatDuration,
	readDictionaryFile,
	unflattenDictionary,
	writeDictionaryFile,
} from './utils.js'

export function buildIntlWatcherOptions(options: CreateIntlWatcherOptions): IntlWatcherOptions {
	const partitioningOptions = options.applyPartitioning
		? {
				applyPartitioning: true as const,
				partitioningOptions: {
					clientFunction: options.partitioningOptions?.clientFunction ?? NEXT_INTL_USE_TRANSLATIONS_FUNCTION,
					serverFunction: options.partitioningOptions?.serverFunction ?? NEXT_INTL_GET_TRANSLATIONS_FUNCTION,
				},
			}
		: {
				applyPartitioning: false as const,
				translationFunctions: [NEXT_INTL_USE_TRANSLATIONS_FUNCTION, NEXT_INTL_GET_TRANSLATIONS_FUNCTION],
			}

	// Resolve effective directories with fallback precedence:
	// watchPaths > sourceDirectories > sourceDirectory > ['./src']
	const resolvedWatchPaths =
		options.watchPaths && options.watchPaths.length > 0
			? options.watchPaths
			: options.sourceDirectories && options.sourceDirectories.length > 0
				? options.sourceDirectories
				: [options.sourceDirectory ?? './src']

	return {
		dictionaryPaths: options.dictionaryPaths.map((dictionaryPath) => path.resolve(dictionaryPath)),
		scanDelay: options.scanDelay ?? 500,
		defaultValue: options.defaultValue ?? ((key) => `[NYT: ${key}]`),
		removeUnusedKeys: options.removeUnusedKeys ?? false,
		watchPaths: resolvedWatchPaths,
		sourceDirectories: resolvedWatchPaths,
		sourceDirectory: resolvedWatchPaths[0] ?? './src',
		tsConfigFilePath: options.tsConfigFilePath ?? 'tsconfig.json',
		...partitioningOptions,
	}
}

export class IntlWatcher {
	private _isSelfTriggerGuardActive = false
	private readonly _changedFiles = new Set<string>()

	public constructor(
		private readonly _options: IntlWatcherOptions,
		private readonly _project = new Project({ tsConfigFilePath: _options.tsConfigFilePath }),
	) {}

	public startWatching(): void {
		const debouncedScan = debounce(() => this.scanSourceFilesForTranslationKeys(), this._options.scanDelay)
		const watcher = chokidar
			.watch(this._options.watchPaths, { ignoreInitial: true })
			.on('all', (_event, filename) => {
				const absoluteFilename = path.resolve(filename)
				if (
					!this.shouldProcessFile(absoluteFilename) ||
					(this._options.dictionaryPaths.includes(absoluteFilename) && this._isSelfTriggerGuardActive)
				) {
					return
				}

				this._changedFiles.add(absoluteFilename)
				debouncedScan()
			})
		process.on('exit', async () => {
			await watcher.close()
		})
	}

	public scanSourceFilesForTranslationKeys(): void {
		log.waiting('Scanning...')
		const startTime = process.hrtime.bigint()

		for (const filePath of this._changedFiles) {
			const sourceFile =
				this._project.getSourceFile(filePath) ?? this._project.addSourceFileAtPathIfExists(filePath)
			sourceFile?.refreshFromFileSystemSync()
		}
		this._changedFiles.clear()

		let skipLogging = false
		const [clientTranslationKeys, serverTranslationKeys] = extractTranslationKeysFromProject(
			this._project,
			this._options,
		)

		for (const dictionaryPath of this._options.dictionaryPaths) {
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
			const messages = flattenDictionary(readDictionaryFile(dictionaryPath))
			const translationKeys = new Set([...clientTranslationKeys, ...serverTranslationKeys])

			for (const key in messages) {
				if (translationKeys.has(key)) {
					continue
				}
				if (this._options.removeUnusedKeys) {
					delete messages[key]
					if (!skipLogging) {
						log.success(`Removed unused i18n key \`${key}\``)
					}
				} else if (!skipLogging) {
					log.warn(`Unused i18n key \`${key}\``)
				}
			}

			for (const key of translationKeys) {
				if (messages[key] === undefined && !skipLogging) {
					log.success(`Added new i18n key \`${key}\``)
				}
				messages[key] ??= this._options.defaultValue(key)
			}

			const flatMessages = lodash.pick(messages, Object.keys(messages).toSorted())
			const updatedMessages = unflattenDictionary(flatMessages)

			this.enabledSelfTriggerGuard()
			writeDictionaryFile(dictionaryPath, updatedMessages)

			if (this._options.applyPartitioning) {
				this.partitionTranslationKeys(
					flatMessages,
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
		const isDictionary = this._options.dictionaryPaths.includes(filename)
		const isDeclarationFile = filename.endsWith('.d.ts') || filename.endsWith('.d.json.ts')

		return (isTsFile || isDictionary) && !isDeclarationFile
	}

	private partitionTranslationKeys(
		messages: Record<string, unknown>,
		clientKeys: string[],
		serverKeys: string[],
		dictionaryPath: string,
	): void {
		const clientDictionary = lodash.pick(messages, clientKeys)
		const serverDictionary = lodash.pick(
			messages,
			serverKeys.filter((key) => !clientKeys.includes(key)),
		)

		const clientMessages = unflattenDictionary(clientDictionary)
		const serverMessages = unflattenDictionary(serverDictionary)

		const { dir, ext, name } = path.parse(dictionaryPath)
		writeDictionaryFile(path.join(dir, `${name}.client${ext}`), clientMessages)
		writeDictionaryFile(path.join(dir, `${name}.server${ext}`), serverMessages)
	}

	private enabledSelfTriggerGuard(): void {
		this._isSelfTriggerGuardActive = true
		setTimeout(() => {
			this._isSelfTriggerGuardActive = false
		}, this._options.scanDelay)
	}
}
