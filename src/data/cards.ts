import { Card } from '../core/models';
import { RNG } from '../core/rng';

let _instanceCounter = 0;

export const CARD_DATABASE: Record<string, Card> = {
    neon_jab: {
        id: 'neon_jab',
        instanceId: '',
        name: 'Jab',
        type: 'Attack',
        cost: 1,
        description: 'Deal 6 damage.',
        target: 'Enemy',
        effects: [
            { type: 'Damage', amount: 6, target: 'Target' }
        ],
        imageId: 'neon_neon_strike'
    },
    dodge_roll: {
        id: 'dodge_roll',
        instanceId: '',
        name: 'Dodge',
        type: 'Skill',
        cost: 1,
        description: 'Gain 5 Block.',
        target: 'Self',
        effects: [
            { type: 'Block', amount: 5, target: 'Self' }
        ],
        imageId: 'neon_heat_shimmer'
    },
    haymaker: {
        id: 'haymaker',
        instanceId: '',
        name: 'Haymaker',
        type: 'Attack',
        cost: 2,
        description: 'Deal 8 damage. Apply 2 Vulnerable.',
        target: 'Enemy',
        effects: [
            { type: 'Damage', amount: 8, target: 'Target' },
            { type: 'ApplyStatus', amount: 2, statusId: 'vulnerable', target: 'Target' }
        ],
        imageId: 'neon_flash_burn'
    },
    shockwave: {
        id: 'shockwave',
        instanceId: '',
        name: 'Tremor',
        type: 'Attack',
        cost: 1,
        description: 'Deal 8 damage to ALL enemies.',
        target: 'AllEnemies',
        effects: [
            { type: 'Damage', amount: 8, target: 'AllEnemies' }
        ],
        imageId: 'neon_sign_burst'
    }
};

export const createCardInstance = (cardId: string, rng?: RNG): Card => {
    const template = CARD_DATABASE[cardId];
    if (!template) throw new Error(`Card ${cardId} not found`);
    const unique = rng
        ? Math.floor(rng.next() * 2176782336).toString(36)
        : (++_instanceCounter).toString(36);
    return {
        ...template,
        instanceId: `${cardId}_${unique}`
    };
};
