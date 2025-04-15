import { getTranslations } from 'next-intl/server'

declare function randomNamespace(): string

export default async function Component() {
	// @ts-expect-error
	const t = await getTranslations(randomNamespace())
	// @ts-expect-error
	t('newServerKey')
}
