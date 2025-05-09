import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		clearMocks: true,
		coverage: {
			all: true,
			include: ['src'],
			reporter: ['html', 'lcov'],
		},
		exclude: [
			'**/node_modules/**',
			'**/dist/**',
			'**/lib/**',
			'**/cypress/**',
			'**/.{idea,git,cache,output,temp}/**',
			'**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*',
		],
		forceRerunTriggers: ['**/package.json/**', '**/vitest.config.*/**', '**/test/fixture/**'],
	},
})
