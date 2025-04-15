import { getTranslations } from 'next-intl/server'

export default async function Component() {
	// @ts-expect-error
	const t = await getTranslations('rootNamespace.nestedNamespace')
	// @ts-expect-error
	t('newServerKey')
}
