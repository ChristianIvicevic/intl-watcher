import { getTranslations } from 'next-intl/server'
import { getRandomCapitalCity } from '@/queries'

export default async function Page() {
	const t = await getTranslations()
	const city = await getRandomCapitalCity()

	return (
		<>
			{/* @ts-expect-error: This won't compile until the plugin picks it up for the first time. */}
			<p>{t('newServerVariable')}</p>
			{/* @ts-expect-error: This won't compile until the plugin picks it up for the first time. */}
			<p>{t(city)}</p>
			{/* @ts-expect-error: This won't compile until the plugin picks it up for the first time. */}
			<p>{t(`${city}Description`)}</p>
		</>
	)
}
