import { getRandomFruit } from '@/utils'
import { getTranslations } from 'next-intl/server'

export default async function Component() {
	const t = await getTranslations()
	const literalValue = 'literal' as const
	const fruit = getRandomFruit()
	const apiResponse = { status: 200, data: fruit }
	const deeplyNested = { data: { fruit } }

	// @ts-expect-error
	t(literalValue)
	// @ts-expect-error
	t('newServerVariable')
	// @ts-expect-error
	t(fruit)
	// @ts-expect-error
	t(`${fruit}Description`)
	// @ts-expect-error
	t(apiResponse.data)
	// @ts-expect-error
	t(deeplyNested.data.fruit)
	// @ts-expect-error
	t.rich('richText', { strong: (chunk) => <strong>{chunk}</strong> })

	return null
}
