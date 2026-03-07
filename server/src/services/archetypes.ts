export interface ArchetypeDefinition {
    id: string;
    names: string[];
    titles: string[];
    traits: string[][];
    cards: ArchetypeCard[];
}

export interface ArchetypeCard {
    name: string;
    type: 'Attack' | 'Skill' | 'Power';
    cost: number;
    description: string;
    target: 'Enemy' | 'Self' | 'AllEnemies' | 'None';
    effects: { type: string; amount?: number; statusId?: string; target: string }[];
    exhausts?: boolean;
}

export const ARCHETYPES: Record<string, ArchetypeDefinition> = {
    ember: {
        id: 'ember',
        names: ['Pyraxis', 'Ashara', 'Cinderfall', 'Blazeborn'],
        titles: ['Wielder of Living Flame', 'The Emberheart', 'Keeper of the Inferno', 'Ashen Sovereign'],
        traits: [
            ['Fiery', 'Passionate', 'Bold'],
            ['Intense', 'Driven', 'Radiant'],
            ['Explosive', 'Warm', 'Fearless'],
        ],
        cards: [
            // 4 Strikes
            { name: 'Ember Strike', type: 'Attack', cost: 1, description: 'Deal 6 damage.', target: 'Enemy', effects: [{ type: 'Damage', amount: 6, target: 'Target' }] },
            { name: 'Flame Slash', type: 'Attack', cost: 1, description: 'Deal 6 damage.', target: 'Enemy', effects: [{ type: 'Damage', amount: 6, target: 'Target' }] },
            { name: 'Searing Blow', type: 'Attack', cost: 2, description: 'Deal 12 damage.', target: 'Enemy', effects: [{ type: 'Damage', amount: 12, target: 'Target' }] },
            { name: 'Wildfire', type: 'Attack', cost: 1, description: 'Deal 4 damage to ALL enemies.', target: 'AllEnemies', effects: [{ type: 'Damage', amount: 4, target: 'AllEnemies' }] },
            // 3 Blocks
            { name: 'Ember Shield', type: 'Skill', cost: 1, description: 'Gain 5 Block.', target: 'Self', effects: [{ type: 'Block', amount: 5, target: 'Self' }] },
            { name: 'Heat Barrier', type: 'Skill', cost: 1, description: 'Gain 5 Block.', target: 'Self', effects: [{ type: 'Block', amount: 5, target: 'Self' }] },
            { name: 'Firewall', type: 'Skill', cost: 2, description: 'Gain 12 Block.', target: 'Self', effects: [{ type: 'Block', amount: 12, target: 'Self' }] },
            // 3 Specials
            { name: 'Ignite', type: 'Skill', cost: 1, description: 'Apply 2 Vulnerable.', target: 'Enemy', effects: [{ type: 'ApplyStatus', amount: 2, statusId: 'vulnerable', target: 'Target' }] },
            { name: 'Inner Fire', type: 'Power', cost: 1, description: 'Gain 2 Strength.', target: 'Self', effects: [{ type: 'ApplyStatus', amount: 2, statusId: 'strength', target: 'Self' }] },
            { name: 'Inferno Burst', type: 'Attack', cost: 2, description: 'Deal 8 damage to ALL enemies. Apply 1 Vulnerable.', target: 'AllEnemies', effects: [{ type: 'Damage', amount: 8, target: 'AllEnemies' }, { type: 'ApplyStatus', amount: 1, statusId: 'vulnerable', target: 'AllEnemies' }] },
        ]
    },

    tide: {
        id: 'tide',
        names: ['Coraliss', 'Wavecrest', 'Thalara', 'Riptide'],
        titles: ['Voice of the Deep', 'The Tidecaller', 'Warden of Still Waters', 'Abyssal Guardian'],
        traits: [
            ['Calm', 'Adaptive', 'Flowing'],
            ['Patient', 'Resilient', 'Deep'],
            ['Serene', 'Mysterious', 'Fluid'],
        ],
        cards: [
            { name: 'Tidal Strike', type: 'Attack', cost: 1, description: 'Deal 6 damage.', target: 'Enemy', effects: [{ type: 'Damage', amount: 6, target: 'Target' }] },
            { name: 'Wave Crash', type: 'Attack', cost: 1, description: 'Deal 6 damage.', target: 'Enemy', effects: [{ type: 'Damage', amount: 6, target: 'Target' }] },
            { name: 'Riptide Slam', type: 'Attack', cost: 2, description: 'Deal 10 damage. Apply 1 Weak.', target: 'Enemy', effects: [{ type: 'Damage', amount: 10, target: 'Target' }, { type: 'ApplyStatus', amount: 1, statusId: 'weak', target: 'Target' }] },
            { name: 'Undertow', type: 'Attack', cost: 1, description: 'Deal 3 damage to ALL enemies.', target: 'AllEnemies', effects: [{ type: 'Damage', amount: 3, target: 'AllEnemies' }] },
            { name: 'Coral Armor', type: 'Skill', cost: 1, description: 'Gain 5 Block.', target: 'Self', effects: [{ type: 'Block', amount: 5, target: 'Self' }] },
            { name: 'Whirlpool Guard', type: 'Skill', cost: 1, description: 'Gain 5 Block.', target: 'Self', effects: [{ type: 'Block', amount: 5, target: 'Self' }] },
            { name: 'Abyssal Wall', type: 'Skill', cost: 2, description: 'Gain 14 Block.', target: 'Self', effects: [{ type: 'Block', amount: 14, target: 'Self' }] },
            { name: 'Drench', type: 'Skill', cost: 1, description: 'Apply 2 Weak.', target: 'Enemy', effects: [{ type: 'ApplyStatus', amount: 2, statusId: 'weak', target: 'Target' }] },
            { name: 'Deep Current', type: 'Power', cost: 1, description: 'Gain 2 Dexterity.', target: 'Self', effects: [{ type: 'ApplyStatus', amount: 2, statusId: 'dexterity', target: 'Self' }] },
            { name: 'Healing Tide', type: 'Skill', cost: 1, description: 'Gain 6 Block. Heal 3 HP.', target: 'Self', effects: [{ type: 'Block', amount: 6, target: 'Self' }, { type: 'Heal', amount: 3, target: 'Self' }], exhausts: true },
        ]
    },

    storm: {
        id: 'storm',
        names: ['Voltara', 'Thundermaw', 'Strixel', 'Galeborn'],
        titles: ['Herald of the Tempest', 'The Lightning Weaver', 'Stormchaser', 'Eye of the Maelstrom'],
        traits: [
            ['Electric', 'Unpredictable', 'Fast'],
            ['Dynamic', 'Energetic', 'Sharp'],
            ['Chaotic', 'Brilliant', 'Restless'],
        ],
        cards: [
            { name: 'Bolt Strike', type: 'Attack', cost: 1, description: 'Deal 7 damage.', target: 'Enemy', effects: [{ type: 'Damage', amount: 7, target: 'Target' }] },
            { name: 'Arc Flash', type: 'Attack', cost: 1, description: 'Deal 5 damage. Draw 1 card.', target: 'Enemy', effects: [{ type: 'Damage', amount: 5, target: 'Target' }, { type: 'Draw', amount: 1, target: 'Self' }] },
            { name: 'Thunderclap', type: 'Attack', cost: 2, description: 'Deal 11 damage.', target: 'Enemy', effects: [{ type: 'Damage', amount: 11, target: 'Target' }] },
            { name: 'Chain Lightning', type: 'Attack', cost: 1, description: 'Deal 4 damage to ALL enemies.', target: 'AllEnemies', effects: [{ type: 'Damage', amount: 4, target: 'AllEnemies' }] },
            { name: 'Static Shield', type: 'Skill', cost: 1, description: 'Gain 5 Block.', target: 'Self', effects: [{ type: 'Block', amount: 5, target: 'Self' }] },
            { name: 'Wind Wall', type: 'Skill', cost: 1, description: 'Gain 5 Block.', target: 'Self', effects: [{ type: 'Block', amount: 5, target: 'Self' }] },
            { name: 'Gale Force', type: 'Skill', cost: 2, description: 'Gain 11 Block. Draw 1 card.', target: 'Self', effects: [{ type: 'Block', amount: 11, target: 'Self' }, { type: 'Draw', amount: 1, target: 'Self' }] },
            { name: 'Overcharge', type: 'Skill', cost: 0, description: 'Draw 2 cards.', target: 'Self', effects: [{ type: 'Draw', amount: 2, target: 'Self' }], exhausts: true },
            { name: 'Surge', type: 'Power', cost: 1, description: 'Gain 2 Strength.', target: 'Self', effects: [{ type: 'ApplyStatus', amount: 2, statusId: 'strength', target: 'Self' }] },
            { name: 'Electrocute', type: 'Attack', cost: 1, description: 'Deal 8 damage. Apply 1 Vulnerable.', target: 'Enemy', effects: [{ type: 'Damage', amount: 8, target: 'Target' }, { type: 'ApplyStatus', amount: 1, statusId: 'vulnerable', target: 'Target' }] },
        ]
    },

    root: {
        id: 'root',
        names: ['Thornhelm', 'Mossward', 'Eldergrove', 'Verdantia'],
        titles: ['Guardian of the Ancient Wood', 'The Rootbound', 'Keeper of the Green', 'Living Fortress'],
        traits: [
            ['Steadfast', 'Grounded', 'Enduring'],
            ['Patient', 'Protective', 'Strong'],
            ['Ancient', 'Wise', 'Unyielding'],
        ],
        cards: [
            { name: 'Vine Lash', type: 'Attack', cost: 1, description: 'Deal 5 damage. Gain 3 Block.', target: 'Enemy', effects: [{ type: 'Damage', amount: 5, target: 'Target' }, { type: 'Block', amount: 3, target: 'Self' }] },
            { name: 'Thorn Strike', type: 'Attack', cost: 1, description: 'Deal 6 damage.', target: 'Enemy', effects: [{ type: 'Damage', amount: 6, target: 'Target' }] },
            { name: 'Branch Slam', type: 'Attack', cost: 2, description: 'Deal 10 damage. Gain 5 Block.', target: 'Enemy', effects: [{ type: 'Damage', amount: 10, target: 'Target' }, { type: 'Block', amount: 5, target: 'Self' }] },
            { name: 'Root Burst', type: 'Attack', cost: 1, description: 'Deal 3 damage to ALL enemies.', target: 'AllEnemies', effects: [{ type: 'Damage', amount: 3, target: 'AllEnemies' }] },
            { name: 'Bark Armor', type: 'Skill', cost: 1, description: 'Gain 7 Block.', target: 'Self', effects: [{ type: 'Block', amount: 7, target: 'Self' }] },
            { name: 'Living Wall', type: 'Skill', cost: 1, description: 'Gain 6 Block.', target: 'Self', effects: [{ type: 'Block', amount: 6, target: 'Self' }] },
            { name: 'Ironwood', type: 'Skill', cost: 2, description: 'Gain 16 Block.', target: 'Self', effects: [{ type: 'Block', amount: 16, target: 'Self' }] },
            { name: 'Entangle', type: 'Skill', cost: 1, description: 'Apply 2 Weak. Gain 4 Block.', target: 'Enemy', effects: [{ type: 'ApplyStatus', amount: 2, statusId: 'weak', target: 'Target' }, { type: 'Block', amount: 4, target: 'Self' }] },
            { name: 'Fortify', type: 'Power', cost: 1, description: 'Gain 3 Dexterity.', target: 'Self', effects: [{ type: 'ApplyStatus', amount: 3, statusId: 'dexterity', target: 'Self' }] },
            { name: 'Regenerate', type: 'Skill', cost: 1, description: 'Heal 6 HP. Gain 4 Block.', target: 'Self', effects: [{ type: 'Heal', amount: 6, target: 'Self' }, { type: 'Block', amount: 4, target: 'Self' }], exhausts: true },
        ]
    },

    shade: {
        id: 'shade',
        names: ['Noxaris', 'Veilstep', 'Umbrath', 'Duskfang'],
        titles: ['Walker Between Shadows', 'The Unseen Blade', 'Whisper in the Dark', 'Phantom of the Spire'],
        traits: [
            ['Cunning', 'Stealthy', 'Precise'],
            ['Elusive', 'Sharp', 'Calculating'],
            ['Mysterious', 'Deadly', 'Silent'],
        ],
        cards: [
            { name: 'Shadow Stab', type: 'Attack', cost: 1, description: 'Deal 6 damage.', target: 'Enemy', effects: [{ type: 'Damage', amount: 6, target: 'Target' }] },
            { name: 'Venom Strike', type: 'Attack', cost: 1, description: 'Deal 5 damage. Apply 1 Weak.', target: 'Enemy', effects: [{ type: 'Damage', amount: 5, target: 'Target' }, { type: 'ApplyStatus', amount: 1, statusId: 'weak', target: 'Target' }] },
            { name: 'Backstab', type: 'Attack', cost: 0, description: 'Deal 8 damage. Exhaust.', target: 'Enemy', effects: [{ type: 'Damage', amount: 8, target: 'Target' }], exhausts: true },
            { name: 'Fan of Knives', type: 'Attack', cost: 1, description: 'Deal 4 damage to ALL enemies. Draw 1 card.', target: 'AllEnemies', effects: [{ type: 'Damage', amount: 4, target: 'AllEnemies' }, { type: 'Draw', amount: 1, target: 'Self' }] },
            { name: 'Cloak', type: 'Skill', cost: 1, description: 'Gain 5 Block.', target: 'Self', effects: [{ type: 'Block', amount: 5, target: 'Self' }] },
            { name: 'Shadow Step', type: 'Skill', cost: 1, description: 'Gain 5 Block.', target: 'Self', effects: [{ type: 'Block', amount: 5, target: 'Self' }] },
            { name: 'Vanish', type: 'Skill', cost: 2, description: 'Gain 13 Block.', target: 'Self', effects: [{ type: 'Block', amount: 13, target: 'Self' }] },
            { name: 'Poison Tips', type: 'Skill', cost: 1, description: 'Apply 2 Vulnerable. Apply 1 Weak.', target: 'Enemy', effects: [{ type: 'ApplyStatus', amount: 2, statusId: 'vulnerable', target: 'Target' }, { type: 'ApplyStatus', amount: 1, statusId: 'weak', target: 'Target' }] },
            { name: 'Adrenaline', type: 'Skill', cost: 0, description: 'Draw 2 cards. Exhaust.', target: 'Self', effects: [{ type: 'Draw', amount: 2, target: 'Self' }], exhausts: true },
            { name: 'Shadow Form', type: 'Power', cost: 2, description: 'Gain 2 Dexterity. Gain 1 Strength.', target: 'Self', effects: [{ type: 'ApplyStatus', amount: 2, statusId: 'dexterity', target: 'Self' }, { type: 'ApplyStatus', amount: 1, statusId: 'strength', target: 'Self' }] },
        ]
    }
};
