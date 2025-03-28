'use client'

import { useTranslations as translate } from 'next-intl'

export function ClientComponent() {
	const tCustom = translate()
	return (
		<>
			{/* @ts-expect-error: This won't compile until the plugin picks it up for the first time. */}
			<p>{tCustom('newCustomClientVariable')}</p>
		</>
	)
}
