import { getTranslations } from 'next-intl/server'

export async function Component() {
	// @ts-expect-error
	const t = await getTranslations({ locale: 'en', namespace: 'rootNamespace.nestedNamespace' })
	// @ts-expect-error
	t('newServerVariable')
	return null
}
