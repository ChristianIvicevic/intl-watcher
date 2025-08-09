import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { type CreateIntlWatcherOptions, createIntlWatcher } from './index.js'
import * as plugin from './plugin.js'

vi.mock('./plugin.js', async (importOriginal) => {
	return {
		...(await importOriginal<typeof import('./plugin.js')>()),
		IntlWatcher: vi.fn().mockImplementation(
			(): Partial<plugin.IntlWatcher> => ({
				scanSourceFilesForTranslationKeys: vi.fn(),
				startWatching: vi.fn(),
			}),
		),
	}
})

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

		// When
		const withIntlWatcher = createIntlWatcher(options)
		withIntlWatcher({ reactStrictMode: true })

		// Then
		expect(plugin.IntlWatcher).toHaveBeenCalledTimes(1)
		const intlWatcher = vi.mocked(plugin.IntlWatcher).mock.results[0].value
		expect(intlWatcher.scanSourceFilesForTranslationKeys).toHaveBeenCalledTimes(1)
		expect(intlWatcher.startWatching).toHaveBeenCalledTimes(1)
	})
})
