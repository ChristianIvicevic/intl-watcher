import type { Fruit } from '@/types'
import { getTranslations } from 'next-intl/server'

function getRandomFruit(): Fruit {
	// chosen by fair dice roll.
	// guaranteed to be random.
	return 'apple'
}

export default async function Page() {
	const t = await getTranslations()

	const fruit = getRandomFruit()
	const apiResponse = { status: 200, data: fruit }

	return (
		<>
			{/* @ts-expect-error */}
			<p>{t('newServerVariable')}</p>
			{/*@ts-expect-error */}
			<p>{t(fruit)}</p>
			{/* @ts-expect-error */}
			<p>{t(`${fruit}Description`)}</p>
			{/* @ts-expect-error */}
			<p>{t(apiResponse.data)}</p>
		</>
	)
}
