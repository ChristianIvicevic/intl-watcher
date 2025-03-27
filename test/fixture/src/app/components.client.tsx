'use client'

import { type AbstractIntlMessages, NextIntlClientProvider, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

export function Providers({
	children,
	messages,
	locale,
}: {
	children: ReactNode
	messages: AbstractIntlMessages
	locale: string
}) {
	return (
		<NextIntlClientProvider
			messages={messages}
			locale={locale}
			getMessageFallback={(info) => `[NYT: ${info.key}]`}
			timeZone="UTC"
		>
			{children}
		</NextIntlClientProvider>
	)
}

export function ClientComponent() {
	const t = useTranslations()

	return (
		<>
			{/* @ts-expect-error */}
			<p>{t('newClientVariable')}</p>
		</>
	)
}
