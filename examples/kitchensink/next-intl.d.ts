import 'next-intl'
import type Messages from '@/i18n/en.json'

declare module 'next-intl' {
	interface AppConfig {
		Messages: typeof Messages
	}
}
