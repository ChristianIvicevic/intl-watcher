'use client'

import { useTranslations as translate } from 'next-intl'

export default function Component() {
	// @ts-expect-error
	const tCustom = translate('rootNamespace.nestedNamespace')
	// @ts-expect-error
	tCustom('newClientKey')
}
