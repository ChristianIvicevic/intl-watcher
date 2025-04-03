'use client'

import { useTranslations } from 'next-intl'

export function Component() {
	// @ts-expect-error: This won't compile until the plugin picks it up for the first time.
	const t = useTranslations('rootNamespace.nestedNamespace')

	return (
		<>
			{/* @ts-expect-error: This won't compile until the plugin picks it up for the first time. */}
			<p>{t('newClientVariable')}</p>
		</>
	)
}
