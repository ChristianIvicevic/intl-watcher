import path from 'node:path'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const nextConfig: NextConfig = {
	output: 'standalone',
	outputFileTracingRoot: path.join(import.meta.dirname, '../../'),
}

const withNextIntl = createNextIntlPlugin({
	experimental: {
		createMessagesDeclaration: ['./src/i18n/en.json'],
	},
})
export default withNextIntl(nextConfig)
