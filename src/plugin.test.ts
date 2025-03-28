import os from 'node:os'
import path from 'node:path'
import { setTimeout } from 'node:timers/promises'
import fs from 'fs-extra'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ERROR, SUCCESS, WAITING, WARN } from './logger.js'
import { IntlWatcher, IntlWatcherOptionsDefaults } from './plugin.js'
import type { IntlWatcherOptions } from './types.js'

const TIMING_REGEX = /Finished in \d+(\.\d+)?(ms|s)/g

describe('intl-watcher plugin tests', () => {
	let tempDir: string
	let logSpy: ReturnType<typeof vi.spyOn>

	function createDefaultWatcherOptions(i18nDictionaryPaths: string[]): IntlWatcherOptions {
		return {
			applyPartitioning: IntlWatcherOptionsDefaults.applyPartitioning,
			debounceDelay: IntlWatcherOptionsDefaults.debounceDelay,
			defaultTranslationGeneratorFn: IntlWatcherOptionsDefaults.defaultTranslationGeneratorFn,
			i18nDictionaryPaths,
			partitioningOptions: { ...IntlWatcherOptionsDefaults.partitioningOptions },
			removeUnusedKeys: IntlWatcherOptionsDefaults.removeUnusedKeys,
			sourceDirectory: path.join(tempDir, 'src'),
			tsConfigFilePath: path.join(tempDir, 'tsconfig.json'),
		}
	}

	function getDictionaryPaths(language = 'en') {
		return [
			path.join(tempDir, `src/i18n/${language}.json`),
			path.join(tempDir, `src/i18n/${language}.client.json`),
			path.join(tempDir, `src/i18n/${language}.server.json`),
		] as const
	}

	function getNormalizedConsoleOutput(): string {
		const output = logSpy.mock.calls.join('\n')
		return output
			.replaceAll(TIMING_REGEX, 'Finished in <timing>')
			.replaceAll(SUCCESS, '')
			.replaceAll(WARN, '')
			.replaceAll(ERROR, '')
			.replaceAll(WAITING, '')
			.split('\n')
			.map((line) => line.trim())
			.join('\n')
	}

	beforeEach(async () => {
		tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'fixture-'))
		await fs.copy(path.join(__dirname, '../test/fixture'), tempDir, {
			filter: (src) => path.basename(src) !== 'node_modules',
		})
		logSpy = vi.spyOn(console, 'log').mockImplementation(() => {
			// noop
		})
	})

	afterEach(async () => {
		await fs.remove(tempDir)
		logSpy.mockRestore()
	})

	it('should work with the default options', async () => {
		// Given
		const [main, client, server] = getDictionaryPaths()
		const watcherOptions = createDefaultWatcherOptions([main])
		const watcher = new IntlWatcher(watcherOptions)
		// When
		watcher.scanSourceFilesForTranslationKeys()
		// Then
		expect((await fs.readFile(main)).toString()).toMatchSnapshot()
		expect(await fs.pathExists(client)).toBeFalsy()
		expect(await fs.pathExists(server)).toBeFalsy()
		expect(getNormalizedConsoleOutput()).toMatchSnapshot()
	})

	it('should work with the default options for multiple languages', async () => {
		// Given
		const [main, client, server] = getDictionaryPaths()
		const [mainDe, clientDe, serverDe] = getDictionaryPaths('de')
		const watcherOptions = createDefaultWatcherOptions([main, mainDe])
		const watcher = new IntlWatcher(watcherOptions)
		// When
		watcher.scanSourceFilesForTranslationKeys()
		// Then
		expect((await fs.readFile(main)).toString()).toMatchSnapshot()
		expect((await fs.readFile(mainDe)).toString()).toMatchSnapshot()
		expect(await fs.pathExists(client)).toBeFalsy()
		expect(await fs.pathExists(server)).toBeFalsy()
		expect(await fs.pathExists(clientDe)).toBeFalsy()
		expect(await fs.pathExists(serverDe)).toBeFalsy()
		expect(getNormalizedConsoleOutput()).toMatchSnapshot()
	})

	it('should remove unused keys', async () => {
		// Given
		const [main, client, server] = getDictionaryPaths()
		const watcherOptions = createDefaultWatcherOptions([main])
		watcherOptions.removeUnusedKeys = true
		const watcher = new IntlWatcher(watcherOptions)
		// When
		watcher.scanSourceFilesForTranslationKeys()
		// Then
		expect((await fs.readFile(main)).toString()).toMatchSnapshot()
		expect(await fs.pathExists(client)).toBeFalsy()
		expect(await fs.pathExists(server)).toBeFalsy()
		expect(getNormalizedConsoleOutput()).toMatchSnapshot()
	})

	it('should be possible to partition dictionaries into server and client bundles', async () => {
		// Given
		const [main, client, server] = getDictionaryPaths()
		const watcherOptions = createDefaultWatcherOptions([main])
		watcherOptions.applyPartitioning = true
		const watcher = new IntlWatcher(watcherOptions)
		// When
		watcher.scanSourceFilesForTranslationKeys()
		// Then
		expect((await fs.readFile(main)).toString()).toMatchSnapshot()
		expect((await fs.readFile(client)).toString()).toMatchSnapshot()
		expect((await fs.readFile(server)).toString()).toMatchSnapshot()
		expect(getNormalizedConsoleOutput()).toMatchSnapshot()
	})

	it('should be possible to partition dictionaries into server and client bundles for multiple languages', async () => {
		// Given
		const [main, client, server] = getDictionaryPaths()
		const [mainDe, clientDe, serverDe] = getDictionaryPaths('de')
		const watcherOptions = createDefaultWatcherOptions([main, mainDe])
		watcherOptions.applyPartitioning = true
		const watcher = new IntlWatcher(watcherOptions)
		// When
		watcher.scanSourceFilesForTranslationKeys()
		// Then
		expect((await fs.readFile(main)).toString()).toMatchSnapshot()
		expect((await fs.readFile(mainDe)).toString()).toMatchSnapshot()
		expect((await fs.readFile(client)).toString()).toMatchSnapshot()
		expect((await fs.readFile(server)).toString()).toMatchSnapshot()
		expect((await fs.readFile(clientDe)).toString()).toMatchSnapshot()
		expect((await fs.readFile(serverDe)).toString()).toMatchSnapshot()
		expect(getNormalizedConsoleOutput()).toMatchSnapshot()
	})

	it('should be possible to change the default fallback values for new keys', async () => {
		// Given
		const [main, client, server] = getDictionaryPaths()
		const watcherOptions = createDefaultWatcherOptions([main])
		watcherOptions.defaultTranslationGeneratorFn = (key) => `[Missing translation: ${key}]`
		const watcher = new IntlWatcher(watcherOptions)
		// When
		watcher.scanSourceFilesForTranslationKeys()
		// Then
		expect((await fs.readFile(main)).toString()).toMatchSnapshot()
		expect(await fs.pathExists(client)).toBeFalsy()
		expect(await fs.pathExists(server)).toBeFalsy()
		expect(getNormalizedConsoleOutput()).toMatchSnapshot()
	})

	it('should be possible to change names of translation functions for partitioning', async () => {
		// Given
		const [main, client, server] = getDictionaryPaths()
		const watcherOptions = createDefaultWatcherOptions([main])
		watcherOptions.applyPartitioning = true
		watcherOptions.partitioningOptions.clientFunction = 'translate'
		watcherOptions.partitioningOptions.serverFunction = 'translateOnServer'
		const watcher = new IntlWatcher(watcherOptions)
		// When
		watcher.scanSourceFilesForTranslationKeys()
		// Then
		expect((await fs.readFile(main)).toString()).toMatchSnapshot()
		expect((await fs.readFile(client)).toString()).toMatchSnapshot()
		expect((await fs.readFile(server)).toString()).toMatchSnapshot()
		expect(getNormalizedConsoleOutput()).toMatchSnapshot()
	})

	it('should be idempotent', async () => {
		// Given
		const [main, client, server] = getDictionaryPaths()
		const watcherOptions = createDefaultWatcherOptions([main])
		const watcher = new IntlWatcher(watcherOptions)
		// When
		watcher.scanSourceFilesForTranslationKeys()
		await setTimeout(watcherOptions.debounceDelay * 1.5)
		watcher.scanSourceFilesForTranslationKeys()
		// Then
		expect((await fs.readFile(main)).toString()).toMatchSnapshot()
		expect(await fs.pathExists(client)).toBeFalsy()
		expect(await fs.pathExists(server)).toBeFalsy()
		expect(getNormalizedConsoleOutput()).toMatchSnapshot()
	})
})
