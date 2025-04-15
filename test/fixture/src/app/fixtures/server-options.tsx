import { getTranslations } from 'next-intl/server'

export default async function Component() {
	const t = await getTranslations({ locale: 'en' })
	// @ts-expect-error
	t('newServerKey')
}
