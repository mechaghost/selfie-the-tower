import { Character } from '../core/models';

export const CHARACTERS: Record<string, Character> = {
    'ironclad': {
        id: 'ironclad',
        name: 'The Ironclad',
        maxHp: 80,
        maxEnergy: 3,
        startingGold: 99,
        startingDeck: [
            'strike_red', 'strike_red', 'strike_red', 'strike_red', 'strike_red',
            'defend_red', 'defend_red', 'defend_red', 'defend_red',
            'bash'
        ]
    }
};
