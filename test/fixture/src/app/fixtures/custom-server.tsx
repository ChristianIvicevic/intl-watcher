import { getTranslations as translateOnServer } from 'next-intl/server'
import type { CustomKey } from '@/types'

declare function randomKey(): CustomKey

export default async function Component() {
	const tCustom = await translateOnServer()
	const key = randomKey()
	const nested = { data: key }

	// @ts-expect-error
	tCustom('newCustomServerKey')
	// @ts-expect-error
	tCustom(key)
	// @ts-expect-error
	tCustom(`${key}Suffix`)
	// @ts-expect-error
	tCustom(nested.data)
}
