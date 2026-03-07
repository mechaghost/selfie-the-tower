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
    neon: {
        id: 'neon',
        names: ['Blaze Tanaka', 'Nyx Fuego', 'Sol Ashford', 'Kira Heatwave'],
        titles: ['Street Pyromancer', 'The Neon Flame', 'Keeper of the Backstreet Inferno', 'Spray-Can Sorcerer'],
        traits: [
            ['Fiery', 'Passionate', 'Bold'],
            ['Intense', 'Driven', 'Radiant'],
            ['Explosive', 'Warm', 'Fearless'],
        ],
        cards: [
            { name: 'Neon Strike', type: 'Attack', cost: 1, description: 'Deal 6 damage.', target: 'Enemy', effects: [{ type: 'Damage', amount: 6, target: 'Target' }] },
            { name: 'Flame Tag', type: 'Attack', cost: 1, description: 'Deal 6 damage.', target: 'Enemy', effects: [{ type: 'Damage', amount: 6, target: 'Target' }] },
            { name: 'Molotov Toss', type: 'Attack', cost: 2, description: 'Deal 12 damage.', target: 'Enemy', effects: [{ type: 'Damage', amount: 12, target: 'Target' }] },
            { name: 'Wildfire', type: 'Attack', cost: 1, description: 'Deal 4 damage to ALL enemies.', target: 'AllEnemies', effects: [{ type: 'Damage', amount: 4, target: 'AllEnemies' }] },
            { name: 'Heat Shimmer', type: 'Skill', cost: 1, description: 'Gain 5 Block.', target: 'Self', effects: [{ type: 'Block', amount: 5, target: 'Self' }] },
            { name: 'Firewall', type: 'Skill', cost: 1, description: 'Gain 5 Block.', target: 'Self', effects: [{ type: 'Block', amount: 5, target: 'Self' }] },
            { name: 'Blaze Barrier', type: 'Skill', cost: 2, description: 'Gain 12 Block.', target: 'Self', effects: [{ type: 'Block', amount: 12, target: 'Self' }] },
            { name: 'Flash Burn', type: 'Skill', cost: 1, description: 'Apply 2 Vulnerable.', target: 'Enemy', effects: [{ type: 'ApplyStatus', amount: 2, statusId: 'vulnerable', target: 'Target' }] },
            { name: 'Inner Fire', type: 'Power', cost: 1, description: 'Gain 2 Strength.', target: 'Self', effects: [{ type: 'ApplyStatus', amount: 2, statusId: 'strength', target: 'Self' }] },
            { name: 'Sign Burst', type: 'Attack', cost: 2, description: 'Deal 8 damage to ALL enemies. Apply 1 Vulnerable.', target: 'AllEnemies', effects: [{ type: 'Damage', amount: 8, target: 'AllEnemies' }, { type: 'ApplyStatus', amount: 1, statusId: 'vulnerable', target: 'AllEnemies' }] },
        ]
    },

    chrome: {
        id: 'chrome',
        names: ['Rain Kobayashi', 'Mira Flux', 'Kai Reflux', 'Sable Tidecrest'],
        titles: ['Rain Walker', 'The Chrome Mirror', 'Warden of Wet Pavement', 'Puddle Prophet'],
        traits: [
            ['Calm', 'Adaptive', 'Flowing'],
            ['Patient', 'Resilient', 'Deep'],
            ['Serene', 'Mysterious', 'Fluid'],
        ],
        cards: [
            { name: 'Chrome Slash', type: 'Attack', cost: 1, description: 'Deal 6 damage.', target: 'Enemy', effects: [{ type: 'Damage', amount: 6, target: 'Target' }] },
            { name: 'Puddle Crash', type: 'Attack', cost: 1, description: 'Deal 6 damage.', target: 'Enemy', effects: [{ type: 'Damage', amount: 6, target: 'Target' }] },
            { name: 'Riptide Slam', type: 'Attack', cost: 2, description: 'Deal 10 damage. Apply 1 Weak.', target: 'Enemy', effects: [{ type: 'Damage', amount: 10, target: 'Target' }, { type: 'ApplyStatus', amount: 1, statusId: 'weak', target: 'Target' }] },
            { name: 'Undertow', type: 'Attack', cost: 1, description: 'Deal 3 damage to ALL enemies.', target: 'AllEnemies', effects: [{ type: 'Damage', amount: 3, target: 'AllEnemies' }] },
            { name: 'Mirror Guard', type: 'Skill', cost: 1, description: 'Gain 5 Block.', target: 'Self', effects: [{ type: 'Block', amount: 5, target: 'Self' }] },
            { name: 'Slick Dodge', type: 'Skill', cost: 1, description: 'Gain 5 Block.', target: 'Self', effects: [{ type: 'Block', amount: 5, target: 'Self' }] },
            { name: 'Chrome Wall', type: 'Skill', cost: 2, description: 'Gain 14 Block.', target: 'Self', effects: [{ type: 'Block', amount: 14, target: 'Self' }] },
            { name: 'Drench', type: 'Skill', cost: 1, description: 'Apply 2 Weak.', target: 'Enemy', effects: [{ type: 'ApplyStatus', amount: 2, statusId: 'weak', target: 'Target' }] },
            { name: 'Deep Current', type: 'Power', cost: 1, description: 'Gain 2 Dexterity.', target: 'Self', effects: [{ type: 'ApplyStatus', amount: 2, statusId: 'dexterity', target: 'Self' }] },
            { name: 'Healing Rain', type: 'Skill', cost: 1, description: 'Gain 6 Block. Heal 3 HP.', target: 'Self', effects: [{ type: 'Block', amount: 6, target: 'Self' }, { type: 'Heal', amount: 3, target: 'Self' }], exhausts: true },
        ]
    },

    volt: {
        id: 'volt',
        names: ['Sparks Miyamoto', 'Zara Voltline', 'Rex Ampere', 'Jett Stormwire'],
        titles: ['Rooftop Lightning Rod', 'The Volt Runner', 'Antenna Punk', 'Radio Tower Mage'],
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
            { name: 'Frequency Wall', type: 'Skill', cost: 1, description: 'Gain 5 Block.', target: 'Self', effects: [{ type: 'Block', amount: 5, target: 'Self' }] },
            { name: 'Power Surge', type: 'Skill', cost: 2, description: 'Gain 11 Block. Draw 1 card.', target: 'Self', effects: [{ type: 'Block', amount: 11, target: 'Self' }, { type: 'Draw', amount: 1, target: 'Self' }] },
            { name: 'Overcharge', type: 'Skill', cost: 0, description: 'Draw 2 cards.', target: 'Self', effects: [{ type: 'Draw', amount: 2, target: 'Self' }], exhausts: true },
            { name: 'Surge', type: 'Power', cost: 1, description: 'Gain 2 Strength.', target: 'Self', effects: [{ type: 'ApplyStatus', amount: 2, statusId: 'strength', target: 'Self' }] },
            { name: 'Electrocute', type: 'Attack', cost: 1, description: 'Deal 8 damage. Apply 1 Vulnerable.', target: 'Enemy', effects: [{ type: 'Damage', amount: 8, target: 'Target' }, { type: 'ApplyStatus', amount: 1, statusId: 'vulnerable', target: 'Target' }] },
        ]
    },

    concrete: {
        id: 'concrete',
        names: ['Mossfield Rex', 'Ivy Stoneheart', 'Oak Kuroda', 'Slab Verdana'],
        titles: ['Urban Druid', 'The Concrete Bloom', 'Keeper of the Overgrown Lot', 'Warehouse Warden'],
        traits: [
            ['Steadfast', 'Grounded', 'Enduring'],
            ['Patient', 'Protective', 'Strong'],
            ['Ancient', 'Wise', 'Unyielding'],
        ],
        cards: [
            { name: 'Vine Crack', type: 'Attack', cost: 1, description: 'Deal 5 damage. Gain 3 Block.', target: 'Enemy', effects: [{ type: 'Damage', amount: 5, target: 'Target' }, { type: 'Block', amount: 3, target: 'Self' }] },
            { name: 'Rebar Swing', type: 'Attack', cost: 1, description: 'Deal 6 damage.', target: 'Enemy', effects: [{ type: 'Damage', amount: 6, target: 'Target' }] },
            { name: 'Slab Slam', type: 'Attack', cost: 2, description: 'Deal 10 damage. Gain 5 Block.', target: 'Enemy', effects: [{ type: 'Damage', amount: 10, target: 'Target' }, { type: 'Block', amount: 5, target: 'Self' }] },
            { name: 'Root Burst', type: 'Attack', cost: 1, description: 'Deal 3 damage to ALL enemies.', target: 'AllEnemies', effects: [{ type: 'Damage', amount: 3, target: 'AllEnemies' }] },
            { name: 'Concrete Shell', type: 'Skill', cost: 1, description: 'Gain 7 Block.', target: 'Self', effects: [{ type: 'Block', amount: 7, target: 'Self' }] },
            { name: 'Living Wall', type: 'Skill', cost: 1, description: 'Gain 6 Block.', target: 'Self', effects: [{ type: 'Block', amount: 6, target: 'Self' }] },
            { name: 'Ironwood', type: 'Skill', cost: 2, description: 'Gain 16 Block.', target: 'Self', effects: [{ type: 'Block', amount: 16, target: 'Self' }] },
            { name: 'Entangle', type: 'Skill', cost: 1, description: 'Apply 2 Weak. Gain 4 Block.', target: 'Enemy', effects: [{ type: 'ApplyStatus', amount: 2, statusId: 'weak', target: 'Target' }, { type: 'Block', amount: 4, target: 'Self' }] },
            { name: 'Fortify', type: 'Power', cost: 1, description: 'Gain 3 Dexterity.', target: 'Self', effects: [{ type: 'ApplyStatus', amount: 3, statusId: 'dexterity', target: 'Self' }] },
            { name: 'Regenerate', type: 'Skill', cost: 1, description: 'Heal 6 HP. Gain 4 Block.', target: 'Self', effects: [{ type: 'Heal', amount: 6, target: 'Self' }, { type: 'Block', amount: 4, target: 'Self' }], exhausts: true },
        ]
    },

    smoke: {
        id: 'smoke',
        names: ['Shade Mori', 'Veil Nakamura', 'Dusk Ashworth', 'Nyx Fading'],
        titles: ['Alley Ghost', 'The Smoke Signal', 'Whisper in the Fog', 'Streetlight Phantom'],
        traits: [
            ['Cunning', 'Stealthy', 'Precise'],
            ['Elusive', 'Sharp', 'Calculating'],
            ['Mysterious', 'Deadly', 'Silent'],
        ],
        cards: [
            { name: 'Smoke Stab', type: 'Attack', cost: 1, description: 'Deal 6 damage.', target: 'Enemy', effects: [{ type: 'Damage', amount: 6, target: 'Target' }] },
            { name: 'Alley Shiv', type: 'Attack', cost: 1, description: 'Deal 5 damage. Apply 1 Weak.', target: 'Enemy', effects: [{ type: 'Damage', amount: 5, target: 'Target' }, { type: 'ApplyStatus', amount: 1, statusId: 'weak', target: 'Target' }] },
            { name: 'Backstab', type: 'Attack', cost: 0, description: 'Deal 8 damage. Exhaust.', target: 'Enemy', effects: [{ type: 'Damage', amount: 8, target: 'Target' }], exhausts: true },
            { name: 'Fan of Knives', type: 'Attack', cost: 1, description: 'Deal 4 damage to ALL enemies. Draw 1 card.', target: 'AllEnemies', effects: [{ type: 'Damage', amount: 4, target: 'AllEnemies' }, { type: 'Draw', amount: 1, target: 'Self' }] },
            { name: 'Fog Cloak', type: 'Skill', cost: 1, description: 'Gain 5 Block.', target: 'Self', effects: [{ type: 'Block', amount: 5, target: 'Self' }] },
            { name: 'Shadow Step', type: 'Skill', cost: 1, description: 'Gain 5 Block.', target: 'Self', effects: [{ type: 'Block', amount: 5, target: 'Self' }] },
            { name: 'Vanish', type: 'Skill', cost: 2, description: 'Gain 13 Block.', target: 'Self', effects: [{ type: 'Block', amount: 13, target: 'Self' }] },
            { name: 'Poison Tips', type: 'Skill', cost: 1, description: 'Apply 2 Vulnerable. Apply 1 Weak.', target: 'Enemy', effects: [{ type: 'ApplyStatus', amount: 2, statusId: 'vulnerable', target: 'Target' }, { type: 'ApplyStatus', amount: 1, statusId: 'weak', target: 'Target' }] },
            { name: 'Adrenaline', type: 'Skill', cost: 0, description: 'Draw 2 cards. Exhaust.', target: 'Self', effects: [{ type: 'Draw', amount: 2, target: 'Self' }], exhausts: true },
            { name: 'Smoke Form', type: 'Power', cost: 2, description: 'Gain 2 Dexterity. Gain 1 Strength.', target: 'Self', effects: [{ type: 'ApplyStatus', amount: 2, statusId: 'dexterity', target: 'Self' }, { type: 'ApplyStatus', amount: 1, statusId: 'strength', target: 'Self' }] },
        ]
    }
};
