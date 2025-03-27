import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const nextConfig: NextConfig = {
	eslint: { ignoreDuringBuilds: true },
	output: 'standalone',
	outputFileTracingRoot: path.join(path.dirname(fileURLToPath(import.meta.url)), '../../'),
}

const withNextIntl = createNextIntlPlugin({
	experimental: {
		createMessagesDeclaration: ['./src/i18n/en.json'],
	},
})
export default withNextIntl(nextConfig)
