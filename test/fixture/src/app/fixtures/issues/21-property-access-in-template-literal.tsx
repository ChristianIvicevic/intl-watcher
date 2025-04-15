import type { Key } from '@/types'
import { getTranslations } from 'next-intl/server'

declare function randomKey(): Key

export default async function Component() {
	const t = await getTranslations()
	const key = randomKey()
	const nested = { data: key }
	const deeplyNested = { data: { key } }

	// @ts-expect-error
	t(`${nested.data}PropertyAccessExpressionInTemplateLiteral`)
	// @ts-expect-error
	t(`${deeplyNested.data.key}PropertyAccessExpressionInTemplateLiteralDeep`)
}
