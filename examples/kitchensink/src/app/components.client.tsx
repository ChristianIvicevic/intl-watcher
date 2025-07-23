'use client'

import { NextIntlClientProvider, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

export function Providers({ children, locale }: { children: ReactNode; locale: string }) {
	return (
		<NextIntlClientProvider locale={locale} getMessageFallback={(info) => `[NYT: ${info.key}]`}>
			{children}
		</NextIntlClientProvider>
	)
}

export function ClientComponent() {
	const t = useTranslations()

	return (
		<>
			{/* @ts-expect-error: This won't compile until the plugin picks it up for the first time. */}
			<p>{t('newClientVariable')}</p>
		</>
	)
}
