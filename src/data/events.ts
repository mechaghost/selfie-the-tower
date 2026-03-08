/**
 * Mystery Event Definitions
 *
 * Pre-written narrative events for "Unknown" / "?" map nodes.
 * Each event presents 2-3 choices with different risk/reward trade-offs.
 */

export interface EventEffect {
    type: 'heal' | 'healFull' | 'healPercent' | 'damage' | 'gold' | 'loseMaxHp' | 'removeRandomCard' | 'addRandomCard' | 'nothing';
    amount?: number;
}

export interface EventChoice {
    id: string;
    label: string;
    description: string;
    condition?: 'hasGold50' | 'hasGold40';
    effects: EventEffect[];
}

export interface GameEvent {
    id: string;
    title: string;
    description: string;
    choices: EventChoice[];
}

export const EVENTS: GameEvent[] = [
    {
        id: 'boombox_oracle',
        title: 'The Boombox Oracle',
        description: 'A figure hunches over a golden boombox in a doorway, bass rattling the fire escapes. They look up with chrome-ringed eyes. "The frequencies know your name, runner. Let me read the static for you."',
        choices: [
            {
                id: 'boombox_read',
                label: 'Let them read you',
                description: 'Heal 15% of your max HP',
                effects: [{ type: 'healPercent', amount: 15 }],
            },
            {
                id: 'boombox_smash',
                label: 'Smash the boombox',
                description: 'Gain 30 gold',
                effects: [{ type: 'gold', amount: 30 }],
            },
            {
                id: 'boombox_walk',
                label: 'Walk away',
                description: 'Nothing happens',
                effects: [{ type: 'nothing' }],
            },
        ],
    },
    {
        id: 'neon_graffiti',
        title: 'Neon Graffiti',
        description: 'Violet light bleeds from a wall of graffiti in a dead-end alley. The paint moves, breathing, pulsing like a second heartbeat. Something in it wants out.',
        choices: [
            {
                id: 'graffiti_touch',
                label: 'Touch it',
                description: 'Remove a random card from your deck',
                effects: [{ type: 'removeRandomCard' }],
            },
            {
                id: 'graffiti_study',
                label: 'Study it',
                description: 'Gain 20 gold',
                effects: [{ type: 'gold', amount: 20 }],
            },
            {
                id: 'graffiti_ignore',
                label: 'Ignore it',
                description: 'Nothing happens',
                effects: [{ type: 'nothing' }],
            },
        ],
    },
    {
        id: 'arcade_machine',
        title: 'The Arcade Machine',
        description: 'A cabinet flickers in a trash-choked alley, its screen casting cyan light across wet concrete. No plug, no power cord. The screen reads INSERT COIN in jittering pixels.',
        choices: [
            {
                id: 'arcade_insert',
                label: 'Insert 50 gold',
                description: 'Add a random card to your deck',
                condition: 'hasGold50',
                effects: [{ type: 'gold', amount: -50 }, { type: 'addRandomCard' }],
            },
            {
                id: 'arcade_kick',
                label: 'Kick the machine',
                description: 'Lose 8 HP, gain 25 gold',
                effects: [{ type: 'damage', amount: 8 }, { type: 'gold', amount: 25 }],
            },
            {
                id: 'arcade_leave',
                label: 'Leave it',
                description: 'Nothing happens',
                effects: [{ type: 'nothing' }],
            },
        ],
    },
    {
        id: 'back_alley_ramen',
        title: 'Back-Alley Ramen',
        description: 'Steam curls from a ramen cart wedged between dumpsters. The cook, face hidden behind a surgical mask and mirrored shades, slides a menu across the counter. The prices are suspiciously low.',
        choices: [
            {
                id: 'ramen_special',
                label: 'Eat the special',
                description: 'Heal to full HP, but lose 5 max HP',
                effects: [{ type: 'healFull' }, { type: 'loseMaxHp', amount: 5 }],
            },
            {
                id: 'ramen_regular',
                label: 'Regular bowl',
                description: 'Heal 25% of your max HP',
                effects: [{ type: 'healPercent', amount: 25 }],
            },
            {
                id: 'ramen_pass',
                label: 'No thanks',
                description: 'Nothing happens',
                effects: [{ type: 'nothing' }],
            },
        ],
    },
    {
        id: 'vinyl_dealer',
        title: 'The Vinyl Dealer',
        description: 'A trench coat opens to reveal rows of vinyl records, each sleeve glowing with faint neon tracework. "Rare pressings," the dealer whispers. "Each one holds a technique lost to the static."',
        choices: [
            {
                id: 'vinyl_buy',
                label: 'Buy a record \u2014 40g',
                description: 'Add a random card to your deck',
                condition: 'hasGold40',
                effects: [{ type: 'gold', amount: -40 }, { type: 'addRandomCard' }],
            },
            {
                id: 'vinyl_trade',
                label: 'Trade a card',
                description: 'Remove a card, gain a different one',
                effects: [{ type: 'removeRandomCard' }, { type: 'addRandomCard' }],
            },
            {
                id: 'vinyl_walk',
                label: 'Keep walking',
                description: 'Nothing happens',
                effects: [{ type: 'nothing' }],
            },
        ],
    },
];
