import { createIntlWatcher } from 'intl-watcher'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const nextConfig: NextConfig = { eslint: { ignoreDuringBuilds: true } }

const withIntlWatcher = createIntlWatcher({
	applyPartitioning: true,
	i18nDictionaryPaths: ['./src/i18n/en.json', './src/i18n/de.json'],
	removeUnusedKeys: true,
})
const withNextIntl = createNextIntlPlugin({
	experimental: {
		createMessagesDeclaration: ['./src/i18n/en.json', './src/i18n/de.json'],
	},
})
export default withIntlWatcher(withNextIntl(nextConfig))
