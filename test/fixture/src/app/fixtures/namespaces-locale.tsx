import { getTranslations } from 'next-intl/server'

export default async function Component() {
	// @ts-expect-error
	const t = await getTranslations({ locale: 'en', namespace: 'nestedNamespace.deeplyNestedNamespace' })
	// @ts-expect-error
	t('newServerKey')
}
