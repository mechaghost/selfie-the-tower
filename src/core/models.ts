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
    imageId?: string;
    exhausts?: boolean;
    ethereal?: boolean;
    upgraded?: boolean;
}

export interface StatusEffect {
    id: string; // e.g., 'vulnerable', 'weak', 'strength'
    name: string;
    amount: number;
    justApplied?: boolean; // Sometimes statuses lose stacks at turn end, this helps prevent immediate decay
}

export type IntentType = 'Attack' | 'Defend' | 'Buff' | 'Debuff' | 'AttackDefend' | 'AttackDebuff' | 'Unknown';

export interface EnemyIntent {
    type: IntentType;
    damage?: number;
    hits?: number; // For multi-attacks
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
}

export interface Enemy extends Entity {
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
    | 'END_TURN'
    | 'START_TURN';

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
