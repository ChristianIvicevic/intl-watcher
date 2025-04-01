import type { RequiredDeep } from 'type-fest'

export type CreateIntlWatcherOptions = {
	/**
	 * The file paths to the JSON dictionaries (one per language) that hold i18n keys and their default translation
	 * values. These files will be updated automatically with new keys and cleaned up of unused keys if enabled.
	 */
	i18nDictionaryPaths: string[]
	/**
	 * Flag to enable translation key partitioning between client and server. When enabled, keys are divided based on the
	 * defined translation function identifiers. Defaults to false.
	 */
	applyPartitioning?: boolean
	/**
	 * The debounce delay in milliseconds for scanning source files. This delay prevents redundant scans during rapid file
	 * changes. Defaults to 500 ms.
	 */
	debounceDelay?: number
	/**
	 * A function that generates a default translation value for a new key. It receives the key as an argument and returns
	 * a string. The default implementation returns a value formatted as `[NYT: <key>]`.
	 */
	defaultTranslationGeneratorFn?(key: string): string
	/**
	 * Configuration options for partitioning translation keys between client and server.
	 */
	partitioningOptions?: {
		/**
		 * The identifier for the client-side translation function. Used to determine which keys belong to the client.
		 * Defaults to 'useTranslations'.
		 */
		clientFunction?: string
		/**
		 * The identifier for the server-side translation function. Used to separate server-specific keys. Defaults to
		 * 'getTranslations'.
		 */
		serverFunction?: string
	}
	/**
	 * When set to true, the watcher will remove keys from the dictionary that are no longer used in the source files. If
	 * false, unused keys will trigger a warning. Defaults to false.
	 */
	removeUnusedKeys?: boolean
	/**
	 * The relative path to the directory containing source files to be scanned for translation keys. Defaults to ‘./src’.
	 */
	sourceDirectory?: string
	/**
	 * File path to the tsconfig.json used to deduce which files to scan. Defaults to 'tsconfig.json'.
	 */
	tsConfigFilePath?: string
}

export type IntlWatcherOptions = RequiredDeep<CreateIntlWatcherOptions>
