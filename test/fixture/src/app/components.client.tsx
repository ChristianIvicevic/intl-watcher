'use client'

import { NextIntlClientProvider } from 'next-intl'
import type { ReactNode } from 'react'

export function Providers({
	children,
	locale,
}: {
	children: ReactNode
	locale: string
}) {
	return <NextIntlClientProvider locale={locale}>{children}</NextIntlClientProvider>
}
