'use client'

import { useTranslations } from 'next-intl'

export default function Component() {
	// @ts-expect-error
	const t = useTranslations('nestedNamespace.deeplyNestedNamespace')
	// @ts-expect-error
	t('newClientKey')
}
