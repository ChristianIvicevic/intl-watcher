import type { CustomFruit, Fruit } from '@/types'

export function getRandomFruit(): Fruit {
	// chosen by fair dice roll.
	// guaranteed to be random.
	return 'apple'
}

export function getRandomCustomFruit(): CustomFruit {
	// chosen by fair dice roll.
	// guaranteed to be random.
	return 'customApple'
}
