'use client'

import { useTranslations as translate } from 'next-intl'

export default function Component() {
	const tCustom = translate()
	// @ts-expect-error
	tCustom('newCustomClientKey')
}
