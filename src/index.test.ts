import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { type CreateIntlWatcherOptions, createIntlWatcher } from './index.js'
import { IntlWatcher } from './plugin.js'

describe('createIntlWatcher', () => {
	beforeEach(() => {
		vi.stubEnv('NODE_ENV', 'development')
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.unstubAllEnvs()
	})

	test('should set up and start the IntlWatcher when called in development mode', () => {
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
	}, 20_000)
})
