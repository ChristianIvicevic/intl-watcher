import os from 'node:os'
import path from 'node:path'
import fs from 'fs-extra'
import type { PartialDeep } from 'type-fest'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { NEXT_INTL_GET_TRANSLATIONS_FUNCTION, NEXT_INTL_USE_TRANSLATIONS_FUNCTION } from './constants.js'
import { buildIntlWatcherOptions, IntlWatcher } from './plugin.js'
import type { CreateIntlWatcherOptions, IntlWatcherOptions } from './types.js'

const TIMING_REGEX = /Finished in \d+(\.\d+)?(ms|s)/g

describe('intl-watcher plugin', () => {
	let tempDir: string

	function createDefaultWatcherOptions(
		dictionaryPaths: string[],
		pluginOptions?: PartialDeep<CreateIntlWatcherOptions>,
	): IntlWatcherOptions {
		return buildIntlWatcherOptions({
			dictionaryPaths,
			watchPaths: [path.join(tempDir, 'src')],
			tsConfigFilePath: path.join(tempDir, 'tsconfig.json'),
			...pluginOptions,
		})
	}

	function getDictionaryPaths(language = 'en') {
		return [
			path.join(tempDir, `src/i18n/${language}.json`),
			path.join(tempDir, `src/i18n/${language}.client.json`),
			path.join(tempDir, `src/i18n/${language}.server.json`),
		] as const
	}

	function getNormalizedConsoleOutput(): string {
		const logs = vi.mocked(console.log).mock.calls
		const warns = vi.mocked(console.warn).mock.calls
		const errors = vi.mocked(console.error).mock.calls
		const output = [...logs, ...warns, ...errors].join('\n')
		return output
			.replaceAll(TIMING_REGEX, 'Finished in <timing>')
			.split('\n')
			.map((line) => line.trim())
			.join('\n')
	}

	beforeEach(async () => {
		tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'fixture-'))
		await fs.copy(path.join(__dirname, '../test/fixture'), tempDir, {
			filter: (src) => path.basename(src) !== 'node_modules' && !src.includes('/fixtures/'),
		})
		vi.spyOn(console, 'log')
		vi.spyOn(console, 'warn')
		vi.spyOn(console, 'error')
	})

	afterEach(async () => {
		await fs.remove(tempDir)
		vi.restoreAllMocks()
	})

	async function doTest(
		fixtureFiles: string[],
		options?: { pluginOptions?: PartialDeep<CreateIntlWatcherOptions>; enableMultiLanguage?: boolean },
	) {
		// Given
		await Promise.all(
			fixtureFiles.map((fixtureFile) => {
				const sourcePath = path.join(__dirname, '../test/fixture/src/app/fixtures', fixtureFile)
				const destinationPath = path.join(tempDir, 'src/app/fixtures', fixtureFile)
				return fs.copy(sourcePath, destinationPath)
			}),
		)
		const [mainDictionary, clientDictionary, serverDictionary] = getDictionaryPaths()
		const [otherMainDictionary, otherClientDictionary, otherServerDictionary] = getDictionaryPaths('de')
		const watcherOptions = createDefaultWatcherOptions(
			options?.enableMultiLanguage ? [mainDictionary, otherMainDictionary] : [mainDictionary],
			options?.pluginOptions ?? {},
		)
		const watcher = new IntlWatcher(watcherOptions)
		// When
		watcher.scanSourceFilesForTranslationKeys()
		// Then
		expect((await fs.readFile(mainDictionary)).toString()).toMatchSnapshot()
		if (options?.enableMultiLanguage) {
			expect((await fs.readFile(otherMainDictionary)).toString()).toMatchSnapshot()
		}

		async function verifyPartitionedFile(filePath: string) {
			if (watcherOptions.applyPartitioning) {
				expect((await fs.readFile(filePath)).toString()).toMatchSnapshot()
			} else {
				expect(await fs.pathExists(filePath)).toBeFalsy()
			}
		}

		await verifyPartitionedFile(clientDictionary)
		await verifyPartitionedFile(serverDictionary)
		if (options?.enableMultiLanguage) {
			await verifyPartitionedFile(otherClientDictionary)
			await verifyPartitionedFile(otherServerDictionary)
		}

		expect(getNormalizedConsoleOutput()).toMatchSnapshot()
	}

	describe('buildIntlWatcherOptions', () => {
		test('validates tabWidth and logs warning for invalid values', () => {
			const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

			const optionsNegative = buildIntlWatcherOptions({
				dictionaryPaths: ['./i18n/en.json'],
				tabWidth: -1,
			})
			expect(optionsNegative.tabWidth).toBe(4)
			expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid tabWidth value: -1'))
			expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Using default value of 4'))

			consoleWarnSpy.mockClear()

			const optionsFloat = buildIntlWatcherOptions({
				dictionaryPaths: ['./i18n/en.json'],
				tabWidth: 2.5,
			})
			expect(optionsFloat.tabWidth).toBe(4)
			expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid tabWidth value: 2.5'))
			expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Using default value of 4'))

			consoleWarnSpy.mockClear()

			const optionsZero = buildIntlWatcherOptions({
				dictionaryPaths: ['./i18n/en.json'],
				tabWidth: 0,
			})
			expect(optionsZero.tabWidth).toBe(4)
			expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid tabWidth value: 0'))
			expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Using default value of 4'))

			consoleWarnSpy.mockRestore()
		})

		test('accepts valid tabWidth values', () => {
			const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

			const options2 = buildIntlWatcherOptions({
				dictionaryPaths: ['./i18n/en.json'],
				tabWidth: 2,
			})
			expect(options2.tabWidth).toBe(2)
			expect(consoleWarnSpy).not.toHaveBeenCalled()

			const options4 = buildIntlWatcherOptions({
				dictionaryPaths: ['./i18n/en.json'],
				tabWidth: 4,
			})
			expect(options4.tabWidth).toBe(4)
			expect(consoleWarnSpy).not.toHaveBeenCalled()

			const options8 = buildIntlWatcherOptions({
				dictionaryPaths: ['./i18n/en.json'],
				tabWidth: 8,
			})
			expect(options8.tabWidth).toBe(8)
			expect(consoleWarnSpy).not.toHaveBeenCalled()

			consoleWarnSpy.mockRestore()
		})
	})

	describe('flat dictionaries', () => {
		describe('single language', () => {
			test('default options', async () => doTest(['default-server.tsx', 'default-client.tsx']))

			test('unused key removal', async () =>
				doTest(['default-server.tsx', 'default-client.tsx'], { pluginOptions: { removeUnusedKeys: true } }))

			test('dictionary partitioning', async () =>
				doTest(['default-server.tsx', 'default-client.tsx'], {
					pluginOptions: {
						applyPartitioning: true,
						partitioningOptions: {
							clientFunction: NEXT_INTL_USE_TRANSLATIONS_FUNCTION,
							serverFunction: NEXT_INTL_GET_TRANSLATIONS_FUNCTION,
						},
					},
				}))

			test('custom fallback for new keys', async () =>
				doTest(['default-server.tsx', 'default-client.tsx'], {
					pluginOptions: {
						defaultValue: (key) => `[Missing translation: ${key}]`,
					},
				}))

			test('custom partitioning function names', async () =>
				doTest(['custom-server.tsx', 'custom-client.tsx'], {
					pluginOptions: {
						applyPartitioning: true,
						partitioningOptions: {
							clientFunction: 'translate',
							serverFunction: 'translateOnServer',
						},
					},
				}))
		})

		describe('multiple languages', () => {
			test('default options', async () =>
				doTest(['default-server.tsx', 'default-client.tsx'], { enableMultiLanguage: true }))

			test('dictionary partitioning', async () =>
				doTest(['default-server.tsx', 'default-client.tsx'], {
					enableMultiLanguage: true,
					pluginOptions: {
						applyPartitioning: true,
						partitioningOptions: {
							clientFunction: NEXT_INTL_USE_TRANSLATIONS_FUNCTION,
							serverFunction: NEXT_INTL_GET_TRANSLATIONS_FUNCTION,
						},
					},
				}))
		})

		describe('edge cases', () => {
			test('server-side options', async () => doTest(['server-options.tsx']))
		})
	})

	describe('namespaced dictionaries', () => {
		describe('single language', () => {
			test('default options', async () => doTest(['namespaces-client.tsx', 'namespaces-server.tsx']))

			test('unused key removal', async () =>
				doTest(['namespaces-client.tsx', 'namespaces-server.tsx'], {
					pluginOptions: { removeUnusedKeys: true },
				}))

			test('dictionary partitioning', async () =>
				doTest(['namespaces-client.tsx', 'namespaces-server.tsx'], {
					pluginOptions: {
						applyPartitioning: true,
						partitioningOptions: {
							clientFunction: NEXT_INTL_USE_TRANSLATIONS_FUNCTION,
							serverFunction: NEXT_INTL_GET_TRANSLATIONS_FUNCTION,
						},
					},
				}))

			test('custom fallback for new keys', async () =>
				doTest(['namespaces-client.tsx', 'namespaces-server.tsx'], {
					pluginOptions: {
						defaultValue: (key) => `[Missing translation: ${key}]`,
					},
				}))

			test('custom partitioning function names', async () =>
				doTest(['custom-namespaces-client.tsx', 'custom-namespaces-server.tsx'], {
					pluginOptions: {
						applyPartitioning: true,
						partitioningOptions: {
							clientFunction: 'translate',
							serverFunction: 'translateOnServer',
						},
					},
				}))
		})

		describe('multiple languages', () => {
			test('default options', async () =>
				doTest(['namespaces-client.tsx', 'namespaces-server.tsx'], { enableMultiLanguage: true }))

			test('dictionary partitioning', async () =>
				doTest(['namespaces-client.tsx', 'namespaces-server.tsx'], {
					enableMultiLanguage: true,
					pluginOptions: {
						applyPartitioning: true,
						partitioningOptions: {
							clientFunction: NEXT_INTL_USE_TRANSLATIONS_FUNCTION,
							serverFunction: NEXT_INTL_GET_TRANSLATIONS_FUNCTION,
						},
					},
				}))
		})

		describe('edge cases', () => {
			test('server-side options', async () => doTest(['namespaces-locale.tsx']))
		})

		describe('error handling', () => {
			test('dynamic namespace', async () => doTest(['dynamic-namespaces.tsx']))
		})
	})

	describe('indentation options', () => {
		test('custom indentation - 4 spaces', async () =>
			doTest(['default-server.tsx', 'default-client.tsx'], {
				pluginOptions: { useTabs: false, tabWidth: 4 },
			}))

		test('custom indentation - 2 spaces', async () =>
			doTest(['default-server.tsx', 'default-client.tsx'], {
				pluginOptions: { useTabs: false, tabWidth: 2 },
			}))

		test('custom indentation - spaces with default width', async () =>
			doTest(['default-server.tsx', 'default-client.tsx'], {
				pluginOptions: { useTabs: false },
			}))

		test('custom indentation - explicit tabs', async () =>
			doTest(['default-server.tsx', 'default-client.tsx'], {
				pluginOptions: { useTabs: true },
			}))

		test('custom indentation with partitioning', async () =>
			doTest(['default-server.tsx', 'default-client.tsx'], {
				pluginOptions: {
					useTabs: false,
					tabWidth: 2,
					applyPartitioning: true,
					partitioningOptions: {
						clientFunction: NEXT_INTL_USE_TRANSLATIONS_FUNCTION,
						serverFunction: NEXT_INTL_GET_TRANSLATIONS_FUNCTION,
					},
				},
			}))
	})

	describe('error handling', () => {
		test('unsupported expression', async () => doTest(['unsupported-expression.tsx']))
	})

	describe('regressions', () => {
		// https://github.com/ChristianIvicevic/intl-watcher/issues/21
		test('property access expression in template literal', async () =>
			doTest(['issues/21-property-access-in-template-literal.tsx']))

		// https://github.com/ChristianIvicevic/intl-watcher/issues/87
		test('shorthand property assignment in server options', async () =>
			doTest(['issues/87-shorthand-property-assignment-in-server-options.tsx']))
	})
})
