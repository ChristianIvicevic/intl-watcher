import { getTranslations } from 'next-intl/server'

declare const locale: string

export default async function Component() {
	const t = await getTranslations({ locale })
	// @ts-expect-error
	t('newServerKey')
}
