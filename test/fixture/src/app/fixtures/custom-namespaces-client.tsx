'use client'

import { useTranslations as translate } from 'next-intl'

export function Component() {
	// @ts-expect-error
	const t = translate('rootNamespace.nestedNamespace')
	// @ts-expect-error
	t('newClientVariable')
	return null
}
