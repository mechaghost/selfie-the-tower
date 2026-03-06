import { create } from 'zustand';
import { Card, Enemy, Player, GameAction, GameActionType, FloatingText, Effect, StatusEffect } from '../core/models';
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
    setDragState: (state: Partial<DragState>) => void;
    resetDragState: () => void;
    setEntityBounds: (id: string, bounds: DOMRect) => void;
}

// No longer needed, as player state is fetched dynamically via Character Definitions

export function resolveEffects(
    effects: Effect[],
    sourceId: string,
    primaryTargetId?: string,
    allEnemyIds: string[] = [] // Needed strictly for AllEnemies resolution
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
                    const randIdx = Math.floor(Math.random() * allEnemyIds.length);
                    targets = [allEnemyIds[randIdx]];
                }
                break;
        }

        targets.forEach(targetId => {
            if (effect.type === 'Damage' && effect.amount) {
                actions.push({ type: 'DAMAGE_ENTITY', payload: { sourceId, targetId, amount: effect.amount } });
            } else if (effect.type === 'Block' && effect.amount) {
                actions.push({ type: 'GAIN_BLOCK', payload: { sourceId, targetId, amount: effect.amount } });
            } else if (effect.type === 'ApplyStatus' && effect.amount && effect.statusId) {
                actions.push({
                    type: 'APPLY_STATUS', payload: {
                        sourceId, targetId, status: { id: effect.statusId, name: effect.statusId, amount: effect.amount, justApplied: true }
                    }
                });
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

    initializeRun: (seed: string, characterId: string = 'ironclad') => {
        const rng = new RNG(seed);
        const charDef = CHARACTERS[characterId] || CHARACTERS['ironclad'];
        const initialDeck = charDef.startingDeck.map(cardId => createCardInstance(cardId));

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

    startCombat: (enemies: Enemy[]) => {
        set((state) => {
            if (!state.rng) return state;

            // Reset block and statuses for combat start
            const freshPlayer = {
                ...state.player,
                energy: state.player.maxEnergy,
                block: 0,
                statuses: []
            };

            const shuffledDraw = state.rng.shuffle([...state.masterDeck]);
            return {
                inCombat: true,
                enemies,
                drawPile: shuffledDraw,
                discardPile: [],
                exhaustPile: [],
                playingCards: [],
                hand: [],
                player: freshPlayer,
                actionQueue: [{ type: 'START_TURN' }] // Kickoff player turn automatically
            };
        });

        get().resolveQueue();
    },

    advanceFloor: (node) => {
        set((state) => {
            // In a full game, we'd check node.type and route to Shop/Rest/Elite logic.
            // For MVP, if it's Combat or Elite or Boss we just start a fight.
            if (['Combat', 'Elite', 'Boss'].includes(node.type)) {
                let enemiesData: Enemy[] = [];

                if (node.encounterId) {
                    // Look up the exact array formulation from our data registry
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

                // Hard fallback just in case data definitions fail
                if (enemiesData.length === 0) {
                    enemiesData = [createEnemyInstance('jaw_worm', `enemy_${node.id}_0`, state.rng)];
                }

                get().startCombat(enemiesData);
            }

            return { floor: state.floor + 1, currentNodeId: node.id };
        });
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
        }, 1200); // 1200ms animation duration
    },

    queueAction: (action: GameAction) => {
        set((state) => ({
            actionQueue: [...state.actionQueue, action],
        }));
        // Start resolving if not already
        // Note: In a real system, you might trigger an async loop here that awaits animations.
        // For now, we'll implement a static synchronous resolver.
    },

    resolveQueue: () => {
        let state = get();
        while (state.actionQueue.length > 0 && !state.isResolving) {
            set({ isResolving: true });

            const action = state.actionQueue[0];

            switch (action.type) {
                case 'DAMAGE_ENTITY': {
                    const { sourceId, targetId, amount } = action.payload;
                    const isPlayer = targetId === 'player';
                    let target = isPlayer ? state.player : state.enemies.find(e => e.id === targetId);
                    let source = sourceId === 'player' ? state.player : state.enemies.find(e => e.id === sourceId);

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

                        // Dispatch visual
                        get().addFloatingText({ targetId, value: finalDamage, type: 'damage' });

                        if (isPlayer) {
                            set({ player: { ...state.player, hp: newHp, block: newBlock } });

                            // Check for Game Over
                            if (newHp <= 0) {
                                set({
                                    isGameOver: true,
                                    inCombat: false,
                                    actionQueue: [],
                                    isResolving: false
                                });
                                return; // Stop resolving this queue
                            }
                        } else {
                            const updatedEnemies = state.enemies.map(e => e.id === targetId ? { ...e, hp: newHp, block: newBlock } : e);
                            set({ enemies: updatedEnemies });

                            // Check for combat victory
                            if (updatedEnemies.every(e => e.hp <= 0)) {
                                set({
                                    inCombat: false,
                                    enemies: [],
                                    actionQueue: [],
                                    isResolving: false
                                });
                                return; // Stop resolving this queue
                            }
                        }
                    }
                    break;
                }
                case 'GAIN_BLOCK': {
                    const { sourceId, targetId, amount } = action.payload;
                    let source = sourceId === 'player' ? state.player : state.enemies.find(e => e.id === sourceId);

                    let finalBlock = amount;
                    if (source) {
                        let flatMod = 0;
                        source.statuses.forEach(s => {
                            const def = STATUS_REGISTRY[s.id];
                            if (def?.flatBlockGivenPerStack && s.amount > 0) flatMod += def.flatBlockGivenPerStack * s.amount;
                        });
                        finalBlock += flatMod;
                    }
                    finalBlock = Math.max(0, finalBlock);

                    get().addFloatingText({ targetId, value: finalBlock, type: 'block' });
                    if (targetId === 'player') {
                        set({ player: { ...state.player, block: state.player.block + finalBlock } });
                    } else {
                        set({ enemies: state.enemies.map(e => e.id === targetId ? { ...e, block: e.block + finalBlock } : e) });
                    }
                    break;
                }
                case 'PLAY_CARD': {
                    const { card, targetId } = action.payload;
                    const allEnemyIds = state.enemies.map(e => e.id);
                    const cardActions = resolveEffects(card.effects || [], 'player', targetId, allEnemyIds);
                    set((current) => ({
                        actionQueue: [...cardActions, ...current.actionQueue.slice(1)],
                        isResolving: false
                    }));
                    state = get();
                    continue; // Skip the default remove-processed-action at the end of loop
                }
                case 'APPLY_STATUS': {
                    const { targetId, status } = action.payload;
                    const isPlayer = targetId === 'player';
                    let target = isPlayer ? state.player : state.enemies.find(e => e.id === targetId);
                    if (target) {
                        const existingStatus = target.statuses.find(s => s.id === status.id);
                        let newStatuses = [...target.statuses];
                        if (existingStatus) {
                            newStatuses = newStatuses.map(s => s.id === status.id ? { ...s, amount: s.amount + status.amount } : s);
                        } else {
                            newStatuses.push(status);
                        }
                        if (isPlayer) {
                            set({ player: { ...state.player, statuses: newStatuses } });
                        } else {
                            set({ enemies: state.enemies.map(e => e.id === targetId ? { ...e, statuses: newStatuses } : e) });
                        }
                    }
                    break;
                }
                case 'END_TURN': {
                    let enemyActions: GameAction[] = [];
                    const allEnemyIds = state.enemies.map(e => e.id);

                    // Execute Enemy intents
                    state.enemies.forEach(enemy => {
                        if (enemy.intent && enemy.intent.effects) {
                            const intentActions = resolveEffects(enemy.intent.effects, enemy.id, 'player', allEnemyIds);
                            enemyActions = enemyActions.concat(intentActions);
                        }
                    });

                    // Utility to process decay
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

                    const newPlayerStatuses = decayStatuses(state.player.statuses);
                    const newEnemies = state.enemies.map(enemy => ({
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
                    state = get();
                    continue;
                }
                case 'CALCULATE_INTENTS' as GameActionType: {
                    const updatedEnemies = state.enemies.map(enemy => {
                        // In MVP we used ID patterns like `enemy_jaw_worm_node1` or passed templateId.
                        // We will look up the template directly:
                        let templateId = 'jaw_worm';
                        if (enemy.name === 'Gremlin Nob') templateId = 'gremlin_nob';

                        const aiDef = enemies[templateId];
                        let newIntent = null;

                        if (aiDef && aiDef.aiPatterns) {
                            // Filter patterns whose conditions are met
                            let validPatterns = aiDef.aiPatterns.filter(p => {
                                if (p.condition === 'Turn1') return !enemy.intent;
                                if (p.condition === 'BelowHalfHP') return enemy.hp <= enemy.maxHp / 2;
                                return p.condition === 'Always' || !p.condition;
                            });

                            // Priority override: Specific conditions take precedence over general 'Always' behaviors
                            if (validPatterns.some(p => p.condition === 'Turn1')) {
                                validPatterns = validPatterns.filter(p => p.condition === 'Turn1');
                            } else if (validPatterns.some(p => p.condition === 'BelowHalfHP')) {
                                validPatterns = validPatterns.filter(p => p.condition === 'BelowHalfHP');
                            }

                            if (validPatterns.length > 0) {
                                // RNG Weighted Selection
                                const totalWeight = validPatterns.reduce((sum, p) => sum + p.chance, 0);
                                const roll = state.rng ? state.rng.next() * totalWeight : Math.random() * totalWeight;
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
                    state = get();
                    continue;
                }
                case 'START_TURN': {
                    set((current) => ({
                        player: { ...current.player, energy: current.player.maxEnergy, block: 0 }
                    }));
                    get().drawCards(5);
                    break;
                }
            }

            // Remove processed action
            set((current) => ({
                actionQueue: current.actionQueue.slice(1),
                isResolving: false
            }));

            state = get();
        }
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

            // Push card effect to action queue
            const playAction: GameAction = { type: 'PLAY_CARD', payload: { card, targetId } };

            // Schedule the cleanup of the visual card after the animation completes (800ms)
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
                    // If we're updating currentX/Y, archive the old ones to prevX/Y for velocity tracking
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

