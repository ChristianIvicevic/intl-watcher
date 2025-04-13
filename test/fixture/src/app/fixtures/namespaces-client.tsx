'use client'

import { useTranslations } from 'next-intl'

export function Component() {
	// @ts-expect-error
	const t = useTranslations('rootNamespace.nestedNamespace')
	// @ts-expect-error
	t('newClientVariable')
	return null
}
