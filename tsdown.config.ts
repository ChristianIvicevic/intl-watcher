import { defineConfig } from 'tsdown'

export default defineConfig({
	unbundle: true,
	clean: true,
	dts: true,
	entry: ['src/**/*.ts', '!src/**/*.test.*'],
	format: 'esm',
	outDir: 'lib',
	target: false,
	inlineOnly: [],
})
