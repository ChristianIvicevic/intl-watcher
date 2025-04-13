import { getRandomCustomFruit } from '@/utils'
import { getTranslations as translateOnServer } from 'next-intl/server'

export default async function Component() {
	const tCustom = await translateOnServer()
	const fruit = getRandomCustomFruit()
	const apiResponse = { status: 200, data: fruit }

	// @ts-expect-error
	tCustom('newCustomServerVariable')
	// @ts-expect-error
	tCustom(fruit)
	// @ts-expect-error
	tCustom(`${fruit}Description`)
	// @ts-expect-error
	tCustom(apiResponse.data)

	return null
}
