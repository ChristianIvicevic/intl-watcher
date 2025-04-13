import { getTranslations as translateOnServer } from 'next-intl/server'

export async function Component() {
	// @ts-expect-error
	const t = await translateOnServer('rootNamespace.nestedNamespace')
	// @ts-expect-error
	t('newServerVariable')
	return null
}
