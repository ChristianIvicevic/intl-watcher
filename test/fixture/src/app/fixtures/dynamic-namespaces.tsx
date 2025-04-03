import { getTranslations } from 'next-intl/server'

function getRandomNamespace(): string {
	return 'random.fail'
}

export async function Component() {
	// @ts-expect-error: This won't compile until the plugin picks it up for the first time.
	const t = await getTranslations(getRandomNamespace())

	return (
		<>
			{/* @ts-expect-error: This won't compile until the plugin picks it up for the first time. */}
			<p>{t('newServerVariable')}</p>
		</>
	)
}
