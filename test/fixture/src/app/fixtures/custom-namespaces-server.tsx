import { getTranslations as translateOnServer } from 'next-intl/server'

export async function Component() {
	// @ts-expect-error: This won't compile until the plugin picks it up for the first time.
	const t = await translateOnServer('rootNamespace.nestedNamespace')

	return (
		<>
			{/* @ts-expect-error: This won't compile until the plugin picks it up for the first time. */}
			<p>{t('newServerVariable')}</p>
		</>
	)
}
