import { create } from 'zustand';
import { Card, Enemy, Player, GameAction, FloatingText, ActiveAnimation, AnimationType, ScreenShake, Effect, StatusEffect, UgcPhase, GeneratedCharacter, GeneratedCard, GenerateCharacterResponse } from '../core/models';
import { RNG } from '../core/rng';
import { createCardInstance, upgradeCard, CARD_DATABASE } from '../data/cards';
import { STATUS_REGISTRY } from '../data/statusEffects';
import { ENCOUNTER_POOLS } from '../data/encounters';
import { createEnemyInstance, enemies, ELITE_TEMPLATE_IDS, BOSS_TEMPLATE_IDS } from '../data/enemies';
import { CHARACTERS } from '../data/characters';
import { EVENTS, GameEvent } from '../data/events';


export interface DragState {
    isActive: boolean;
    cardId: string | null;
    targetType: string | null;
    isTouch: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    prevX: number;
    prevY: number;
}

export interface PlayingCard {
    card: Card;
    id: string; // Unique animation instance ID
    targetId?: string;
    isExhausting: boolean;
}

interface GameState {
    // --- Metagame / Run State ---
    seed: string;
    rng: RNG | null;
    floor: number;
    currentNodeId: string | null;
    isBossFloor: boolean;
    isRunComplete: boolean;

    // --- Combat State ---
    inCombat: boolean;
    isGameOver: boolean;
    isPlayerTurn: boolean;
    combatResult: null | 'victory' | 'defeat';
    goldReward: number;
    cardRewards: Card[];
    player: Player;
    enemies: Enemy[];

    masterDeck: Card[];
    drawPile: Card[];
    hand: Card[];
    discardPile: Card[];
    exhaustPile: Card[];
    playingCards: PlayingCard[];

    // --- Action Queue ---
    actionQueue: GameAction[];
    isResolving: boolean;
    floatingTexts: FloatingText[];
    activeAnimations: ActiveAnimation[];
    screenShake: ScreenShake | null;

    // --- Drag & Drop UI ---
    dragState: DragState;
    entityBounds: Record<string, DOMRect>;

    // --- Node Event State ---
    nodeEvent: 'rest' | 'shop' | 'mystery' | null;
    shopCards: Card[];
    shopPrices: Record<string, number>;
    cardRemovalCost: number;
    cardRemovalsUsed: number;
    currentEvent: GameEvent | null;
    eventOutcome: string | null;

    // --- UGC State ---
    ugcPhase: UgcPhase;
    generatedCharacter: GeneratedCharacter | null;
    generatedCards: GeneratedCard[] | null;
    ugcError: string | null;
    selfieDataUrl: string | null;

    // --- Store Methods ---
    initializeRun: (seed: string) => void;
    startCombat: (enemies: Enemy[]) => void;
    advanceFloor: (node: import('../core/mapModels').MapNode) => void;
    continueCombatResult: () => void;
    claimCardReward: (cardInstanceId: string) => void;
    restHeal: () => void;
    restUpgrade: (cardInstanceId: string) => void;
    enterShop: () => void;
    buyCard: (cardInstanceId: string, cost: number) => void;
    removeCard: (cardInstanceId: string) => void;
    enterMystery: () => void;
    chooseEventOption: (choiceId: string) => void;
    dismissNodeEvent: () => void;
    startSelfieCapture: () => void;
    submitSelfie: (imageBase64: string) => Promise<void>;
    startGeneratedRun: () => void;
    cancelUgc: () => void;
    abandonRun: () => void;

    // Queue Methods
    queueAction: (action: GameAction) => void;
    resolveQueue: () => void;

    // Atomic State Mutators (called by the action resolver)
    drawCards: (amount: number) => void;
    playCard: (cardInstanceId: string, targetId?: string) => void;
    cleanupPlayingCard: (animId: string) => void;
    endTurn: () => void;

    addFloatingText: (text: Omit<FloatingText, 'id'>) => void;
    playAnimation: (targetId: string, type: AnimationType) => void;
    triggerShake: (intensity: ScreenShake['intensity']) => void;
    setDragState: (state: Partial<DragState>) => void;
    resetDragState: () => void;
    setEntityBounds: (id: string, bounds: DOMRect) => void;
}

// Track pending timeouts so we can cancel them on combat end / run reset
const pendingTimeouts = new Set<ReturnType<typeof setTimeout>>();
function trackedTimeout(fn: () => void, ms: number) {
    const id = setTimeout(() => {
        pendingTimeouts.delete(id);
        fn();
    }, ms);
    pendingTimeouts.add(id);
    return id;
}
function cancelAllTimeouts() {
    pendingTimeouts.forEach(id => clearTimeout(id));
    pendingTimeouts.clear();
}

// Fix #2: resolveEffects now accepts RNG for deterministic RandomEnemy targeting
export function resolveEffects(
    effects: Effect[],
    sourceId: string,
    primaryTargetId?: string,
    allEnemyIds: string[] = [],
    rng?: RNG | null
): GameAction[] {
    const actions: GameAction[] = [];

    effects.forEach(effect => {
        let targets: string[] = [];

        switch (effect.target) {
            case 'Self':
                targets = [sourceId];
                break;
            case 'Target':
                if (primaryTargetId) targets = [primaryTargetId];
                break;
            case 'AllEnemies':
                targets = allEnemyIds;
                break;
            case 'RandomEnemy':
                if (allEnemyIds.length > 0) {
                    const randIdx = rng
                        ? rng.nextInt(0, allEnemyIds.length)
                        : Math.floor(Math.random() * allEnemyIds.length);
                    targets = [allEnemyIds[randIdx]];
                }
                break;
        }

        // Batch AllEnemies damage so hits land simultaneously
        if (effect.type === 'Damage' && effect.amount != null && effect.target === 'AllEnemies' && targets.length > 1) {
            if (sourceId) {
                actions.push({ type: 'PLAY_ANIMATION', payload: { targetId: sourceId, animation: 'lunge' } });
                actions.push({ type: 'DELAY', payload: { ms: 250 } });
            }
            targets.forEach(targetId => {
                actions.push({ type: 'DAMAGE_ENTITY', payload: { sourceId, targetId, amount: effect.amount! } });
                actions.push({ type: 'PLAY_ANIMATION', payload: { targetId, animation: 'stagger' } });
            });
            actions.push({ type: 'DELAY', payload: { ms: 320 } });
            return;
        }

        targets.forEach(targetId => {
            // H-3: Use != null checks instead of truthiness so amount: 0 works
            if (effect.type === 'Damage' && effect.amount != null) {
                if (sourceId) {
                    actions.push({ type: 'PLAY_ANIMATION', payload: { targetId: sourceId, animation: 'lunge' } });
                    actions.push({ type: 'DELAY', payload: { ms: 250 } });
                }
                actions.push({ type: 'DAMAGE_ENTITY', payload: { sourceId, targetId, amount: effect.amount } });
                actions.push({ type: 'PLAY_ANIMATION', payload: { targetId, animation: 'stagger' } });
                actions.push({ type: 'DELAY', payload: { ms: 320 } });
            } else if (effect.type === 'Block' && effect.amount != null) {
                actions.push({ type: 'GAIN_BLOCK', payload: { sourceId, targetId, amount: effect.amount } });
            } else if (effect.type === 'ApplyStatus' && effect.amount != null && effect.statusId) {
                actions.push({
                    type: 'APPLY_STATUS', payload: {
                        sourceId, targetId, status: { id: effect.statusId, name: effect.statusId, amount: effect.amount, justApplied: true }
                    }
                });
            } else if (effect.type === 'Heal' && effect.amount != null) {
                actions.push({ type: 'HEAL_ENTITY', payload: { targetId, amount: effect.amount } });
            } else if (effect.type === 'Draw' && effect.amount != null) {
                actions.push({ type: 'DRAW_CARD', payload: { amount: effect.amount } });
            } else if (effect.type === 'Discard' && effect.amount != null) {
                actions.push({ type: 'DISCARD_HAND', payload: { amount: effect.amount } });
            } else if (effect.type === 'Exhaust') {
                // Exhaust is handled at the card level via card.exhausts flag
            }
        });
    });

    return actions;
}

// Basic starters never show up as loot — rewards should feel like an upgrade
const REWARD_EXCLUDED_IDS = new Set(['neon_jab', 'dodge_roll']);

// Shared by every kill path (attacks, burn ticks, thorns retaliation).
// Reward tiers: normal fights pay 10-20 gold, elites 50-80, bosses 90-130.
// Elite and boss loot comes pre-upgraded (+).
function buildVictoryState(state: GameState): Partial<GameState> {
    const rng = state.rng;
    const hasBoss = state.enemies.some(e => BOSS_TEMPLATE_IDS.has(e.templateId));
    const hasElite = state.enemies.some(e => ELITE_TEMPLATE_IDS.has(e.templateId));
    const goldReward = hasBoss
        ? (rng ? rng.nextInt(90, 131) : 110)
        : hasElite
            ? (rng ? rng.nextInt(50, 81) : 65)
            : (rng ? rng.nextInt(10, 21) : 15);

    const pool = Object.keys(CARD_DATABASE).filter(id => !REWARD_EXCLUDED_IDS.has(id));
    const shuffledPool = rng ? rng.shuffle(pool) : pool;
    let cardRewards = shuffledPool.slice(0, 3).map(id => createCardInstance(id, rng ?? undefined));
    if (hasBoss || hasElite) {
        cardRewards = cardRewards.map(upgradeCard);
    }

    return {
        combatResult: 'victory',
        goldReward,
        cardRewards,
        actionQueue: [],
        isResolving: false
    };
}

const defaultDragState: DragState = {
    isActive: false,
    cardId: null,
    targetType: null,
    isTouch: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    prevX: 0,
    prevY: 0
};

// --- Run Persistence (localStorage) ---
const SAVE_KEY = 'stt_run';

const PERSISTED_KEYS = [
    'seed', 'floor', 'currentNodeId', 'isBossFloor', 'isRunComplete',
    'player', 'masterDeck', 'drawPile', 'hand', 'discardPile', 'exhaustPile',
    'inCombat', 'enemies', 'isPlayerTurn', 'isGameOver',
    'combatResult', 'goldReward', 'cardRewards',
    'generatedCharacter', 'generatedCards',
    'nodeEvent', 'shopCards', 'shopPrices', 'cardRemovalCost', 'cardRemovalsUsed',
] as const;

function saveRun(state: GameState) {
    if (!state.seed || state.isGameOver || state.isResolving) return;
    try {
        const data: Record<string, unknown> = {};
        for (const key of PERSISTED_KEYS) {
            data[key] = state[key];
        }
        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch { /* localStorage full or unavailable */ }
}

function loadRun(): Partial<GameState> | null {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (!data.seed) return null;
        // Reconstruct RNG from seed (position won't match, but that's fine)
        data.rng = new RNG(data.seed);
        return data;
    } catch {
        return null;
    }
}

function clearRun() {
    try { localStorage.removeItem(SAVE_KEY); } catch { /* noop */ }
}

const savedRun = loadRun();

export const useGameStore = create<GameState>((set, get) => ({
    seed: '',
    rng: null,
    floor: 0,
    currentNodeId: null,
    isBossFloor: false,
    isRunComplete: false,

    isGameOver: false,
    inCombat: false,
    isPlayerTurn: false,
    combatResult: null,
    goldReward: 0,
    cardRewards: [],
    player: {
        id: 'player',
        name: '',
        hp: 0,
        maxHp: 0,
        block: 0,
        statuses: [],
        energy: 0,
        maxEnergy: 0,
        gold: 0
    },
    enemies: [],

    masterDeck: [],
    drawPile: [],
    hand: [],
    discardPile: [],
    exhaustPile: [],
    playingCards: [],

    actionQueue: [],
    isResolving: false,
    floatingTexts: [],
    activeAnimations: [],
    screenShake: null,

    dragState: { ...defaultDragState },
    entityBounds: {},

    nodeEvent: null,
    shopCards: [],
    shopPrices: {},
    cardRemovalCost: 75,
    cardRemovalsUsed: 0,
    currentEvent: null,
    eventOutcome: null,

    ugcPhase: null,
    generatedCharacter: null,
    generatedCards: null,
    ugcError: null,
    selfieDataUrl: null,

    // Restore saved run if one exists
    ...savedRun,

    // H-1: Removed undeclared characterId param; M-9: Reset ALL state fields
    initializeRun: (seed: string) => {
        cancelAllTimeouts();
        const rng = new RNG(seed);
        const charDef = CHARACTERS['street_runner'];
        const initialDeck = charDef.startingDeck.map(cardId => createCardInstance(cardId, rng));

        set({
            seed,
            rng,
            floor: 0,
            currentNodeId: null,
            isBossFloor: false,
            isRunComplete: false,
            player: {
                id: 'player',
                name: charDef.name,
                hp: charDef.maxHp,
                maxHp: charDef.maxHp,
                block: 0,
                statuses: [],
                energy: charDef.maxEnergy,
                maxEnergy: charDef.maxEnergy,
                gold: charDef.startingGold
            },
            masterDeck: initialDeck,
            inCombat: false,
            isGameOver: false,
            isPlayerTurn: false,
            combatResult: null,
            goldReward: 0,
            cardRewards: [],
            nodeEvent: null,
            shopCards: [],
            shopPrices: {},
            cardRemovalCost: 75,
            cardRemovalsUsed: 0,
            currentEvent: null,
            eventOutcome: null,
            // M-9: Reset all combat state
            actionQueue: [],
            isResolving: false,
            hand: [],
            drawPile: [],
            discardPile: [],
            exhaustPile: [],
            playingCards: [],
            enemies: [],
            floatingTexts: [],
            activeAnimations: [],
            screenShake: null,
            entityBounds: {},
            dragState: { ...defaultDragState }
        });
    },

    startCombat: (combatEnemies: Enemy[]) => {
        set((state) => {
            if (!state.rng) return state;

            const freshPlayer = {
                ...state.player,
                energy: state.player.maxEnergy,
                block: 0,
                statuses: []
            };

            const shuffledDraw = state.rng.shuffle([...state.masterDeck]);
            return {
                inCombat: true,
                combatResult: null,
                goldReward: 0,
                cardRewards: [],
                enemies: combatEnemies,
                drawPile: shuffledDraw,
                discardPile: [],
                exhaustPile: [],
                playingCards: [],
                hand: [],
                player: freshPlayer,
                // Intents first so enemies telegraph from turn 1 —
                // CALCULATE_INTENTS chains into START_TURN itself
                actionQueue: [{ type: 'CALCULATE_INTENTS' }]
            };
        });

        get().resolveQueue();
    },

    // Fix #5: Restructured to avoid nested set() race condition
    // Fix #6: Added handling for Rest/Shop/Unknown nodes
    advanceFloor: (node) => {
        const state = get();

        // Update floor and current node first
        set({
            floor: state.floor + 1,
            currentNodeId: node.id,
            isBossFloor: node.type === 'Boss'
        });

        if (['Combat', 'Elite', 'Boss'].includes(node.type)) {
            let enemiesData: Enemy[] = [];

            if (node.encounterId) {
                let encounterDef = undefined;
                for (const pool of Object.values(ENCOUNTER_POOLS)) {
                    const found = pool.find(e => e.id === node.encounterId);
                    if (found) {
                        encounterDef = found;
                        break;
                    }
                }

                if (encounterDef) {
                    enemiesData = encounterDef.enemyIds.slice(0, 3).map((enemyTemplate, idx) =>
                        createEnemyInstance(enemyTemplate, `enemy_${node.id}_${idx}`, state.rng)
                    );
                }
            }

            if (enemiesData.length === 0) {
                enemiesData = [createEnemyInstance('jaw_worm', `enemy_${node.id}_0`, state.rng)];
            }

            get().startCombat(enemiesData);
        } else if (node.type === 'Rest') {
            set({ nodeEvent: 'rest' });
        } else if (node.type === 'Shop') {
            get().enterShop();
        } else if (node.type === 'Unknown') {
            get().enterMystery();
        }
    },

    startSelfieCapture: () => {
        set({ ugcPhase: 'capture', ugcError: null });
    },

    submitSelfie: async (imageBase64: string) => {
        set({ ugcPhase: 'generating', selfieDataUrl: imageBase64, ugcError: null });
        try {
            const apiUrl = (import.meta.env.VITE_API_URL || '') + '/api/generate-character';
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageBase64 }),
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                throw new Error(errData?.error || `Server error: ${response.status}`);
            }
            const data: GenerateCharacterResponse = await response.json();

            // Append colorless starter cards to the generated deck for reveal
            const colorlessStarters = ['finesse', 'shiv_toss']
                .map(id => CARD_DATABASE[id])
                .filter(Boolean)
                .map(c => ({
                    id: c.id,
                    name: c.name,
                    type: c.type,
                    cost: c.cost,
                    description: c.description,
                    target: c.target,
                    effects: c.effects,
                    imageId: c.imageId,
                    exhausts: c.exhausts,
                }));

            set({
                ugcPhase: 'reveal',
                generatedCharacter: data.character,
                generatedCards: [...data.cards, ...colorlessStarters],
            });
        } catch (err: any) {
            set({ ugcPhase: 'capture', ugcError: err.message || 'Generation failed' });
        }
    },

    startGeneratedRun: () => {
        const { generatedCharacter, generatedCards } = get();
        if (!generatedCharacter || !generatedCards) return;

        cancelAllTimeouts();
        const seed = `ugc_${generatedCharacter.id}_${Date.now()}`;
        const rng = new RNG(seed);

        const masterDeck: Card[] = generatedCards.map(gc => ({
            id: gc.id,
            instanceId: `${gc.id}_${Math.floor(rng.next() * 2176782336).toString(36)}`,
            name: gc.name,
            type: gc.type,
            cost: gc.cost,
            description: gc.description,
            target: gc.target,
            effects: gc.effects,
            imageId: gc.imageId,
            imageUrl: gc.imageUrl,
            exhausts: gc.exhausts,
            isHeroCard: gc.isHeroCard,
        }));

        set({
            seed,
            rng,
            floor: 0,
            currentNodeId: null,
            isBossFloor: false,
            isRunComplete: false,
            player: {
                id: 'player',
                name: generatedCharacter.name,
                hp: generatedCharacter.maxHp,
                maxHp: generatedCharacter.maxHp,
                block: 0,
                statuses: [],
                energy: generatedCharacter.maxEnergy,
                maxEnergy: generatedCharacter.maxEnergy,
                gold: generatedCharacter.startingGold,
                portraitUrl: generatedCharacter.portraitUrl || undefined,
                spriteUrl: generatedCharacter.portraitUrl || undefined,
            },
            masterDeck,
            ugcPhase: null,
            generatedCharacter: null,
            generatedCards: null,
            selfieDataUrl: null,
            inCombat: false,
            isGameOver: false,
            isPlayerTurn: false,
            combatResult: null,
            goldReward: 0,
            cardRewards: [],
            actionQueue: [],
            isResolving: false,
            hand: [],
            drawPile: [],
            discardPile: [],
            exhaustPile: [],
            playingCards: [],
            enemies: [],
            floatingTexts: [],
            activeAnimations: [],
            screenShake: null,
            entityBounds: {},
            dragState: { ...defaultDragState },
            nodeEvent: null,
            shopCards: [],
            shopPrices: {},
            cardRemovalCost: 75,
            cardRemovalsUsed: 0,
            currentEvent: null,
            eventOutcome: null,
        });
    },

    cancelUgc: () => {
        set({
            ugcPhase: null,
            generatedCharacter: null,
            generatedCards: null,
            ugcError: null,
            selfieDataUrl: null,
        });
    },

    restHeal: () => {
        set((current) => ({
            player: {
                ...current.player,
                hp: Math.min(current.player.maxHp, current.player.hp + Math.floor(current.player.maxHp * 0.3))
            },
            nodeEvent: null
        }));
    },

    restUpgrade: (cardInstanceId: string) => {
        set((current) => {
            const newDeck = current.masterDeck.map(card =>
                card.instanceId === cardInstanceId ? upgradeCard(card) : card
            );
            return { masterDeck: newDeck, nodeEvent: null };
        });
    },

    enterShop: () => {
        const state = get();
        const rng = state.rng;
        if (!rng) return;

        const allCardIds = Object.keys(CARD_DATABASE);
        const shuffled = rng.shuffle(allCardIds);
        const selectedIds = shuffled.slice(0, 3);

        const shopCards: Card[] = [];
        const shopPrices: Record<string, number> = {};

        selectedIds.forEach(cardId => {
            const card = createCardInstance(cardId, rng);
            shopCards.push(card);

            const cardType = CARD_DATABASE[cardId].type;
            let price: number;
            if (cardType === 'Attack') {
                price = rng.nextInt(50, 101);
            } else if (cardType === 'Skill') {
                price = rng.nextInt(50, 81);
            } else {
                price = rng.nextInt(60, 101);
            }
            shopPrices[card.instanceId] = price;
        });

        set({
            nodeEvent: 'shop',
            shopCards,
            shopPrices,
            cardRemovalCost: 75 + (state.cardRemovalsUsed * 25),
        });
    },

    buyCard: (cardInstanceId: string, cost: number) => {
        set((state) => {
            if (state.player.gold < cost) return state;
            const card = state.shopCards.find(c => c.instanceId === cardInstanceId);
            if (!card) return state;

            return {
                player: { ...state.player, gold: state.player.gold - cost },
                masterDeck: [...state.masterDeck, card],
                shopCards: state.shopCards.filter(c => c.instanceId !== cardInstanceId),
            };
        });
    },

    removeCard: (cardInstanceId: string) => {
        set((state) => {
            if (state.player.gold < state.cardRemovalCost) return state;
            const card = state.masterDeck.find(c => c.instanceId === cardInstanceId);
            if (!card) return state;

            return {
                player: { ...state.player, gold: state.player.gold - state.cardRemovalCost },
                masterDeck: state.masterDeck.filter(c => c.instanceId !== cardInstanceId),
                cardRemovalsUsed: state.cardRemovalsUsed + 1,
                cardRemovalCost: state.cardRemovalCost + 25,
            };
        });
    },

    enterMystery: () => {
        const state = get();
        if (!state.rng) return;
        const eventIndex = state.rng.nextInt(0, EVENTS.length);
        const event = EVENTS[eventIndex];
        set({
            nodeEvent: 'mystery',
            currentEvent: event,
            eventOutcome: null,
        });
    },

    chooseEventOption: (choiceId: string) => {
        const state = get();
        if (!state.currentEvent) return;

        const choice = state.currentEvent.choices.find(c => c.id === choiceId);
        if (!choice) return;

        let player = { ...state.player };
        let masterDeck = [...state.masterDeck];
        const rng = state.rng;
        const outcomeLines: string[] = [];

        for (const effect of choice.effects) {
            switch (effect.type) {
                case 'heal': {
                    const amount = effect.amount || 0;
                    const healed = Math.min(amount, player.maxHp - player.hp);
                    player.hp = Math.min(player.maxHp, player.hp + amount);
                    if (healed > 0) outcomeLines.push(`Healed ${healed} HP.`);
                    break;
                }
                case 'healFull': {
                    const healed = player.maxHp - player.hp;
                    player.hp = player.maxHp;
                    if (healed > 0) outcomeLines.push(`Fully healed! Restored ${healed} HP.`);
                    else outcomeLines.push('Already at full health.');
                    break;
                }
                case 'healPercent': {
                    const amount = Math.floor(player.maxHp * (effect.amount || 0) / 100);
                    const healed = Math.min(amount, player.maxHp - player.hp);
                    player.hp = Math.min(player.maxHp, player.hp + amount);
                    if (healed > 0) outcomeLines.push(`Healed ${healed} HP.`);
                    break;
                }
                case 'damage': {
                    const amount = effect.amount || 0;
                    player.hp = Math.max(1, player.hp - amount);
                    outcomeLines.push(`Took ${amount} damage.`);
                    break;
                }
                case 'gold': {
                    const amount = effect.amount || 0;
                    player.gold = Math.max(0, player.gold + amount);
                    if (amount > 0) outcomeLines.push(`Gained ${amount} gold.`);
                    else if (amount < 0) outcomeLines.push(`Spent ${Math.abs(amount)} gold.`);
                    break;
                }
                case 'loseMaxHp': {
                    const amount = effect.amount || 0;
                    player.maxHp = Math.max(1, player.maxHp - amount);
                    if (player.hp > player.maxHp) player.hp = player.maxHp;
                    outcomeLines.push(`Lost ${amount} max HP.`);
                    break;
                }
                case 'removeRandomCard': {
                    const removable = masterDeck.filter(c => !c.isHeroCard);
                    if (removable.length > 0 && rng) {
                        const idx = rng.nextInt(0, removable.length);
                        const removed = removable[idx];
                        masterDeck = masterDeck.filter(c => c.instanceId !== removed.instanceId);
                        outcomeLines.push(`Removed "${removed.name}" from your deck.`);
                    } else {
                        outcomeLines.push('No removable cards in your deck.');
                    }
                    break;
                }
                case 'addRandomCard': {
                    if (rng) {
                        const cardKeys = Object.keys(CARD_DATABASE);
                        const randomKey = cardKeys[rng.nextInt(0, cardKeys.length)];
                        const newCard = createCardInstance(randomKey, rng);
                        masterDeck.push(newCard);
                        outcomeLines.push(`Added "${newCard.name}" to your deck.`);
                    }
                    break;
                }
                case 'nothing': {
                    outcomeLines.push('You move on.');
                    break;
                }
            }
        }

        set({
            player,
            masterDeck,
            eventOutcome: outcomeLines.join(' '),
        });
    },

    dismissNodeEvent: () => {
        set({
            nodeEvent: null,
            shopCards: [],
            shopPrices: {},
            currentEvent: null,
            eventOutcome: null,
        });
    },

    abandonRun: () => {
        cancelAllTimeouts();
        clearRun();
        set({
            seed: '',
            rng: null,
            floor: 0,
            currentNodeId: null,
            isBossFloor: false,
            isRunComplete: false,
            inCombat: false,
            isGameOver: false,
            isPlayerTurn: false,
            combatResult: null,
            goldReward: 0,
            cardRewards: [],
            player: { id: 'player', name: '', hp: 0, maxHp: 0, block: 0, statuses: [], energy: 0, maxEnergy: 0, gold: 0 },
            enemies: [],
            masterDeck: [],
            drawPile: [],
            hand: [],
            discardPile: [],
            exhaustPile: [],
            playingCards: [],
            actionQueue: [],
            isResolving: false,
            floatingTexts: [],
            activeAnimations: [],
            screenShake: null,
            dragState: { ...defaultDragState },
            entityBounds: {},
            nodeEvent: null,
            shopCards: [],
            shopPrices: {},
            cardRemovalCost: 75,
            cardRemovalsUsed: 0,
            currentEvent: null,
            eventOutcome: null,
            ugcPhase: null,
            generatedCharacter: null,
            generatedCards: null,
            ugcError: null,
            selfieDataUrl: null,
        });
    },

    // Victory: leave without taking a card (rewards are optional). Defeat: game over.
    // Winning the boss floor completes the run.
    continueCombatResult: () => {
        const state = get();
        if (state.combatResult === 'victory') {
            set({
                inCombat: false,
                combatResult: null,
                enemies: [],
                player: { ...state.player, gold: state.player.gold + state.goldReward },
                goldReward: 0,
                cardRewards: [],
                isRunComplete: state.isBossFloor
            });
        } else if (state.combatResult === 'defeat') {
            clearRun();
            set({
                inCombat: false,
                combatResult: null,
                isGameOver: true
            });
        }
    },

    claimCardReward: (cardInstanceId: string) => {
        const state = get();
        if (state.combatResult !== 'victory') return;
        const card = state.cardRewards.find(c => c.instanceId === cardInstanceId);
        if (!card) return;
        set({
            inCombat: false,
            combatResult: null,
            enemies: [],
            masterDeck: [...state.masterDeck, card],
            player: { ...state.player, gold: state.player.gold + state.goldReward },
            goldReward: 0,
            cardRewards: [],
            isRunComplete: state.isBossFloor
        });
    },

    addFloatingText: (text) => {
        const id = Math.random().toString(36).substr(2, 9);
        set(state => ({
            floatingTexts: [...state.floatingTexts, { ...text, id }]
        }));
        trackedTimeout(() => {
            set(state => ({
                floatingTexts: state.floatingTexts.filter(ft => ft.id !== id)
            }));
        }, 1200);
    },

    playAnimation: (targetId, type) => {
        const id = Math.random().toString(36).substr(2, 9);
        set(state => ({
            activeAnimations: [...state.activeAnimations, { id, targetId, type }]
        }));
        trackedTimeout(() => {
            set(state => ({
                activeAnimations: state.activeAnimations.filter(a => a.id !== id)
            }));
        }, 500);
    },

    triggerShake: (intensity) => {
        const id = Math.random().toString(36).substr(2, 9);
        set({ screenShake: { id, intensity } });
        trackedTimeout(() => {
            set(state => state.screenShake?.id === id ? { screenShake: null } : {});
        }, 500);
    },

    queueAction: (action: GameAction) => {
        set((state) => ({
            actionQueue: [...state.actionQueue, action],
        }));
    },

    // C-1: Serialized queue processor — single entry point, no concurrent execution
    resolveQueue: () => {
        const state = get();
        if (state.actionQueue.length === 0 || state.isResolving) return;

        set({ isResolving: true });
        const action = state.actionQueue[0];
        let delay = 0;

        switch (action.type) {
            case 'DAMAGE_ENTITY': {
                const { sourceId, targetId, amount } = action.payload;
                const freshState = get();
                const isPlayer = targetId === 'player';

                // C-3: Skip damage to dead enemies
                if (!isPlayer) {
                    const targetEnemy = freshState.enemies.find(e => e.id === targetId);
                    if (!targetEnemy || targetEnemy.hp <= 0) break;
                }

                // Dead men throw no punches: an enemy killed mid-phase (burn,
                // thorns) still has its queued attacks — drop them
                if (sourceId && sourceId !== 'player') {
                    const sourceEnemy = freshState.enemies.find(e => e.id === sourceId);
                    if (!sourceEnemy || sourceEnemy.hp <= 0) break;
                }

                let target = isPlayer ? freshState.player : freshState.enemies.find(e => e.id === targetId);
                let source = sourceId === 'player' ? freshState.player : freshState.enemies.find(e => e.id === sourceId);

                if (target) {
                    let finalDamage = amount;

                    // Modifier 1: Source flat damage (Strength)
                    if (source) {
                        let flatMod = 0;
                        source.statuses.forEach(s => {
                            const def = STATUS_REGISTRY[s.id];
                            if (def?.flatDamageGivenPerStack && s.amount > 0) flatMod += def.flatDamageGivenPerStack * s.amount;
                        });
                        finalDamage += flatMod;
                    }

                    // Modifier 2: Source multiplicative (Weak)
                    if (source) {
                        source.statuses.forEach(s => {
                            const def = STATUS_REGISTRY[s.id];
                            if (def?.damageGivenMultiplier && s.amount > 0) finalDamage = Math.floor(finalDamage * def.damageGivenMultiplier);
                        });
                    }

                    // Modifier 3: Target multiplicative (Vulnerable)
                    target.statuses.forEach(s => {
                        const def = STATUS_REGISTRY[s.id];
                        if (def?.damageTakenMultiplier && s.amount > 0) finalDamage = Math.floor(finalDamage * def.damageTakenMultiplier);
                    });

                    finalDamage = Math.max(0, finalDamage);

                    let newBlock = target.block - finalDamage;
                    let newHp = target.hp;
                    if (newBlock < 0) {
                        newHp = Math.max(0, target.hp + newBlock);
                        newBlock = 0;
                    }

                    const hpLost = target.hp - newHp;
                    const fullyBlocked = finalDamage > 0 && hpLost === 0;
                    // Spikes retaliation is snapshotted before state writes
                    const thornsStacks = target.statuses.find(s => s.id === 'thorns')?.amount ?? 0;

                    if (fullyBlocked) {
                        get().addFloatingText({ targetId, value: 'BLOCKED', type: 'blocked' });
                    } else {
                        get().addFloatingText({ targetId, value: finalDamage, type: 'damage' });
                    }
                    if (hpLost > 0) get().playAnimation(targetId, 'hit');

                    if (isPlayer) {
                        // H-4: Re-fetch current player state before set
                        const currentPlayer = get().player;
                        set({ player: { ...currentPlayer, hp: newHp, block: newBlock } });
                        if (hpLost > 0) get().triggerShake(hpLost >= 10 ? 'heavy' : 'light');

                        if (newHp <= 0) {
                            cancelAllTimeouts();
                            set({
                                combatResult: 'defeat',
                                actionQueue: [],
                                isResolving: false
                            });
                            return;
                        }
                    } else {
                        const currentEnemies = get().enemies;
                        const updatedEnemies = currentEnemies.map(e => e.id === targetId ? { ...e, hp: newHp, block: newBlock } : e);
                        set({ enemies: updatedEnemies });

                        if (updatedEnemies.every(e => e.hp <= 0)) {
                            cancelAllTimeouts();
                            set(buildVictoryState(get()));
                            return;
                        }
                    }

                    // Spikes: the attacker takes stack damage back (blockable,
                    // unmodified). Skipped if the blow already won the fight.
                    if (thornsStacks > 0 && source && sourceId && sourceId !== targetId) {
                        const isSourcePlayer = sourceId === 'player';
                        const liveSource = isSourcePlayer ? get().player : get().enemies.find(e => e.id === sourceId);
                        if (liveSource && liveSource.hp > 0) {
                            let retBlock = liveSource.block - thornsStacks;
                            let retHp = liveSource.hp;
                            if (retBlock < 0) {
                                retHp = Math.max(0, liveSource.hp + retBlock);
                                retBlock = 0;
                            }
                            const retHpLost = liveSource.hp - retHp;

                            get().addFloatingText({ targetId: sourceId, value: thornsStacks, type: 'damage' });
                            if (retHpLost > 0) get().playAnimation(sourceId, 'hit');

                            if (isSourcePlayer) {
                                set({ player: { ...get().player, hp: retHp, block: retBlock } });
                                if (retHpLost > 0) get().triggerShake('light');
                                if (retHp <= 0) {
                                    cancelAllTimeouts();
                                    set({
                                        combatResult: 'defeat',
                                        actionQueue: [],
                                        isResolving: false
                                    });
                                    return;
                                }
                            } else {
                                const afterRet = get().enemies.map(e => e.id === sourceId ? { ...e, hp: retHp, block: retBlock } : e);
                                set({ enemies: afterRet });
                                if (afterRet.every(e => e.hp <= 0)) {
                                    cancelAllTimeouts();
                                    set(buildVictoryState(get()));
                                    return;
                                }
                            }
                        }
                    }
                }
                break;
            }
            // Fix #11: GAIN_BLOCK dexterity reads from target (the blocker), not source
            case 'GAIN_BLOCK': {
                const { targetId, amount } = action.payload;
                const freshState = get();
                let target = targetId === 'player' ? freshState.player : freshState.enemies.find(e => e.id === targetId);

                let finalBlock = amount;
                if (target) {
                    let flatMod = 0;
                    target.statuses.forEach(s => {
                        const def = STATUS_REGISTRY[s.id];
                        if (def?.flatBlockGivenPerStack && s.amount > 0) flatMod += def.flatBlockGivenPerStack * s.amount;
                    });
                    finalBlock += flatMod;
                }
                finalBlock = Math.max(0, finalBlock);

                get().addFloatingText({ targetId, value: finalBlock, type: 'block' });
                if (targetId === 'player') {
                    const currentPlayer = get().player;
                    set({ player: { ...currentPlayer, block: currentPlayer.block + finalBlock } });
                } else {
                    const currentEnemies = get().enemies;
                    set({ enemies: currentEnemies.map(e => e.id === targetId ? { ...e, block: e.block + finalBlock } : e) });
                }
                break;
            }
            case 'PLAY_CARD': {
                const { card, targetId } = action.payload;
                const freshState = get();
                // C-3: Only target living enemies
                const allEnemyIds = freshState.enemies.filter(e => e.hp > 0).map(e => e.id);
                const cardActions = resolveEffects(card.effects || [], 'player', targetId, allEnemyIds, freshState.rng);
                // C-1: Replace queue and continue synchronously via the tail call below
                set((current) => ({
                    actionQueue: [...cardActions, ...current.actionQueue.slice(1)],
                    isResolving: false
                }));
                // C-1: Use trackedTimeout for serialization
                trackedTimeout(() => get().resolveQueue(), 0);
                return;
            }
            case 'APPLY_STATUS': {
                const { targetId, status } = action.payload;
                const freshState = get();
                const isPlayer = targetId === 'player';
                let target = isPlayer ? freshState.player : freshState.enemies.find(e => e.id === targetId);
                if (target) {
                    const existingStatus = target.statuses.find(s => s.id === status.id);
                    let newStatuses = [...target.statuses];
                    if (existingStatus) {
                        newStatuses = newStatuses.map(s => s.id === status.id ? { ...s, amount: s.amount + status.amount } : s);
                    } else {
                        newStatuses.push(status);
                    }
                    if (isPlayer) {
                        set({ player: { ...get().player, statuses: newStatuses } });
                    } else {
                        set({ enemies: get().enemies.map(e => e.id === targetId ? { ...e, statuses: newStatuses } : e) });
                    }
                }
                break;
            }
            case 'HEAL_ENTITY': {
                const { targetId, amount } = action.payload;
                if (targetId === 'player') {
                    const currentPlayer = get().player;
                    const newHp = Math.min(currentPlayer.maxHp, currentPlayer.hp + amount);
                    get().addFloatingText({ targetId, value: amount, type: 'heal' });
                    set({ player: { ...currentPlayer, hp: newHp } });
                } else {
                    const currentEnemies = get().enemies;
                    const enemy = currentEnemies.find(e => e.id === targetId);
                    if (enemy) {
                        const newHp = Math.min(enemy.maxHp, enemy.hp + amount);
                        get().addFloatingText({ targetId, value: amount, type: 'heal' });
                        set({ enemies: currentEnemies.map(e => e.id === targetId ? { ...e, hp: newHp } : e) });
                    }
                }
                break;
            }
            // Burn sears, Regen knits — both tick at the start of the owner's
            // turn, then shed one stack (self-managed, not the decay pass)
            case 'STATUS_TICK': {
                const { targetId } = action.payload;
                const freshState = get();
                const isPlayer = targetId === 'player';
                const target = isPlayer ? freshState.player : freshState.enemies.find(e => e.id === targetId);
                if (!target || target.hp <= 0) break;

                const burnStacks = target.statuses.find(s => s.id === 'burn')?.amount ?? 0;
                const regenStacks = target.statuses.find(s => s.id === 'regen')?.amount ?? 0;
                if (burnStacks <= 0 && regenStacks <= 0) break;

                let newHp = target.hp;
                if (burnStacks > 0) {
                    // Burn ignores block — it's already under your skin
                    newHp = Math.max(0, newHp - burnStacks);
                    get().addFloatingText({ targetId, value: burnStacks, type: 'burn' });
                    get().playAnimation(targetId, 'burn-tick');
                }
                if (regenStacks > 0 && newHp > 0) {
                    newHp = Math.min(target.maxHp, newHp + regenStacks);
                    get().addFloatingText({ targetId, value: regenStacks, type: 'heal' });
                }

                const newStatuses = target.statuses
                    .map(s => (s.id === 'burn' || s.id === 'regen') ? { ...s, amount: s.amount - 1 } : s)
                    .filter(s => s.amount > 0);

                if (isPlayer) {
                    set({ player: { ...get().player, hp: newHp, statuses: newStatuses } });
                    if (burnStacks > 0) get().triggerShake('light');
                    if (newHp <= 0) {
                        cancelAllTimeouts();
                        set({
                            combatResult: 'defeat',
                            actionQueue: [],
                            isResolving: false
                        });
                        return;
                    }
                } else {
                    const updatedEnemies = get().enemies.map(e => e.id === targetId ? { ...e, hp: newHp, statuses: newStatuses } : e);
                    set({ enemies: updatedEnemies });
                    if (updatedEnemies.every(e => e.hp <= 0)) {
                        cancelAllTimeouts();
                        set(buildVictoryState(get()));
                        return;
                    }
                }

                delay = 350;
                break;
            }
            case 'DRAW_CARD': {
                const drawAmount = action.payload?.amount ?? 1;
                get().drawCards(drawAmount);
                break;
            }
            // H-5: Discard random cards from hand using RNG
            case 'DISCARD_HAND': {
                const discardAmount = action.payload?.amount;
                if (discardAmount != null && discardAmount > 0) {
                    set((current) => {
                        const rng = current.rng;
                        let handCopy = [...current.hand];
                        const toDiscard: Card[] = [];
                        const count = Math.min(discardAmount, handCopy.length);
                        for (let i = 0; i < count; i++) {
                            const idx = rng ? rng.nextInt(0, handCopy.length) : Math.floor(Math.random() * handCopy.length);
                            toDiscard.push(handCopy.splice(idx, 1)[0]);
                        }
                        return {
                            hand: handCopy,
                            discardPile: [...current.discardPile, ...toDiscard]
                        };
                    });
                }
                break;
            }
            case 'END_TURN': {
                const freshState = get();
                let enemyActions: GameAction[] = [];
                const allEnemyIds = freshState.enemies.filter(e => e.hp > 0).map(e => e.id);

                // M-6: Track turn phase
                set({ isPlayerTurn: false });

                // Burning/regenerating enemies tick before anyone swings
                freshState.enemies.forEach(enemy => {
                    if (enemy.hp <= 0) return;
                    if (enemy.statuses.some(s => (s.id === 'burn' || s.id === 'regen') && s.amount > 0)) {
                        enemyActions.push({ type: 'STATUS_TICK', payload: { targetId: enemy.id } });
                    }
                });

                // Fix #10: Only execute intents for living enemies
                freshState.enemies.forEach(enemy => {
                    if (enemy.hp <= 0) return;
                    if (enemy.intent && enemy.intent.effects) {
                        let attackName = 'Attacks!';
                        if (enemy.intent.type.includes('Defend')) attackName = 'Defends!';
                        if (enemy.intent.type.includes('Buff')) attackName = 'Buffs!';
                        if (enemy.intent.type === 'AttackDefend') attackName = 'Attacks & Defends!';

                        enemyActions.push({ type: 'ANNOUNCE_INTENT', payload: { targetId: enemy.id, text: attackName } });

                        const intentActions = resolveEffects(enemy.intent.effects, enemy.id, 'player', allEnemyIds, freshState.rng);
                        enemyActions = enemyActions.concat(intentActions);

                        enemyActions.push({ type: 'DELAY', payload: { ms: 400 } });
                    }
                });

                // Process status decay
                const decayStatuses = (statuses: StatusEffect[]) => {
                    return statuses.map(s => {
                        const def = STATUS_REGISTRY[s.id];
                        if (def?.decreasesPerTurn && s.amount > 0 && !s.justApplied) {
                            return { ...s, amount: s.amount - 1 };
                        }
                        if (s.justApplied) {
                            return { ...s, justApplied: false };
                        }
                        return s;
                    }).filter(s => s.amount > 0);
                };

                const newPlayerStatuses = decayStatuses(freshState.player.statuses);
                const newEnemies = freshState.enemies.map(enemy => ({
                    ...enemy,
                    statuses: decayStatuses(enemy.statuses)
                }));

                set((current) => ({
                    player: { ...current.player, statuses: newPlayerStatuses },
                    enemies: newEnemies
                }));

                enemyActions.push({ type: 'CALCULATE_INTENTS' });

                set((current) => ({
                    actionQueue: [...enemyActions, ...current.actionQueue.slice(1)],
                    isResolving: false
                }));
                trackedTimeout(() => get().resolveQueue(), 0);
                return;
            }
            // Fix #3: Use enemy.templateId instead of hardcoded name matching
            case 'CALCULATE_INTENTS': {
                const freshState = get();
                const updatedEnemies = freshState.enemies.map(enemy => {
                    if (enemy.hp <= 0) return enemy;

                    const aiDef = enemies[enemy.templateId];
                    let newIntent = null;

                    if (aiDef && aiDef.aiPatterns) {
                        let validPatterns = aiDef.aiPatterns.filter(p => {
                            if (p.condition === 'Turn1') return !enemy.intent;
                            if (p.condition === 'BelowHalfHP') return enemy.hp <= enemy.maxHp / 2;
                            return p.condition === 'Always' || !p.condition;
                        });

                        if (validPatterns.some(p => p.condition === 'Turn1')) {
                            validPatterns = validPatterns.filter(p => p.condition === 'Turn1');
                        } else if (validPatterns.some(p => p.condition === 'BelowHalfHP')) {
                            validPatterns = validPatterns.filter(p => p.condition === 'BelowHalfHP');
                        }

                        if (validPatterns.length > 0) {
                            const totalWeight = validPatterns.reduce((sum, p) => sum + p.chance, 0);
                            const roll = freshState.rng ? freshState.rng.next() * totalWeight : Math.random() * totalWeight;
                            let runningSum = 0;

                            // L-1: Use < instead of <= for correct weighted selection
                            for (const p of validPatterns) {
                                runningSum += p.chance;
                                if (roll < runningSum) {
                                    newIntent = p.intent;
                                    break;
                                }
                            }
                        }
                    }
                    return { ...enemy, intent: newIntent };
                });

                set((current) => ({
                    enemies: updatedEnemies,
                    actionQueue: [
                        { type: 'START_TURN' },
                        { type: 'STATUS_TICK', payload: { targetId: 'player' } },
                        ...current.actionQueue.slice(1)
                    ],
                    isResolving: false
                }));
                trackedTimeout(() => get().resolveQueue(), 0);
                return;
            }
            case 'START_TURN': {
                // C-2: Reset enemy block at start of player turn
                set((current) => ({
                    player: { ...current.player, energy: current.player.maxEnergy, block: 0 },
                    enemies: current.enemies.map(e => ({ ...e, block: 0 })),
                    isPlayerTurn: true
                }));
                get().drawCards(5);
                break;
            }
            case 'PLAY_ANIMATION': {
                // C-3: Skip animations for dead enemies
                const { targetId } = action.payload;
                if (targetId !== 'player') {
                    const enemy = get().enemies.find(e => e.id === targetId);
                    if (!enemy || enemy.hp <= 0) break;
                }
                get().playAnimation(action.payload.targetId, action.payload.animation);
                break;
            }
            case 'ANNOUNCE_INTENT': {
                const { targetId, text } = action.payload;
                get().addFloatingText({ targetId, value: text, type: 'status' });
                delay = 650;
                break;
            }
            case 'DELAY': {
                delay = action.payload.ms;
                break;
            }
        }

        // C-1: Advance queue with tracked timeout for proper serialization
        trackedTimeout(() => {
            set((current) => ({
                actionQueue: current.actionQueue.slice(1),
                isResolving: false
            }));
            get().resolveQueue();
        }, delay);
    },

    drawCards: (amount: number) => {
        set((state) => {
            let currentDraw = [...state.drawPile];
            let currentDiscard = [...state.discardPile];
            let currentHand = [...state.hand];

            for (let i = 0; i < amount; i++) {
                if (currentDraw.length === 0) {
                    if (currentDiscard.length === 0) break;
                    if (state.rng) currentDraw = state.rng.shuffle(currentDiscard);
                    currentDiscard = [];
                }
                if (currentHand.length >= 10) {
                    currentDiscard.push(currentDraw.shift()!);
                } else {
                    currentHand.push(currentDraw.shift()!);
                }
            }

            return { drawPile: currentDraw, discardPile: currentDiscard, hand: currentHand };
        });
    },

    playCard: (cardInstanceId: string, targetId?: string) => {
        set((state) => {
            const cardIndex = state.hand.findIndex(c => c.instanceId === cardInstanceId);
            if (cardIndex === -1) return state;

            const card = state.hand[cardIndex];
            if (state.player.energy < card.cost) return state;

            // Don't waste energy swinging at a corpse
            if (targetId) {
                const targetEnemy = state.enemies.find(e => e.id === targetId);
                if (!targetEnemy || targetEnemy.hp <= 0) return state;
            }

            let newHand = [...state.hand];
            newHand.splice(cardIndex, 1);

            const animId = Math.random().toString(36).substr(2, 9);
            const playingCard: PlayingCard = {
                card,
                id: animId,
                targetId,
                isExhausting: !!card.exhausts
            };

            const playAction: GameAction = { type: 'PLAY_CARD', payload: { card, targetId } };

            trackedTimeout(() => {
                get().cleanupPlayingCard(animId);
            }, 800);

            return {
                player: { ...state.player, energy: state.player.energy - card.cost },
                hand: newHand,
                playingCards: [...state.playingCards, playingCard],
                actionQueue: [...state.actionQueue, playAction]
            };
        });

        get().resetDragState();
        get().resolveQueue();
    },

    cleanupPlayingCard: (animId: string) => {
        set((state) => {
            const playingCard = state.playingCards.find(pc => pc.id === animId);
            if (!playingCard) return state;

            const newPlayingCards = state.playingCards.filter(pc => pc.id !== animId);

            if (playingCard.isExhausting) {
                return {
                    playingCards: newPlayingCards,
                    exhaustPile: [...state.exhaustPile, playingCard.card]
                };
            } else {
                return {
                    playingCards: newPlayingCards,
                    discardPile: [...state.discardPile, playingCard.card]
                };
            }
        });
    },

    endTurn: () => {
        set((state) => {
            let newDiscard = [...state.discardPile, ...state.hand];
            return {
                hand: [],
                discardPile: newDiscard,
                actionQueue: [...state.actionQueue, { type: 'END_TURN' }]
            };
        });
        get().resolveQueue();
    },

    setDragState: (updates: Partial<DragState>) => {
        set((state) => {
            const currentDrag = state.dragState;
            return {
                dragState: {
                    ...currentDrag,
                    ...updates,
                    prevX: updates.currentX !== undefined ? currentDrag.currentX : currentDrag.prevX,
                    prevY: updates.currentY !== undefined ? currentDrag.currentY : currentDrag.prevY
                }
            };
        });
    },

    resetDragState: () => {
        set({ dragState: { ...defaultDragState } });
    },

    setEntityBounds: (id: string, bounds: DOMRect) => {
        set((state) => ({
            entityBounds: {
                ...state.entityBounds,
                [id]: bounds
            }
        }));
    }
}));

// Auto-save run state to localStorage (debounced)
let saveTimer: ReturnType<typeof setTimeout> | null = null;
useGameStore.subscribe((state) => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveRun(state), 100);
});
