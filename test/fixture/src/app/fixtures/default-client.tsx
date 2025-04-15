'use client'

import { useTranslations } from 'next-intl'

export default function Component() {
	const t = useTranslations()
	// @ts-expect-error
	t('newClientKey')
}
