import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { type CreateIntlWatcherOptions, createIntlWatcher, syncTranslationKeys } from './index.js'
import { IntlWatcher } from './plugin.js'

describe('createIntlWatcher', () => {
	beforeEach(() => {
		vi.stubEnv('NODE_ENV', 'development')
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.unstubAllEnvs()
	})

	test('should set up and start the IntlWatcher when called in development mode', { timeout: 20_000 }, () => {
		// Given
		const options: CreateIntlWatcherOptions = {
			dictionaryPaths: ['./i18n/en.json'],
			watchPaths: ['./src'],
		}
		vi.spyOn(IntlWatcher.prototype, 'scanSourceFilesForTranslationKeys').mockImplementation(() => {})
		vi.spyOn(IntlWatcher.prototype, 'startWatching').mockImplementation(() => {})

		// When
		const withIntlWatcher = createIntlWatcher(options)
		withIntlWatcher({ reactStrictMode: true })

		// Then
		expect(IntlWatcher.prototype.scanSourceFilesForTranslationKeys).toHaveBeenCalledTimes(1)
		expect(IntlWatcher.prototype.startWatching).toHaveBeenCalledTimes(1)
	})
})

describe('syncTranslationKeys', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	test('should scan source files without starting file watcher', { timeout: 20_000 }, () => {
		// Given
		const options: CreateIntlWatcherOptions = {
			dictionaryPaths: ['./i18n/en.json'],
			watchPaths: ['./src'],
		}
		vi.spyOn(IntlWatcher.prototype, 'scanSourceFilesForTranslationKeys').mockImplementation(() => {})
		vi.spyOn(IntlWatcher.prototype, 'startWatching').mockImplementation(() => {})

		// When
		syncTranslationKeys(options)

		// Then
		expect(IntlWatcher.prototype.scanSourceFilesForTranslationKeys).toHaveBeenCalledTimes(1)
		expect(IntlWatcher.prototype.startWatching).not.toHaveBeenCalled()
	})
})
