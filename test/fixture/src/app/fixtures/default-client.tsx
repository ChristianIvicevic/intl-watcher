'use client'

import { useTranslations } from 'next-intl'

export function Component() {
	const t = useTranslations()
	// @ts-expect-error
	t('newClientVariable')
	return null
}
