import { getTranslations } from 'next-intl/server'

declare function randomBoolean(): boolean

export async function Component() {
	const t = await getTranslations()
	// @ts-expect-error
	t(randomBoolean() ? 'one' : 'two')
}
