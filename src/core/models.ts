export type CardType = 'Attack' | 'Skill' | 'Power' | 'Status' | 'Curse';
export type TargetType = 'None' | 'Enemy' | 'Self' | 'AllEnemies';

export interface Card {
    id: string; // Unique reference for the card definition (e.g., 'strike_red')
    instanceId: string; // Unique ID for this specific physical copy in the deck
    name: string;
    type: CardType;
    cost: number;
    description: string;
    target: TargetType;
    effects: Effect[];
    imageId?: string;
    imageUrl?: string; // Presigned URL for AI-generated card art
    exhausts?: boolean;
    ethereal?: boolean;
    upgraded?: boolean;
    isHeroCard?: boolean;
}

export interface StatusDefinition {
    id: string;
    name: string;
    icon: string;
    type: 'Buff' | 'Debuff';
    decreasesPerTurn: boolean;
    damageTakenMultiplier?: number;
    damageGivenMultiplier?: number;
    flatDamageGivenPerStack?: number;
    flatBlockGivenPerStack?: number;
}

export interface StatusEffect {
    id: string; // e.g., 'vulnerable', 'weak', 'strength'
    name: string;
    amount: number;
    justApplied?: boolean; // Sometimes statuses lose stacks at turn end, this helps prevent immediate decay
}

export type EffectType = 'Damage' | 'Block' | 'ApplyStatus' | 'Heal' | 'Draw' | 'Discard' | 'Exhaust';

export interface Effect {
    type: EffectType;
    amount?: number;
    statusId?: string; // e.g., 'vulnerable', 'weak', 'strength'
    target: 'Self' | 'Target' | 'AllEnemies' | 'RandomEnemy' | 'None';
}

export type IntentType = 'Attack' | 'Defend' | 'Buff' | 'Debuff' | 'AttackDefend' | 'AttackDebuff' | 'Unknown';

export interface EnemyIntent {
    type: IntentType;
    damage?: number;     // Rendered in UI (e.g. "11")
    hits?: number;       // Rendered in UI (e.g. "11x2")
    block?: number;      // Rendered in UI (e.g. "5")
    effects: Effect[];   // The strictly evaluated JSON payloads executed upon turn resolution
}

export type PatternCondition = 'Turn1' | 'BelowHalfHP' | 'Always';

export interface AIPattern {
    chance: number; // Probability weight. E.g. 25, 30, 45
    condition?: PatternCondition; // Defaults to Always
    intent: EnemyIntent;
}

export interface EnemyDefinition {
    id: string; // Internal template ID, e.g. 'jaw_worm'
    name: string;
    maxHpRange: [number, number]; // e.g. [40, 44]
    aiPatterns: AIPattern[];
}

export interface Entity {
    id: string;
    name: string;
    hp: number;
    maxHp: number;
    block: number;
    statuses: StatusEffect[];
}

export interface Player extends Entity {
    energy: number;
    maxEnergy: number;
    gold: number;
    portraitUrl?: string;
    spriteUrl?: string; // Full-body transparent sprite for combat animations
}

export interface Enemy extends Entity {
    templateId: string;
    intent: EnemyIntent | null;
}

// Actions are objects that describe a single atomic transformation of the game state
export type GameActionType =
    | 'PLAY_CARD'
    | 'DRAW_CARD'
    | 'DISCARD_HAND'
    | 'DAMAGE_ENTITY'
    | 'GAIN_BLOCK'
    | 'APPLY_STATUS'
    | 'HEAL_ENTITY'
    | 'END_TURN'
    | 'START_TURN'
    | 'CALCULATE_INTENTS'
    | 'ANNOUNCE_INTENT'
    | 'DELAY'
    | 'PLAY_ANIMATION';

export interface GameAction {
    type: GameActionType;
    payload?: any;
}

export interface FloatingText {
    id: string; // Unique for React key
    targetId: string; // The entity ID to attach to
    value: number | string;
    type: 'damage' | 'block' | 'heal' | 'status';
}

export interface ActiveAnimation {
    id: string;
    targetId: string;
    type: 'lunge' | 'stagger';
    destinationId?: string;
}

export interface Character {
    id: string;
    name: string;
    maxHp: number;
    maxEnergy: number;
    startingGold: number;
    startingDeck: string[]; // Card IDs to populate the masterDeck
}

// --- UGC Types ---
export type Archetype = 'neon' | 'chrome' | 'volt' | 'concrete' | 'smoke';
export type UgcPhase = 'capture' | 'generating' | 'reveal' | null;

export interface GeneratedCharacter {
    id: string;
    name: string;
    archetype: Archetype;
    title: string;
    portraitUrl: string;
    maxHp: number;
    maxEnergy: number;
    startingGold: number;
    traits: string[];
}

export interface GeneratedCard {
    id: string;
    name: string;
    type: CardType;
    cost: number;
    description: string;
    target: TargetType;
    effects: Effect[];
    imageId?: string;
    imageUrl?: string;
    exhausts?: boolean;
    isHeroCard?: boolean;
}

export interface GenerateCharacterResponse {
    character: GeneratedCharacter;
    cards: GeneratedCard[];
}
