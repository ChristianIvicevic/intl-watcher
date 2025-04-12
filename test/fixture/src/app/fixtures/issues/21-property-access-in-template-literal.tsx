import type { Fruit } from '@/types'
import { getTranslations } from 'next-intl/server'

function getRandomFruit(): Fruit {
	// chosen by fair dice roll.
	// guaranteed to be random.
	return 'apple'
}

export async function Component() {
	const t = await getTranslations()

	const fruit = getRandomFruit()
	const apiResponse = { status: 200, data: fruit }
	const deeplyNested = { data: { fruit } }

	// @ts-expect-error
	t(`${apiResponse.data}PropertyAccessExpressionInTemplateLiteral`)
	// @ts-expect-error
	t(`${deeplyNested.data.fruit}PropertyAccessExpressionInTemplateLiteral2`)

	return null
}
