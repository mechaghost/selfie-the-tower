export interface ArchetypeDefinition {
    id: string;
    names: string[];
    titles: string[];
    traits: string[][];
    cards: ArchetypeCard[];
}

export interface ArchetypeCard {
    name: string;
    imageId: string;
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
            { name: 'Flare', imageId: 'neon_neon_strike', type: 'Attack', cost: 1, description: 'Deal 6 damage.', target: 'Enemy', effects: [{ type: 'Damage', amount: 6, target: 'Target' }] },
            { name: 'Scorch', imageId: 'neon_flame_tag', type: 'Attack', cost: 1, description: 'Deal 6 damage.', target: 'Enemy', effects: [{ type: 'Damage', amount: 6, target: 'Target' }] },
            { name: 'Molotov', imageId: 'neon_molotov_toss', type: 'Attack', cost: 2, description: 'Deal 8 damage. Apply 3 Burn.', target: 'Enemy', effects: [{ type: 'Damage', amount: 8, target: 'Target' }, { type: 'ApplyStatus', amount: 3, statusId: 'burn', target: 'Target' }] },
            { name: 'Wildfire', imageId: 'neon_wildfire', type: 'Attack', cost: 1, description: 'Deal 4 damage to ALL enemies.', target: 'AllEnemies', effects: [{ type: 'Damage', amount: 4, target: 'AllEnemies' }] },
            { name: 'Shimmer', imageId: 'neon_heat_shimmer', type: 'Skill', cost: 1, description: 'Gain 5 Block.', target: 'Self', effects: [{ type: 'Block', amount: 5, target: 'Self' }] },
            { name: 'Firewall', imageId: 'neon_firewall', type: 'Skill', cost: 1, description: 'Gain 5 Block.', target: 'Self', effects: [{ type: 'Block', amount: 5, target: 'Self' }] },
            { name: 'Barrier', imageId: 'neon_blaze_barrier', type: 'Skill', cost: 2, description: 'Gain 12 Block.', target: 'Self', effects: [{ type: 'Block', amount: 12, target: 'Self' }] },
            { name: 'Ignite', imageId: 'neon_flash_burn', type: 'Skill', cost: 1, description: 'Apply 4 Burn.', target: 'Enemy', effects: [{ type: 'ApplyStatus', amount: 4, statusId: 'burn', target: 'Target' }] },
            { name: 'Kindle', imageId: 'neon_inner_fire', type: 'Power', cost: 1, description: 'Gain 2 Strength.', target: 'Self', effects: [{ type: 'ApplyStatus', amount: 2, statusId: 'strength', target: 'Self' }] },
            { name: 'Burst', imageId: 'neon_sign_burst', type: 'Attack', cost: 2, description: 'Deal 8 damage to ALL enemies. Apply 1 Vulnerable.', target: 'AllEnemies', effects: [{ type: 'Damage', amount: 8, target: 'AllEnemies' }, { type: 'ApplyStatus', amount: 1, statusId: 'vulnerable', target: 'AllEnemies' }] },
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
            { name: 'Slash', imageId: 'chrome_chrome_slash', type: 'Attack', cost: 1, description: 'Deal 6 damage.', target: 'Enemy', effects: [{ type: 'Damage', amount: 6, target: 'Target' }] },
            { name: 'Crash', imageId: 'chrome_puddle_crash', type: 'Attack', cost: 1, description: 'Deal 6 damage.', target: 'Enemy', effects: [{ type: 'Damage', amount: 6, target: 'Target' }] },
            { name: 'Riptide', imageId: 'chrome_riptide_slam', type: 'Attack', cost: 2, description: 'Deal 10 damage. Apply 1 Weak.', target: 'Enemy', effects: [{ type: 'Damage', amount: 10, target: 'Target' }, { type: 'ApplyStatus', amount: 1, statusId: 'weak', target: 'Target' }] },
            { name: 'Undertow', imageId: 'chrome_undertow', type: 'Attack', cost: 1, description: 'Deal 3 damage to ALL enemies.', target: 'AllEnemies', effects: [{ type: 'Damage', amount: 3, target: 'AllEnemies' }] },
            { name: 'Mirror', imageId: 'chrome_mirror_guard', type: 'Skill', cost: 1, description: 'Gain 5 Block.', target: 'Self', effects: [{ type: 'Block', amount: 5, target: 'Self' }] },
            { name: 'Dodge', imageId: 'chrome_slick_dodge', type: 'Skill', cost: 1, description: 'Gain 5 Block.', target: 'Self', effects: [{ type: 'Block', amount: 5, target: 'Self' }] },
            { name: 'Bulwark', imageId: 'chrome_chrome_wall', type: 'Skill', cost: 2, description: 'Gain 14 Block.', target: 'Self', effects: [{ type: 'Block', amount: 14, target: 'Self' }] },
            { name: 'Drench', imageId: 'chrome_drench', type: 'Skill', cost: 1, description: 'Apply 2 Weak.', target: 'Enemy', effects: [{ type: 'ApplyStatus', amount: 2, statusId: 'weak', target: 'Target' }] },
            { name: 'Current', imageId: 'chrome_deep_current', type: 'Power', cost: 1, description: 'Gain 2 Dexterity.', target: 'Self', effects: [{ type: 'ApplyStatus', amount: 2, statusId: 'dexterity', target: 'Self' }] },
            { name: 'Mending', imageId: 'chrome_healing_rain', type: 'Skill', cost: 1, description: 'Gain 6 Block. Heal 3 HP.', target: 'Self', effects: [{ type: 'Block', amount: 6, target: 'Self' }, { type: 'Heal', amount: 3, target: 'Self' }], exhausts: true },
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
            { name: 'Bolt', imageId: 'volt_bolt_strike', type: 'Attack', cost: 1, description: 'Deal 7 damage.', target: 'Enemy', effects: [{ type: 'Damage', amount: 7, target: 'Target' }] },
            { name: 'Arc', imageId: 'volt_arc_flash', type: 'Attack', cost: 1, description: 'Deal 5 damage. Draw 1 card.', target: 'Enemy', effects: [{ type: 'Damage', amount: 5, target: 'Target' }, { type: 'Draw', amount: 1, target: 'Self' }] },
            { name: 'Thunder', imageId: 'volt_thunderclap', type: 'Attack', cost: 2, description: 'Deal 11 damage.', target: 'Enemy', effects: [{ type: 'Damage', amount: 11, target: 'Target' }] },
            { name: 'Chain', imageId: 'volt_chain_lightning', type: 'Attack', cost: 1, description: 'Deal 4 damage to ALL enemies.', target: 'AllEnemies', effects: [{ type: 'Damage', amount: 4, target: 'AllEnemies' }] },
            { name: 'Static', imageId: 'volt_static_shield', type: 'Skill', cost: 1, description: 'Gain 4 Block. Gain 2 Spikes.', target: 'Self', effects: [{ type: 'Block', amount: 4, target: 'Self' }, { type: 'ApplyStatus', amount: 2, statusId: 'thorns', target: 'Self' }] },
            { name: 'Freq', imageId: 'volt_frequency_wall', type: 'Skill', cost: 1, description: 'Gain 5 Block.', target: 'Self', effects: [{ type: 'Block', amount: 5, target: 'Self' }] },
            { name: 'Surge', imageId: 'volt_power_surge', type: 'Skill', cost: 2, description: 'Gain 11 Block. Draw 1 card.', target: 'Self', effects: [{ type: 'Block', amount: 11, target: 'Self' }, { type: 'Draw', amount: 1, target: 'Self' }] },
            { name: 'Overload', imageId: 'volt_overcharge', type: 'Skill', cost: 0, description: 'Draw 2 cards.', target: 'Self', effects: [{ type: 'Draw', amount: 2, target: 'Self' }], exhausts: true },
            { name: 'Dynamo', imageId: 'volt_surge', type: 'Power', cost: 1, description: 'Gain 2 Strength.', target: 'Self', effects: [{ type: 'ApplyStatus', amount: 2, statusId: 'strength', target: 'Self' }] },
            { name: 'Shock', imageId: 'volt_electrocute', type: 'Attack', cost: 1, description: 'Deal 8 damage. Apply 1 Vulnerable.', target: 'Enemy', effects: [{ type: 'Damage', amount: 8, target: 'Target' }, { type: 'ApplyStatus', amount: 1, statusId: 'vulnerable', target: 'Target' }] },
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
            { name: 'Vine', imageId: 'concrete_vine_crack', type: 'Attack', cost: 1, description: 'Deal 5 damage. Gain 3 Block.', target: 'Enemy', effects: [{ type: 'Damage', amount: 5, target: 'Target' }, { type: 'Block', amount: 3, target: 'Self' }] },
            { name: 'Rebar', imageId: 'concrete_rebar_swing', type: 'Attack', cost: 1, description: 'Deal 6 damage.', target: 'Enemy', effects: [{ type: 'Damage', amount: 6, target: 'Target' }] },
            { name: 'Slab', imageId: 'concrete_slab_slam', type: 'Attack', cost: 2, description: 'Deal 10 damage. Gain 5 Block.', target: 'Enemy', effects: [{ type: 'Damage', amount: 10, target: 'Target' }, { type: 'Block', amount: 5, target: 'Self' }] },
            { name: 'Uproot', imageId: 'concrete_root_burst', type: 'Attack', cost: 1, description: 'Deal 3 damage to ALL enemies.', target: 'AllEnemies', effects: [{ type: 'Damage', amount: 3, target: 'AllEnemies' }] },
            { name: 'Shell', imageId: 'concrete_concrete_shell', type: 'Skill', cost: 1, description: 'Gain 7 Block.', target: 'Self', effects: [{ type: 'Block', amount: 7, target: 'Self' }] },
            { name: 'Rampart', imageId: 'concrete_living_wall', type: 'Skill', cost: 1, description: 'Gain 6 Block.', target: 'Self', effects: [{ type: 'Block', amount: 6, target: 'Self' }] },
            { name: 'Ironwood', imageId: 'concrete_ironwood', type: 'Skill', cost: 2, description: 'Gain 16 Block.', target: 'Self', effects: [{ type: 'Block', amount: 16, target: 'Self' }] },
            { name: 'Entangle', imageId: 'concrete_entangle', type: 'Skill', cost: 1, description: 'Apply 2 Weak. Gain 4 Block.', target: 'Enemy', effects: [{ type: 'ApplyStatus', amount: 2, statusId: 'weak', target: 'Target' }, { type: 'Block', amount: 4, target: 'Self' }] },
            { name: 'Fortify', imageId: 'concrete_fortify', type: 'Power', cost: 1, description: 'Gain 3 Dexterity.', target: 'Self', effects: [{ type: 'ApplyStatus', amount: 3, statusId: 'dexterity', target: 'Self' }] },
            { name: 'Regen', imageId: 'concrete_regenerate', type: 'Skill', cost: 1, description: 'Gain 4 Regen. Gain 3 Block. Exhaust.', target: 'Self', effects: [{ type: 'ApplyStatus', amount: 4, statusId: 'regen', target: 'Self' }, { type: 'Block', amount: 3, target: 'Self' }], exhausts: true },
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
            { name: 'Stab', imageId: 'smoke_smoke_stab', type: 'Attack', cost: 1, description: 'Deal 6 damage.', target: 'Enemy', effects: [{ type: 'Damage', amount: 6, target: 'Target' }] },
            { name: 'Shiv', imageId: 'smoke_alley_shiv', type: 'Attack', cost: 1, description: 'Deal 5 damage. Apply 1 Weak.', target: 'Enemy', effects: [{ type: 'Damage', amount: 5, target: 'Target' }, { type: 'ApplyStatus', amount: 1, statusId: 'weak', target: 'Target' }] },
            { name: 'Ambush', imageId: 'smoke_backstab', type: 'Attack', cost: 0, description: 'Deal 8 damage. Exhaust.', target: 'Enemy', effects: [{ type: 'Damage', amount: 8, target: 'Target' }], exhausts: true },
            { name: 'Fan', imageId: 'smoke_fan_of_knives', type: 'Attack', cost: 1, description: 'Deal 4 damage to ALL enemies. Draw 1 card.', target: 'AllEnemies', effects: [{ type: 'Damage', amount: 4, target: 'AllEnemies' }, { type: 'Draw', amount: 1, target: 'Self' }] },
            { name: 'Cloak', imageId: 'smoke_fog_cloak', type: 'Skill', cost: 1, description: 'Gain 5 Block.', target: 'Self', effects: [{ type: 'Block', amount: 5, target: 'Self' }] },
            { name: 'Shadow', imageId: 'smoke_shadow_step', type: 'Skill', cost: 1, description: 'Gain 5 Block.', target: 'Self', effects: [{ type: 'Block', amount: 5, target: 'Self' }] },
            { name: 'Vanish', imageId: 'smoke_vanish', type: 'Skill', cost: 2, description: 'Gain 13 Block.', target: 'Self', effects: [{ type: 'Block', amount: 13, target: 'Self' }] },
            { name: 'Venom', imageId: 'smoke_poison_tips', type: 'Skill', cost: 1, description: 'Apply 2 Vulnerable. Apply 1 Weak.', target: 'Enemy', effects: [{ type: 'ApplyStatus', amount: 2, statusId: 'vulnerable', target: 'Target' }, { type: 'ApplyStatus', amount: 1, statusId: 'weak', target: 'Target' }] },
            { name: 'Rush', imageId: 'smoke_adrenaline', type: 'Skill', cost: 0, description: 'Draw 2 cards. Exhaust.', target: 'Self', effects: [{ type: 'Draw', amount: 2, target: 'Self' }], exhausts: true },
            { name: 'Phantom', imageId: 'smoke_smoke_form', type: 'Power', cost: 2, description: 'Gain 2 Dexterity. Gain 1 Strength.', target: 'Self', effects: [{ type: 'ApplyStatus', amount: 2, statusId: 'dexterity', target: 'Self' }, { type: 'ApplyStatus', amount: 1, statusId: 'strength', target: 'Self' }] },
        ]
    }
};
