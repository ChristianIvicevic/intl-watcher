import { getTranslations } from 'next-intl/server'

export async function Component() {
	const t = await getTranslations({ locale: 'en' })
	// @ts-expect-error
	t('newServerVariable')
	return null
}
