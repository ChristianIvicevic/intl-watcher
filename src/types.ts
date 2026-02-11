import type { RequiredDeep, SimplifyDeep } from 'type-fest'

/**
 * Configuration options for creating the intl watcher, with or without partitioning.
 */
export type CreateIntlWatcherOptions = SimplifyDeep<WithPartitioning | WithoutPartitioning>

/**
 * Configuration options for creating the intl watcher, with or without partitioning.
 */
type BaseOptions = {
	/** Function to generate a default translation for new keys. */
	defaultValue?(key: string): string
	/** Paths to JSON dictionary files for each language. */
	dictionaryPaths: string[]
	/** Remove keys not found in source files when true; otherwise warn on unused keys. */
	removeUnusedKeys?: boolean
	/** Delay in milliseconds before scanning after file changes. */
	scanDelay?: number
	/** Paths that the plugin watches for changes to trigger a rescan. */
	watchPaths?: string[]
	/** Path to tsconfig.json for project resolution. */
	tsConfigFilePath?: string
	/** Use tab characters for indentation instead of spaces. */
	useTabs?: boolean
	/** Number of spaces per indentation level (only used when useTabs is false). */
	tabWidth?: number
	/**
	 * Expression kind names (as reported by the unsupported expression diagnostic) for which
	 * the warning should be silenced. Prefer filing a feature request for any kind listed here.
	 */
	suppressExpressionWarnings?: string[]
}

/** @internal */
export type WithPartitioning = BaseOptions & {
	/** Enable splitting translation keys into separate client and server bundles. */
	applyPartitioning: true
	/** Identifiers for client- and server-side translation functions. */
	partitioningOptions?: {
		/** Name of the client-side translation function. */
		clientFunction?: string
		/** Name of the server-side translation function. */
		serverFunction?: string
	}
}

/** @internal */
export type WithoutPartitioning = BaseOptions & {
	/** Disable partitioning; scan all translation functions together. */
	applyPartitioning?: false
	/** Function name or names to scan for translation keys. */
	translationFunctions?: string[]
}

/** @internal */
export type IntlWatcherOptions = SimplifyDeep<RequiredDeep<CreateIntlWatcherOptions>>
