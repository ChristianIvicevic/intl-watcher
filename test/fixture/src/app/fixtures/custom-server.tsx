import type { CustomFruit } from '@/types'
import { getTranslations as translateOnServer } from 'next-intl/server'

function getRandomFruit(): CustomFruit {
	// chosen by fair dice roll.
	// guaranteed to be random.
	return 'customApple'
}

export default async function Component() {
	const tCustom = await translateOnServer()

	const fruit = getRandomFruit()
	const apiResponse = { status: 200, data: fruit }

	return (
		<>
			{/* @ts-expect-error: This won't compile until the plugin picks it up for the first time. */}
			<p>{tCustom('newCustomServerVariable')}</p>
			{/* @ts-expect-error: This won't compile until the plugin picks it up for the first time. */}
			<p>{tCustom(fruit)}</p>
			{/* @ts-expect-error: This won't compile until the plugin picks it up for the first time. */}
			<p>{tCustom(`${fruit}Description`)}</p>
			{/* @ts-expect-error: This won't compile until the plugin picks it up for the first time. */}
			<p>{tCustom(apiResponse.data)}</p>
		</>
	)
}
