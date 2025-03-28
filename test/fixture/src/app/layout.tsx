import { Providers } from '@/app/components.client'
import { getLocale } from 'next-intl/server'
import type { ReactNode } from 'react'

export const dynamic = 'force-dynamic'

export default async function RootLayout({ children }: { children: ReactNode }) {
	const locale = await getLocale()

	return (
		<html lang={locale}>
			<body>
				<Providers locale={locale}>{children}</Providers>
			</body>
		</html>
	)
}
