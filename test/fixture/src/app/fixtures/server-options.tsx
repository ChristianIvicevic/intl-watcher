import { getTranslations } from 'next-intl/server'

export async function Component() {
	const t = await getTranslations({ locale: 'en' })

	return (
		<>
			{/* @ts-expect-error: This won't compile until the plugin picks it up for the first time. */}
			<p>{t('newServerVariable')}</p>
		</>
	)
}
