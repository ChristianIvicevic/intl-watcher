'use client'

import { useTranslations as translate } from 'next-intl'

export function Component() {
	const tCustom = translate()
	// @ts-expect-error
	tCustom('newCustomClientVariable')
	return null
}
