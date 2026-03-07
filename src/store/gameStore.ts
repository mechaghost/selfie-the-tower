import { create } from 'zustand';
import { Card, Enemy, Player, GameAction, GameActionType, FloatingText, ActiveAnimation, Effect, StatusEffect } from '../core/models';
import { RNG } from '../core/rng';
import { createCardInstance } from '../data/cards';
import { STATUS_REGISTRY } from '../data/statusEffects';
import { ENCOUNTER_POOLS } from '../data/encounters';
import { createEnemyInstance, enemies } from '../data/enemies';
import { CHARACTERS } from '../data/characters';

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

    // --- Combat State ---
    inCombat: boolean;
    isGameOver: boolean;
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

    // --- Drag & Drop UI ---
    dragState: DragState;
    entityBounds: Record<string, DOMRect>;

    // --- Store Methods ---
    initializeRun: (seed: string) => void;
    startCombat: (enemies: Enemy[]) => void;
    advanceFloor: (node: import('../core/mapModels').MapNode) => void;

    // Queue Methods
    queueAction: (action: GameAction) => void;
    resolveQueue: () => void;

    // Atomic State Mutators (called by the action resolver)
    drawCards: (amount: number) => void;
    playCard: (cardInstanceId: string, targetId?: string) => void;
    cleanupPlayingCard: (animId: string) => void;
    endTurn: () => void;

    addFloatingText: (text: Omit<FloatingText, 'id'>) => void;
    playAnimation: (targetId: string, type: 'lunge' | 'stagger') => void;
    setDragState: (state: Partial<DragState>) => void;
    resetDragState: () => void;
    setEntityBounds: (id: string, bounds: DOMRect) => void;
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

        targets.forEach(targetId => {
            // Fix #9: Handle all effect types
            if (effect.type === 'Damage' && effect.amount) {
                if (sourceId) {
                    actions.push({ type: 'PLAY_ANIMATION', payload: { targetId: sourceId, animation: 'lunge' } });
                    actions.push({ type: 'DELAY', payload: { ms: 300 } });
                }
                actions.push({ type: 'DAMAGE_ENTITY', payload: { sourceId, targetId, amount: effect.amount } });
                actions.push({ type: 'PLAY_ANIMATION', payload: { targetId, animation: 'stagger' } });
                actions.push({ type: 'DELAY', payload: { ms: 400 } });
            } else if (effect.type === 'Block' && effect.amount) {
                actions.push({ type: 'GAIN_BLOCK', payload: { sourceId, targetId, amount: effect.amount } });
            } else if (effect.type === 'ApplyStatus' && effect.amount && effect.statusId) {
                actions.push({
                    type: 'APPLY_STATUS', payload: {
                        sourceId, targetId, status: { id: effect.statusId, name: effect.statusId, amount: effect.amount, justApplied: true }
                    }
                });
            } else if (effect.type === 'Heal' && effect.amount) {
                actions.push({ type: 'HEAL_ENTITY' as GameActionType, payload: { targetId, amount: effect.amount } });
            } else if (effect.type === 'Draw' && effect.amount) {
                actions.push({ type: 'DRAW_CARD', payload: { amount: effect.amount } });
            } else if (effect.type === 'Discard' && effect.amount) {
                actions.push({ type: 'DISCARD_HAND', payload: { amount: effect.amount } });
            } else if (effect.type === 'Exhaust') {
                // Exhaust is handled at the card level via card.exhausts flag
            }
        });
    });

    return actions;
}

export const useGameStore = create<GameState>((set, get) => ({
    seed: '',
    rng: null,
    floor: 0,
    currentNodeId: null,

    isGameOver: false,
    inCombat: false,
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

    dragState: {
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
    },
    entityBounds: {},

    // Fix #1: Pass RNG to createCardInstance for deterministic instance IDs
    initializeRun: (seed: string, characterId: string = 'ironclad') => {
        const rng = new RNG(seed);
        const charDef = CHARACTERS[characterId] || CHARACTERS['ironclad'];
        const initialDeck = charDef.startingDeck.map(cardId => createCardInstance(cardId, rng));

        set({
            seed,
            rng,
            floor: 0,
            currentNodeId: null,
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
            isGameOver: false
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
                enemies: combatEnemies,
                drawPile: shuffledDraw,
                discardPile: [],
                exhaustPile: [],
                playingCards: [],
                hand: [],
                player: freshPlayer,
                actionQueue: [{ type: 'START_TURN' }]
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
            currentNodeId: node.id
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
                    enemiesData = encounterDef.enemyIds.map((enemyTemplate, idx) =>
                        createEnemyInstance(enemyTemplate, `enemy_${node.id}_${idx}`, state.rng)
                    );
                }
            }

            if (enemiesData.length === 0) {
                enemiesData = [createEnemyInstance('jaw_worm', `enemy_${node.id}_0`, state.rng)];
            }

            get().startCombat(enemiesData);
        } else if (node.type === 'Rest') {
            // Heal 30% of max HP at rest sites
            set((current) => ({
                player: {
                    ...current.player,
                    hp: Math.min(current.player.maxHp, current.player.hp + Math.floor(current.player.maxHp * 0.3))
                }
            }));
        }
        // Shop and Unknown are no-ops for now (player just advances past them)
    },

    addFloatingText: (text) => {
        const id = Math.random().toString(36).substr(2, 9);
        set(state => ({
            floatingTexts: [...state.floatingTexts, { ...text, id }]
        }));
        setTimeout(() => {
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
        setTimeout(() => {
            set(state => ({
                activeAnimations: state.activeAnimations.filter(a => a.id !== id)
            }));
        }, 500);
    },

    queueAction: (action: GameAction) => {
        set((state) => ({
            actionQueue: [...state.actionQueue, action],
        }));
    },

    resolveQueue: () => {
        const state = get();
        if (state.actionQueue.length === 0 || state.isResolving) return;

        set({ isResolving: true });
        const action = state.actionQueue[0];
        let delay = 0;

        switch (action.type) {
            case 'DAMAGE_ENTITY': {
                const { sourceId, targetId, amount } = action.payload;
                // Fix #14: Re-fetch state for each action to avoid stale closures
                const freshState = get();
                const isPlayer = targetId === 'player';
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

                    get().addFloatingText({ targetId, value: finalDamage, type: 'damage' });

                    if (isPlayer) {
                        set({ player: { ...freshState.player, hp: newHp, block: newBlock } });

                        if (newHp <= 0) {
                            set({
                                isGameOver: true,
                                inCombat: false,
                                actionQueue: [],
                                isResolving: false
                            });
                            return;
                        }
                    } else {
                        const updatedEnemies = freshState.enemies.map(e => e.id === targetId ? { ...e, hp: newHp, block: newBlock } : e);
                        set({ enemies: updatedEnemies });

                        if (updatedEnemies.every(e => e.hp <= 0)) {
                            set({
                                inCombat: false,
                                enemies: [],
                                actionQueue: [],
                                isResolving: false
                            });
                            return;
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
                    set({ player: { ...freshState.player, block: freshState.player.block + finalBlock } });
                } else {
                    set({ enemies: freshState.enemies.map(e => e.id === targetId ? { ...e, block: e.block + finalBlock } : e) });
                }
                break;
            }
            case 'PLAY_CARD': {
                const { card, targetId } = action.payload;
                const freshState = get();
                const allEnemyIds = freshState.enemies.filter(e => e.hp > 0).map(e => e.id);
                const cardActions = resolveEffects(card.effects || [], 'player', targetId, allEnemyIds, freshState.rng);
                set((current) => ({
                    actionQueue: [...cardActions, ...current.actionQueue.slice(1)],
                    isResolving: false
                }));
                setTimeout(() => get().resolveQueue(), 0);
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
                        set({ player: { ...freshState.player, statuses: newStatuses } });
                    } else {
                        set({ enemies: freshState.enemies.map(e => e.id === targetId ? { ...e, statuses: newStatuses } : e) });
                    }
                }
                break;
            }
            // Fix #9: Handle HEAL_ENTITY action
            case 'HEAL_ENTITY' as GameActionType: {
                const { targetId, amount } = action.payload;
                const freshState = get();
                if (targetId === 'player') {
                    const newHp = Math.min(freshState.player.maxHp, freshState.player.hp + amount);
                    get().addFloatingText({ targetId, value: amount, type: 'heal' });
                    set({ player: { ...freshState.player, hp: newHp } });
                } else {
                    const enemy = freshState.enemies.find(e => e.id === targetId);
                    if (enemy) {
                        const newHp = Math.min(enemy.maxHp, enemy.hp + amount);
                        get().addFloatingText({ targetId, value: amount, type: 'heal' });
                        set({ enemies: freshState.enemies.map(e => e.id === targetId ? { ...e, hp: newHp } : e) });
                    }
                }
                break;
            }
            // Fix #9: Handle DRAW_CARD action
            case 'DRAW_CARD': {
                const drawAmount = action.payload?.amount ?? 1;
                get().drawCards(drawAmount);
                break;
            }
            // Fix #9: Handle DISCARD_HAND action
            case 'DISCARD_HAND': {
                const discardAmount = action.payload?.amount;
                if (discardAmount) {
                    // Discard N random cards from hand
                    set((current) => {
                        const toDiscard = current.hand.slice(0, discardAmount);
                        const remaining = current.hand.slice(discardAmount);
                        return {
                            hand: remaining,
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

                // Fix #10: Only execute intents for living enemies
                freshState.enemies.forEach(enemy => {
                    if (enemy.hp <= 0) return;
                    if (enemy.intent && enemy.intent.effects) {
                        let attackName = 'Attacks!';
                        if (enemy.intent.type.includes('Defend')) attackName = 'Defends!';
                        if (enemy.intent.type.includes('Buff')) attackName = 'Buffs!';
                        if (enemy.intent.type === 'AttackDefend') attackName = 'Attacks & Defends!';

                        // Fix #7: Use 'status' type for announcements instead of casting string to number
                        enemyActions.push({ type: 'ANNOUNCE_INTENT' as GameActionType, payload: { targetId: enemy.id, text: attackName } });

                        const intentActions = resolveEffects(enemy.intent.effects, enemy.id, 'player', allEnemyIds, freshState.rng);
                        enemyActions = enemyActions.concat(intentActions);

                        enemyActions.push({ type: 'DELAY' as GameActionType, payload: { ms: 600 } });
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

                enemyActions.push({ type: 'CALCULATE_INTENTS' as GameActionType });

                set((current) => ({
                    actionQueue: [...enemyActions, ...current.actionQueue.slice(1)],
                    isResolving: false
                }));
                setTimeout(() => get().resolveQueue(), 0);
                return;
            }
            // Fix #3: Use enemy.templateId instead of hardcoded name matching
            case 'CALCULATE_INTENTS' as GameActionType: {
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

                            for (const p of validPatterns) {
                                runningSum += p.chance;
                                if (roll <= runningSum) {
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
                    actionQueue: [{ type: 'START_TURN' }, ...current.actionQueue.slice(1)],
                    isResolving: false
                }));
                setTimeout(() => get().resolveQueue(), 0);
                return;
            }
            case 'START_TURN': {
                set((current) => ({
                    player: { ...current.player, energy: current.player.maxEnergy, block: 0 }
                }));
                get().drawCards(5);
                break;
            }
            case 'PLAY_ANIMATION': {
                get().playAnimation(action.payload.targetId, action.payload.animation);
                break;
            }
            // Fix #7: ANNOUNCE_INTENT uses 'status' type for string floating text
            case 'ANNOUNCE_INTENT' as GameActionType: {
                const { targetId, text } = action.payload;
                get().addFloatingText({ targetId, value: text, type: 'status' });
                delay = 1200;
                break;
            }
            case 'DELAY' as GameActionType: {
                delay = action.payload.ms;
                break;
            }
        }

        // Remove processed action and trigger next after delay
        setTimeout(() => {
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

            setTimeout(() => {
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
        set({
            dragState: {
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
            }
        });
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
