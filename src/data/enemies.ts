import { EnemyDefinition, Enemy } from '../core/models';
import { RNG } from '../core/rng';

export const enemies: Record<string, EnemyDefinition> = {
    // ═══════════════════════════════════════════
    // TIER 1 — Easy (Act 1 fodder)
    // ═══════════════════════════════════════════

    'alley_rat': {
        id: 'alley_rat',
        name: 'Rat',
        maxHpRange: [12, 16],
        aiPatterns: [
            {
                chance: 60,
                intent: {
                    type: 'Attack',
                    damage: 5,
                    effects: [{ type: 'Damage', amount: 5, target: 'Target' }]
                }
            },
            {
                chance: 40,
                intent: {
                    type: 'Attack',
                    damage: 3,
                    effects: [
                        { type: 'Damage', amount: 3, target: 'Target' },
                        { type: 'Damage', amount: 3, target: 'Target' }
                    ],
                    hits: 2,
                }
            }
        ]
    },

    'neon_junkie': {
        id: 'neon_junkie',
        name: 'Junkie',
        maxHpRange: [22, 28],
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
                chance: 70,
                intent: {
                    type: 'Attack',
                    damage: 7,
                    effects: [{ type: 'Damage', amount: 7, target: 'Target' }]
                }
            },
            {
                chance: 30,
                intent: {
                    type: 'AttackDebuff',
                    damage: 5,
                    effects: [
                        { type: 'Damage', amount: 5, target: 'Target' },
                        { type: 'ApplyStatus', amount: 1, statusId: 'weak', target: 'Target' }
                    ]
                }
            }
        ]
    },

    'graffiti_imp': {
        id: 'graffiti_imp',
        name: 'Imp',
        maxHpRange: [14, 18],
        aiPatterns: [
            {
                chance: 50,
                intent: {
                    type: 'Attack',
                    damage: 6,
                    effects: [{ type: 'Damage', amount: 6, target: 'Target' }]
                }
            },
            {
                chance: 50,
                intent: {
                    type: 'Debuff',
                    effects: [
                        { type: 'ApplyStatus', amount: 1, statusId: 'vulnerable', target: 'Target' },
                        { type: 'ApplyStatus', amount: 1, statusId: 'weak', target: 'Target' }
                    ]
                }
            }
        ]
    },

    'stray_voltage': {
        id: 'stray_voltage',
        name: 'Voltage',
        maxHpRange: [18, 22],
        aiPatterns: [
            {
                chance: 65,
                intent: {
                    type: 'Attack',
                    damage: 8,
                    effects: [{ type: 'Damage', amount: 8, target: 'Target' }]
                }
            },
            {
                chance: 35,
                intent: {
                    type: 'Attack',
                    damage: 4,
                    effects: [{ type: 'Damage', amount: 4, target: 'Target' }],
                    hits: 2,
                }
            }
        ]
    },

    'dumpster_crawler': {
        id: 'dumpster_crawler',
        name: 'Crawler',
        maxHpRange: [26, 32],
        aiPatterns: [
            {
                condition: 'Turn1',
                chance: 100,
                intent: {
                    type: 'AttackDefend',
                    damage: 5,
                    block: 6,
                    effects: [
                        { type: 'Damage', amount: 5, target: 'Target' },
                        { type: 'Block', amount: 6, target: 'Self' }
                    ]
                }
            },
            {
                chance: 50,
                intent: {
                    type: 'Attack',
                    damage: 9,
                    effects: [{ type: 'Damage', amount: 9, target: 'Target' }]
                }
            },
            {
                chance: 30,
                intent: {
                    type: 'Defend',
                    block: 8,
                    effects: [{ type: 'Block', amount: 8, target: 'Self' }]
                }
            },
            {
                chance: 20,
                intent: {
                    type: 'AttackDefend',
                    damage: 5,
                    block: 6,
                    effects: [
                        { type: 'Damage', amount: 5, target: 'Target' },
                        { type: 'Block', amount: 6, target: 'Self' }
                    ]
                }
            }
        ]
    },

    'smoke_specter': {
        id: 'smoke_specter',
        name: 'Specter',
        maxHpRange: [20, 24],
        aiPatterns: [
            {
                chance: 40,
                intent: {
                    type: 'Attack',
                    damage: 7,
                    effects: [{ type: 'Damage', amount: 7, target: 'Target' }]
                }
            },
            {
                chance: 35,
                intent: {
                    type: 'Debuff',
                    effects: [
                        { type: 'ApplyStatus', amount: 2, statusId: 'weak', target: 'Target' }
                    ]
                }
            },
            {
                chance: 25,
                intent: {
                    type: 'Defend',
                    block: 5,
                    effects: [{ type: 'Block', amount: 5, target: 'Self' }]
                }
            }
        ]
    },

    'taxi_ghost': {
        id: 'taxi_ghost',
        name: 'Taxi Ghost',
        maxHpRange: [16, 20],
        aiPatterns: [
            {
                condition: 'Turn1',
                chance: 100,
                intent: {
                    type: 'Attack',
                    damage: 10,
                    effects: [{ type: 'Damage', amount: 10, target: 'Target' }]
                }
            },
            {
                chance: 55,
                intent: {
                    type: 'Attack',
                    damage: 6,
                    effects: [{ type: 'Damage', amount: 6, target: 'Target' }]
                }
            },
            {
                chance: 45,
                intent: {
                    type: 'Buff',
                    effects: [
                        { type: 'ApplyStatus', amount: 1, statusId: 'strength', target: 'Self' }
                    ]
                }
            }
        ]
    },

    'manhole_mimic': {
        id: 'manhole_mimic',
        name: 'Mimic',
        maxHpRange: [24, 28],
        aiPatterns: [
            {
                condition: 'Turn1',
                chance: 100,
                intent: {
                    type: 'Attack',
                    damage: 12,
                    effects: [
                        { type: 'Damage', amount: 12, target: 'Target' },
                        { type: 'ApplyStatus', amount: 1, statusId: 'vulnerable', target: 'Target' }
                    ]
                }
            },
            {
                chance: 60,
                intent: {
                    type: 'Attack',
                    damage: 8,
                    effects: [{ type: 'Damage', amount: 8, target: 'Target' }]
                }
            },
            {
                chance: 40,
                intent: {
                    type: 'Defend',
                    block: 10,
                    effects: [{ type: 'Block', amount: 10, target: 'Self' }]
                }
            }
        ]
    },

    // ═══════════════════════════════════════════
    // TIER 2 — Medium (tougher single / multi encounters)
    // ═══════════════════════════════════════════

    'boombox_brute': {
        id: 'boombox_brute',
        name: 'Boombox',
        maxHpRange: [38, 44],
        aiPatterns: [
            {
                condition: 'Turn1',
                chance: 100,
                intent: {
                    type: 'Buff',
                    effects: [
                        { type: 'ApplyStatus', amount: 3, statusId: 'strength', target: 'Self' }
                    ]
                }
            },
            {
                chance: 70,
                intent: {
                    type: 'Attack',
                    damage: 11,
                    effects: [{ type: 'Damage', amount: 11, target: 'Target' }]
                }
            },
            {
                chance: 30,
                intent: {
                    type: 'AttackDebuff',
                    damage: 7,
                    effects: [
                        { type: 'Damage', amount: 7, target: 'Target' },
                        { type: 'ApplyStatus', amount: 1, statusId: 'vulnerable', target: 'Target' }
                    ]
                }
            }
        ]
    },

    'neon_wraith': {
        id: 'neon_wraith',
        name: 'Wraith',
        maxHpRange: [30, 34],
        aiPatterns: [
            {
                chance: 40,
                intent: {
                    type: 'Attack',
                    damage: 9,
                    effects: [{ type: 'Damage', amount: 9, target: 'Target' }]
                }
            },
            {
                chance: 35,
                intent: {
                    type: 'Debuff',
                    effects: [
                        { type: 'ApplyStatus', amount: 2, statusId: 'vulnerable', target: 'Target' }
                    ]
                }
            },
            {
                chance: 25,
                intent: {
                    type: 'AttackDebuff',
                    damage: 6,
                    effects: [
                        { type: 'Damage', amount: 6, target: 'Target' },
                        { type: 'ApplyStatus', amount: 1, statusId: 'weak', target: 'Target' }
                    ]
                }
            }
        ]
    },

    'payphone_phantom': {
        id: 'payphone_phantom',
        name: 'Payphone',
        maxHpRange: [32, 38],
        aiPatterns: [
            {
                condition: 'Turn1',
                chance: 100,
                intent: {
                    type: 'Buff',
                    block: 8,
                    effects: [
                        { type: 'Block', amount: 8, target: 'Self' },
                        { type: 'ApplyStatus', amount: 2, statusId: 'strength', target: 'Self' }
                    ]
                }
            },
            {
                chance: 60,
                intent: {
                    type: 'Attack',
                    damage: 10,
                    effects: [{ type: 'Damage', amount: 10, target: 'Target' }]
                }
            },
            {
                chance: 40,
                intent: {
                    type: 'AttackDefend',
                    damage: 6,
                    block: 6,
                    effects: [
                        { type: 'Damage', amount: 6, target: 'Target' },
                        { type: 'Block', amount: 6, target: 'Self' }
                    ]
                }
            }
        ]
    },

    'sewer_slime': {
        id: 'sewer_slime',
        name: 'Slime',
        maxHpRange: [36, 42],
        aiPatterns: [
            {
                chance: 45,
                intent: {
                    type: 'Attack',
                    damage: 8,
                    effects: [{ type: 'Damage', amount: 8, target: 'Target' }]
                }
            },
            {
                chance: 30,
                intent: {
                    type: 'AttackDebuff',
                    damage: 5,
                    effects: [
                        { type: 'Damage', amount: 5, target: 'Target' },
                        { type: 'ApplyStatus', amount: 2, statusId: 'weak', target: 'Target' }
                    ]
                }
            },
            {
                chance: 25,
                intent: {
                    type: 'Buff',
                    block: 6,
                    effects: [
                        { type: 'Block', amount: 6, target: 'Self' },
                        { type: 'ApplyStatus', amount: 1, statusId: 'strength', target: 'Self' }
                    ]
                }
            }
        ]
    },

    'fire_escape_spider': {
        id: 'fire_escape_spider',
        name: 'Spider',
        maxHpRange: [24, 28],
        aiPatterns: [
            {
                chance: 55,
                intent: {
                    type: 'Attack',
                    damage: 4,
                    hits: 3,
                    effects: [
                        { type: 'Damage', amount: 4, target: 'Target' },
                        { type: 'Damage', amount: 4, target: 'Target' },
                        { type: 'Damage', amount: 4, target: 'Target' }
                    ]
                }
            },
            {
                chance: 25,
                intent: {
                    type: 'Debuff',
                    effects: [
                        { type: 'ApplyStatus', amount: 2, statusId: 'weak', target: 'Target' }
                    ]
                }
            },
            {
                chance: 20,
                intent: {
                    type: 'Defend',
                    block: 7,
                    effects: [{ type: 'Block', amount: 7, target: 'Self' }]
                }
            }
        ]
    },

    'vending_golem': {
        id: 'vending_golem',
        name: 'Golem',
        maxHpRange: [28, 34],
        aiPatterns: [
            {
                condition: 'Turn1',
                chance: 100,
                intent: {
                    type: 'Defend',
                    block: 12,
                    effects: [{ type: 'Block', amount: 12, target: 'Self' }]
                }
            },
            {
                chance: 50,
                intent: {
                    type: 'Attack',
                    damage: 10,
                    effects: [{ type: 'Damage', amount: 10, target: 'Target' }]
                }
            },
            {
                chance: 30,
                intent: {
                    type: 'AttackDefend',
                    damage: 6,
                    block: 8,
                    effects: [
                        { type: 'Damage', amount: 6, target: 'Target' },
                        { type: 'Block', amount: 8, target: 'Self' }
                    ]
                }
            },
            {
                chance: 20,
                intent: {
                    type: 'Buff',
                    effects: [
                        { type: 'ApplyStatus', amount: 2, statusId: 'strength', target: 'Self' }
                    ]
                }
            }
        ]
    },

    // ═══════════════════════════════════════════
    // TIER 3 — Elites
    // ═══════════════════════════════════════════

    'circuit_breaker': {
        id: 'circuit_breaker',
        name: 'Breaker',
        maxHpRange: [78, 86],
        aiPatterns: [
            {
                condition: 'Turn1',
                chance: 100,
                intent: {
                    type: 'Buff',
                    block: 10,
                    effects: [
                        { type: 'Block', amount: 10, target: 'Self' },
                        { type: 'ApplyStatus', amount: 3, statusId: 'strength', target: 'Self' }
                    ]
                }
            },
            {
                chance: 55,
                intent: {
                    type: 'Attack',
                    damage: 16,
                    effects: [{ type: 'Damage', amount: 16, target: 'Target' }]
                }
            },
            {
                chance: 25,
                intent: {
                    type: 'AttackDefend',
                    damage: 10,
                    block: 8,
                    effects: [
                        { type: 'Damage', amount: 10, target: 'Target' },
                        { type: 'Block', amount: 8, target: 'Self' }
                    ]
                }
            },
            {
                chance: 20,
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
    },

    'neon_yakuza': {
        id: 'neon_yakuza',
        name: 'Yakuza',
        maxHpRange: [68, 76],
        aiPatterns: [
            {
                condition: 'Turn1',
                chance: 100,
                intent: {
                    type: 'Attack',
                    damage: 14,
                    effects: [{ type: 'Damage', amount: 14, target: 'Target' }]
                }
            },
            {
                chance: 45,
                intent: {
                    type: 'Attack',
                    damage: 6,
                    hits: 3,
                    effects: [
                        { type: 'Damage', amount: 6, target: 'Target' },
                        { type: 'Damage', amount: 6, target: 'Target' },
                        { type: 'Damage', amount: 6, target: 'Target' }
                    ]
                }
            },
            {
                chance: 30,
                intent: {
                    type: 'Buff',
                    effects: [
                        { type: 'ApplyStatus', amount: 2, statusId: 'strength', target: 'Self' }
                    ]
                }
            },
            {
                chance: 25,
                intent: {
                    type: 'AttackDebuff',
                    damage: 10,
                    effects: [
                        { type: 'Damage', amount: 10, target: 'Target' },
                        { type: 'ApplyStatus', amount: 2, statusId: 'weak', target: 'Target' }
                    ]
                }
            }
        ]
    },

    'chrome_bouncer': {
        id: 'chrome_bouncer',
        name: 'Bouncer',
        maxHpRange: [82, 90],
        aiPatterns: [
            {
                condition: 'Turn1',
                chance: 100,
                intent: {
                    type: 'Defend',
                    block: 15,
                    effects: [{ type: 'Block', amount: 15, target: 'Self' }]
                }
            },
            {
                chance: 40,
                intent: {
                    type: 'Attack',
                    damage: 18,
                    effects: [{ type: 'Damage', amount: 18, target: 'Target' }]
                }
            },
            {
                chance: 35,
                intent: {
                    type: 'AttackDefend',
                    damage: 12,
                    block: 10,
                    effects: [
                        { type: 'Damage', amount: 12, target: 'Target' },
                        { type: 'Block', amount: 10, target: 'Self' }
                    ]
                }
            },
            {
                chance: 25,
                intent: {
                    type: 'Buff',
                    block: 12,
                    effects: [
                        { type: 'Block', amount: 12, target: 'Self' },
                        { type: 'ApplyStatus', amount: 2, statusId: 'strength', target: 'Self' }
                    ]
                }
            }
        ]
    },

    // ═══════════════════════════════════════════
    // TIER 4 — Bosses
    // ═══════════════════════════════════════════

    'the_billboard': {
        id: 'the_billboard',
        name: 'Billboard',
        maxHpRange: [130, 145],
        aiPatterns: [
            {
                condition: 'Turn1',
                chance: 100,
                intent: {
                    type: 'Buff',
                    effects: [
                        { type: 'ApplyStatus', amount: 4, statusId: 'strength', target: 'Self' }
                    ]
                }
            },
            {
                chance: 40,
                intent: {
                    type: 'Attack',
                    damage: 20,
                    effects: [{ type: 'Damage', amount: 20, target: 'Target' }]
                }
            },
            {
                chance: 30,
                intent: {
                    type: 'AttackDebuff',
                    damage: 12,
                    effects: [
                        { type: 'Damage', amount: 12, target: 'Target' },
                        { type: 'ApplyStatus', amount: 2, statusId: 'vulnerable', target: 'Target' },
                        { type: 'ApplyStatus', amount: 2, statusId: 'weak', target: 'Target' }
                    ]
                }
            },
            {
                chance: 30,
                intent: {
                    type: 'Buff',
                    block: 15,
                    effects: [
                        { type: 'Block', amount: 15, target: 'Self' },
                        { type: 'ApplyStatus', amount: 2, statusId: 'strength', target: 'Self' }
                    ]
                }
            }
        ]
    },

    'subway_wyrm': {
        id: 'subway_wyrm',
        name: 'Wyrm',
        maxHpRange: [110, 125],
        aiPatterns: [
            {
                condition: 'Turn1',
                chance: 100,
                intent: {
                    type: 'Attack',
                    damage: 8,
                    hits: 3,
                    effects: [
                        { type: 'Damage', amount: 8, target: 'Target' },
                        { type: 'Damage', amount: 8, target: 'Target' },
                        { type: 'Damage', amount: 8, target: 'Target' }
                    ]
                }
            },
            {
                chance: 35,
                intent: {
                    type: 'Attack',
                    damage: 22,
                    effects: [{ type: 'Damage', amount: 22, target: 'Target' }]
                }
            },
            {
                chance: 35,
                intent: {
                    type: 'AttackDebuff',
                    damage: 14,
                    effects: [
                        { type: 'Damage', amount: 14, target: 'Target' },
                        { type: 'ApplyStatus', amount: 2, statusId: 'vulnerable', target: 'Target' }
                    ]
                }
            },
            {
                chance: 30,
                intent: {
                    type: 'Buff',
                    block: 10,
                    effects: [
                        { type: 'Block', amount: 10, target: 'Self' },
                        { type: 'ApplyStatus', amount: 3, statusId: 'strength', target: 'Self' }
                    ]
                }
            }
        ]
    },

    'dj_phantom': {
        id: 'dj_phantom',
        name: 'DJ Phantom',
        maxHpRange: [100, 115],
        aiPatterns: [
            {
                condition: 'Turn1',
                chance: 100,
                intent: {
                    type: 'Debuff',
                    effects: [
                        { type: 'ApplyStatus', amount: 2, statusId: 'weak', target: 'Target' },
                        { type: 'ApplyStatus', amount: 2, statusId: 'vulnerable', target: 'Target' }
                    ]
                }
            },
            {
                chance: 40,
                intent: {
                    type: 'Attack',
                    damage: 5,
                    hits: 4,
                    effects: [
                        { type: 'Damage', amount: 5, target: 'Target' },
                        { type: 'Damage', amount: 5, target: 'Target' },
                        { type: 'Damage', amount: 5, target: 'Target' },
                        { type: 'Damage', amount: 5, target: 'Target' }
                    ]
                }
            },
            {
                chance: 30,
                intent: {
                    type: 'Buff',
                    effects: [
                        { type: 'ApplyStatus', amount: 3, statusId: 'strength', target: 'Self' }
                    ]
                }
            },
            {
                chance: 30,
                intent: {
                    type: 'AttackDebuff',
                    damage: 15,
                    effects: [
                        { type: 'Damage', amount: 15, target: 'Target' },
                        { type: 'ApplyStatus', amount: 1, statusId: 'weak', target: 'Target' },
                        { type: 'ApplyStatus', amount: 1, statusId: 'vulnerable', target: 'Target' }
                    ]
                }
            }
        ]
    },
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
