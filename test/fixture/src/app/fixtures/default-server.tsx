import { getTranslations } from 'next-intl/server'
import type { Key } from '@/types'

declare function randomKey(): Key

export default async function Component() {
	const t = await getTranslations()
	const literalValue = 'literal' as const
	const key = randomKey()
	const nested = { data: key }
	const deeplyNested = { data: { key } }

	// @ts-expect-error
	t(literalValue)
	// @ts-expect-error
	t('newServerKey')
	// @ts-expect-error
	t(key)
	// @ts-expect-error
	t(`${key}Suffix`)
	// @ts-expect-error
	t(nested.data)
	// @ts-expect-error
	t(deeplyNested.data.key)
	// @ts-expect-error
	t.rich('richText', { em: (chunk) => <em>{chunk}</em> })
}
