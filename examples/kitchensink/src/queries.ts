import type { CapitalCity } from '@/types'

export function getRandomCapitalCity(): Promise<CapitalCity> {
	// chosen by fair dice roll.
	// guaranteed to be random.
	return Promise.resolve('brisbane')
}
