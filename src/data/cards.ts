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
    },

    // ═══════════════════════════════════════════
    // COLORLESS CARDS
    // ═══════════════════════════════════════════

    // --- Attacks ---

    shiv_toss: {
        id: 'shiv_toss',
        instanceId: '',
        name: 'Shiv Toss',
        type: 'Attack',
        cost: 0,
        description: 'Deal 4 damage.',
        target: 'Enemy',
        effects: [
            { type: 'Damage', amount: 4, target: 'Target' }
        ],
        imageId: 'colorless_shiv_toss'
    },
    cheap_shot: {
        id: 'cheap_shot',
        instanceId: '',
        name: 'Cheap Shot',
        type: 'Attack',
        cost: 1,
        description: 'Deal 7 damage. Apply 1 Weak.',
        target: 'Enemy',
        effects: [
            { type: 'Damage', amount: 7, target: 'Target' },
            { type: 'ApplyStatus', amount: 1, statusId: 'weak', target: 'Target' }
        ],
        imageId: 'colorless_cheap_shot'
    },
    show_off: {
        id: 'show_off',
        instanceId: '',
        name: 'Show Off',
        type: 'Attack',
        cost: 0,
        description: 'Deal 8 damage to ALL enemies. Exhaust.',
        target: 'AllEnemies',
        exhausts: true,
        effects: [
            { type: 'Damage', amount: 8, target: 'AllEnemies' }
        ],
        imageId: 'colorless_show_off'
    },
    lariat: {
        id: 'lariat',
        instanceId: '',
        name: 'Lariat',
        type: 'Attack',
        cost: 2,
        description: 'Deal 12 damage. Apply 2 Vulnerable.',
        target: 'Enemy',
        effects: [
            { type: 'Damage', amount: 12, target: 'Target' },
            { type: 'ApplyStatus', amount: 2, statusId: 'vulnerable', target: 'Target' }
        ],
        imageId: 'colorless_lariat'
    },
    ricochet: {
        id: 'ricochet',
        instanceId: '',
        name: 'Ricochet',
        type: 'Attack',
        cost: 1,
        description: 'Deal 4 damage to a random enemy 3 times.',
        target: 'None',
        effects: [
            { type: 'Damage', amount: 4, target: 'RandomEnemy' },
            { type: 'Damage', amount: 4, target: 'RandomEnemy' },
            { type: 'Damage', amount: 4, target: 'RandomEnemy' }
        ],
        imageId: 'colorless_ricochet'
    },

    // --- Skills ---

    rewind: {
        id: 'rewind',
        instanceId: '',
        name: 'Rewind',
        type: 'Skill',
        cost: 1,
        description: 'Draw 3 cards.',
        target: 'Self',
        effects: [
            { type: 'Draw', amount: 3, target: 'Self' }
        ],
        imageId: 'colorless_rewind'
    },
    quick_fix: {
        id: 'quick_fix',
        instanceId: '',
        name: 'Quick Fix',
        type: 'Skill',
        cost: 1,
        description: 'Heal 6 HP.',
        target: 'Self',
        effects: [
            { type: 'Heal', amount: 6, target: 'Self' }
        ],
        imageId: 'colorless_quick_fix'
    },
    flash_bang: {
        id: 'flash_bang',
        instanceId: '',
        name: 'Flash Bang',
        type: 'Skill',
        cost: 1,
        description: 'Apply 2 Weak to ALL enemies. Exhaust.',
        target: 'AllEnemies',
        exhausts: true,
        effects: [
            { type: 'ApplyStatus', amount: 2, statusId: 'weak', target: 'AllEnemies' }
        ],
        imageId: 'colorless_flash_bang'
    },
    panic: {
        id: 'panic',
        instanceId: '',
        name: 'Panic',
        type: 'Skill',
        cost: 0,
        description: 'Gain 6 Block. Exhaust.',
        target: 'Self',
        exhausts: true,
        effects: [
            { type: 'Block', amount: 6, target: 'Self' }
        ],
        imageId: 'colorless_panic'
    },
    breathe: {
        id: 'breathe',
        instanceId: '',
        name: 'Breathe',
        type: 'Skill',
        cost: 1,
        description: 'Gain 4 Block. Draw 2 cards.',
        target: 'Self',
        effects: [
            { type: 'Block', amount: 4, target: 'Self' },
            { type: 'Draw', amount: 2, target: 'Self' }
        ],
        imageId: 'colorless_breathe'
    },
    rally: {
        id: 'rally',
        instanceId: '',
        name: 'Rally',
        type: 'Skill',
        cost: 1,
        description: 'Heal 4 HP. Gain 4 Block.',
        target: 'Self',
        effects: [
            { type: 'Heal', amount: 4, target: 'Self' },
            { type: 'Block', amount: 4, target: 'Self' }
        ],
        imageId: 'colorless_rally'
    },
    spray: {
        id: 'spray',
        instanceId: '',
        name: 'Spray',
        type: 'Skill',
        cost: 1,
        description: 'Apply 1 Vulnerable to ALL enemies.',
        target: 'AllEnemies',
        effects: [
            { type: 'ApplyStatus', amount: 1, statusId: 'vulnerable', target: 'AllEnemies' }
        ],
        imageId: 'colorless_spray'
    },
    sand_toss: {
        id: 'sand_toss',
        instanceId: '',
        name: 'Sand Toss',
        type: 'Skill',
        cost: 0,
        description: 'Apply 1 Weak.',
        target: 'Enemy',
        effects: [
            { type: 'ApplyStatus', amount: 1, statusId: 'weak', target: 'Target' }
        ],
        imageId: 'colorless_sand_toss'
    },
    barricade: {
        id: 'barricade',
        instanceId: '',
        name: 'Barricade',
        type: 'Skill',
        cost: 2,
        description: 'Gain 16 Block.',
        target: 'Self',
        effects: [
            { type: 'Block', amount: 16, target: 'Self' }
        ],
        imageId: 'colorless_barricade'
    },
    trip_wire: {
        id: 'trip_wire',
        instanceId: '',
        name: 'Trip Wire',
        type: 'Skill',
        cost: 1,
        description: 'Apply 2 Vulnerable.',
        target: 'Enemy',
        effects: [
            { type: 'ApplyStatus', amount: 2, statusId: 'vulnerable', target: 'Target' }
        ],
        imageId: 'colorless_trip_wire'
    },
    pump_iron: {
        id: 'pump_iron',
        instanceId: '',
        name: 'Pump Iron',
        type: 'Skill',
        cost: 1,
        description: 'Gain 2 Strength. Exhaust.',
        target: 'Self',
        exhausts: true,
        effects: [
            { type: 'ApplyStatus', amount: 2, statusId: 'strength', target: 'Self' }
        ],
        imageId: 'colorless_pump_iron'
    },
    warm_up: {
        id: 'warm_up',
        instanceId: '',
        name: 'Warm Up',
        type: 'Skill',
        cost: 1,
        description: 'Gain 2 Dexterity. Exhaust.',
        target: 'Self',
        exhausts: true,
        effects: [
            { type: 'ApplyStatus', amount: 2, statusId: 'dexterity', target: 'Self' }
        ],
        imageId: 'colorless_warm_up'
    },
    surf: {
        id: 'surf',
        instanceId: '',
        name: 'Surf',
        type: 'Skill',
        cost: 0,
        description: 'Draw 3 cards. Discard 1 card.',
        target: 'Self',
        effects: [
            { type: 'Draw', amount: 3, target: 'Self' },
            { type: 'Discard', amount: 1, target: 'Self' }
        ],
        imageId: 'colorless_surf'
    },
    finesse: {
        id: 'finesse',
        instanceId: '',
        name: 'Finesse',
        type: 'Skill',
        cost: 0,
        description: 'Gain 3 Block. Draw 1 card.',
        target: 'Self',
        effects: [
            { type: 'Block', amount: 3, target: 'Self' },
            { type: 'Draw', amount: 1, target: 'Self' }
        ],
        imageId: 'colorless_finesse'
    },
    ballad: {
        id: 'ballad',
        instanceId: '',
        name: 'Ballad',
        type: 'Skill',
        cost: 1,
        description: 'Gain 1 Strength. Gain 1 Dexterity. Exhaust.',
        target: 'Self',
        exhausts: true,
        effects: [
            { type: 'ApplyStatus', amount: 1, statusId: 'strength', target: 'Self' },
            { type: 'ApplyStatus', amount: 1, statusId: 'dexterity', target: 'Self' }
        ],
        imageId: 'colorless_ballad'
    },
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
