'use client'

import { useTranslations } from 'next-intl'

export default function Component() {
	// @ts-expect-error
	const t = useTranslations('rootNamespace.nestedNamespace')
	// @ts-expect-error
	t('newClientKey')
}
