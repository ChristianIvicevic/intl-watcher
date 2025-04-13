import { getTranslations } from 'next-intl/server'

function getRandomNamespace(): string {
	return 'random.fail'
}

export async function Component() {
	// @ts-expect-error
	const t = await getTranslations(getRandomNamespace())
	// @ts-expect-error
	t('newServerVariable')
	return null
}
