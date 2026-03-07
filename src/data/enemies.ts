import { EnemyDefinition, Enemy } from '../core/models';
import { RNG } from '../core/rng';

export const enemies: Record<string, EnemyDefinition> = {
    'jaw_worm': {
        id: 'jaw_worm',
        name: 'Jaw Worm',
        maxHpRange: [40, 44],
        aiPatterns: [
            {
                condition: 'Turn1',
                chance: 100,
                intent: {
                    type: 'Attack',
                    damage: 11,
                    effects: [{ type: 'Damage', amount: 11, target: 'Target' }]
                }
            },
            {
                chance: 25,
                intent: {
                    type: 'Attack',
                    damage: 11,
                    effects: [{ type: 'Damage', amount: 11, target: 'Target' }]
                }
            },
            {
                chance: 30,
                intent: {
                    type: 'AttackDefend',
                    damage: 7,
                    block: 5,
                    effects: [
                        { type: 'Damage', amount: 7, target: 'Target' },
                        { type: 'Block', amount: 5, target: 'Self' }
                    ]
                }
            },
            {
                chance: 45,
                intent: {
                    type: 'Buff',
                    block: 6,
                    effects: [
                        { type: 'Block', amount: 6, target: 'Self' },
                        { type: 'ApplyStatus', amount: 3, statusId: 'strength', target: 'Self' }
                    ]
                }
            }
        ]
    },
    'gremlin_nob': {
        id: 'gremlin_nob',
        name: 'Gremlin Nob',
        maxHpRange: [82, 86],
        aiPatterns: [
            {
                condition: 'Turn1',
                chance: 100,
                intent: {
                    type: 'Buff',
                    effects: [
                        { type: 'ApplyStatus', amount: 2, statusId: 'strength', target: 'Self' }
                    ]
                }
            },
            {
                chance: 67,
                intent: {
                    type: 'Attack',
                    damage: 14,
                    effects: [{ type: 'Damage', amount: 14, target: 'Target' }]
                }
            },
            {
                chance: 33,
                intent: {
                    type: 'AttackDebuff',
                    damage: 8,
                    effects: [
                        { type: 'Damage', amount: 8, target: 'Target' },
                        { type: 'ApplyStatus', amount: 2, statusId: 'vulnerable', target: 'Target' }
                    ]
                }
            }
        ]
    }
};

export function createEnemyInstance(templateId: string, id: string, rng: RNG | null): Enemy {
    const template = enemies[templateId];
    if (!template) throw new Error(`Enemy template ${templateId} not found`);

    const [minHp, maxHp] = template.maxHpRange;
    const finalMaxHp = rng
        ? rng.nextInt(minHp, maxHp + 1)
        : Math.floor(Math.random() * (maxHp - minHp + 1)) + minHp;

    return {
        id,
        templateId,
        name: template.name,
        hp: finalMaxHp,
        maxHp: finalMaxHp,
        block: 0,
        statuses: [],
        intent: null
    };
}
