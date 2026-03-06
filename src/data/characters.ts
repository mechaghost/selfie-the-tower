import { Character } from '../core/models';

export const CHARACTERS: Record<string, Character> = {
    'ironclad': {
        id: 'ironclad',
        name: 'The Ironclad',
        maxHp: 80,
        maxEnergy: 3,
        startingGold: 99,
        startingDeck: [
            'strike', 'strike', 'strike', 'strike', 'strike',
            'defend', 'defend', 'defend', 'defend',
            'bash'
        ]
    }
};
