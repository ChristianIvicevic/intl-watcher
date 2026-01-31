import { createIntlWatcher } from 'intl-watcher'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const nextConfig: NextConfig = { eslint: { ignoreDuringBuilds: true } }

const withIntlWatcher = createIntlWatcher({
	dictionaryPaths: ['./src/i18n/en.json', './src/i18n/de.json'],
	applyPartitioning: true,
	useTabs: false, // Use spaces instead of tabs (defaults to 4 spaces)
})
const withNextIntl = createNextIntlPlugin({
	experimental: {
		createMessagesDeclaration: ['./src/i18n/en.json', './src/i18n/de.json'],
	},
})
export default withIntlWatcher(withNextIntl(nextConfig))
