import type { Fruit } from '@/types'
import { getTranslations } from 'next-intl/server'

declare function randomBoolean(): boolean
declare function randomFruit(): Fruit

export async function Component() {
	const t = await getTranslations()
	// @ts-expect-error
	t(randomBoolean() ? 'one' : 'two')
	// @ts-expect-error
	t(randomFruit())
}
