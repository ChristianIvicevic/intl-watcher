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
			{/* @ts-expect-error: This won't compile until the plugin picks it up for the first time. */}
			<p>{t('newServerVariable')}</p>
			{/* @ts-expect-error: This won't compile until the plugin picks it up for the first time. */}
			<p>{t(fruit)}</p>
			{/* @ts-expect-error: This won't compile until the plugin picks it up for the first time. */}
			<p>{t(`${fruit}Description`)}</p>
			{/* @ts-expect-error: This won't compile until the plugin picks it up for the first time. */}
			<p>{t(apiResponse.data)}</p>
			{/* @ts-expect-error: This won't compile until the plugin picks it up for the first time. */}
			<p>{t.rich('richText', { strong: (chunk) => <strong>{chunk}</strong> })}</p>
		</>
	)
}
