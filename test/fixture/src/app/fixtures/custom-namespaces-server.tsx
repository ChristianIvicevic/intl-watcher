import { getTranslations as translateOnServer } from 'next-intl/server'

export default async function Component() {
	// @ts-expect-error
	const tCustom = await translateOnServer('nestedNamespace.deeplyNestedNamespace')
	// @ts-expect-error
	tCustom('newServerKey')
}
