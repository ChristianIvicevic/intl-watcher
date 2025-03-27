'use client'

import { useTranslations as translate } from 'next-intl'

export function ClientComponent() {
	const tCustom = translate()
	return (
		<>
			{/* @ts-expect-error */}
			<p>{tCustom('newCustomClientVariable')}</p>
		</>
	)
}
