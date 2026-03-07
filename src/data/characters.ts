import { Character } from '../core/models';

export const CHARACTERS: Record<string, Character> = {
    'street_runner': {
        id: 'street_runner',
        name: 'Street Runner',
        maxHp: 80,
        maxEnergy: 3,
        startingGold: 99,
        startingDeck: [
            'neon_jab', 'neon_jab', 'neon_jab', 'neon_jab',
            'dodge_roll', 'dodge_roll', 'dodge_roll', 'dodge_roll',
            'haymaker', 'shockwave'
        ]
    }
};
