import { create } from 'zustand';
import { Card, Enemy, Player, GameAction, FloatingText } from '../core/models';
import { RNG } from '../core/rng';
import { resolveCardPlay, createCardInstance } from '../data/cards';

export interface DragState {
    isActive: boolean;
    cardId: string | null;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
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
    endTurn: () => void;

    addFloatingText: (text: Omit<FloatingText, 'id'>) => void;
    setDragState: (state: Partial<DragState>) => void;
    resetDragState: () => void;
    setEntityBounds: (id: string, bounds: DOMRect) => void;
}

const initialPlayerState: Player = {
    id: 'player',
    name: 'The Ironclad', // Placeholder default class
    hp: 80,
    maxHp: 80,
    block: 0,
    statuses: [],
    energy: 3,
    maxEnergy: 3,
    gold: 99
};

export const useGameStore = create<GameState>((set, get) => ({
    seed: '',
    rng: null,
    floor: 0,
    currentNodeId: null,

    isGameOver: false,
    inCombat: false,
    player: { ...initialPlayerState },
    enemies: [],

    masterDeck: [],
    drawPile: [],
    hand: [],
    discardPile: [],
    exhaustPile: [],

    actionQueue: [],
    isResolving: false,
    floatingTexts: [],

    dragState: {
        isActive: false,
        cardId: null,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0
    },
    entityBounds: {},

    initializeRun: (seed: string) => {
        const rng = new RNG(seed);
        set({
            seed,
            rng,
            floor: 0,
            currentNodeId: null,
            player: { ...initialPlayerState },
            masterDeck: [
                createCardInstance('strike_red'),
                createCardInstance('strike_red'),
                createCardInstance('strike_red'),
                createCardInstance('strike_red'),
                createCardInstance('defend_red'),
                createCardInstance('defend_red'),
                createCardInstance('defend_red'),
                createCardInstance('defend_red'),
                createCardInstance('bash')
            ],
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
                // Generate an enemy dynamically based on floor/seed (stubbed here for MVP)
                const enemy: Enemy = {
                    id: `enemy_${node.id}`,
                    name: node.type === 'Elite' ? 'Gremlin Nob' : 'Jaw Worm',
                    hp: node.type === 'Elite' ? 80 : 40,
                    maxHp: node.type === 'Elite' ? 80 : 44,
                    block: 0,
                    statuses: [],
                    intent: { type: 'Attack', damage: node.type === 'Elite' ? 14 : 11 }
                };
                get().startCombat([enemy]);
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
        }, 800); // 800ms animation duration
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
                    const { targetId, amount } = action.payload;
                    const isPlayer = targetId === 'player';
                    let target = isPlayer ? state.player : state.enemies.find(e => e.id === targetId);
                    if (target) {
                        let finalDamage = amount;
                        if (target.statuses.some(s => s.id === 'vulnerable' && s.amount > 0)) {
                            finalDamage = Math.floor(finalDamage * 1.5);
                        }
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
                    const { targetId, amount } = action.payload;
                    get().addFloatingText({ targetId, value: amount, type: 'block' });
                    if (targetId === 'player') {
                        set({ player: { ...state.player, block: state.player.block + amount } });
                    } else {
                        set({ enemies: state.enemies.map(e => e.id === targetId ? { ...e, block: e.block + amount } : e) });
                    }
                    break;
                }
                case 'PLAY_CARD': {
                    const { card, targetId } = action.payload;
                    const cardActions = resolveCardPlay(card, targetId);
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
                    const enemyActions: GameAction[] = [];
                    state.enemies.forEach(enemy => {
                        if (enemy.intent && enemy.intent.type === 'Attack') {
                            enemyActions.push({ type: 'DAMAGE_ENTITY', payload: { targetId: 'player', amount: enemy.intent.damage || 0 } });
                        }
                    });
                    enemyActions.push({ type: 'START_TURN' });
                    set((current) => ({
                        actionQueue: [...enemyActions, ...current.actionQueue.slice(1)],
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

            let newDiscard = [...state.discardPile];
            let newExhaust = [...state.exhaustPile];

            if (card.exhausts) {
                newExhaust.push(card);
            } else {
                newDiscard.push(card);
            }

            // Push card effect to action queue
            const playAction: GameAction = { type: 'PLAY_CARD', payload: { card, targetId } };

            return {
                player: { ...state.player, energy: state.player.energy - card.cost },
                hand: newHand,
                discardPile: newDiscard,
                exhaustPile: newExhaust,
                actionQueue: [...state.actionQueue, playAction]
            };
        });

        get().resolveQueue();
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
        set((state) => ({
            dragState: { ...state.dragState, ...updates }
        }));
    },

    resetDragState: () => {
        set({
            dragState: {
                isActive: false,
                cardId: null,
                startX: 0,
                startY: 0,
                currentX: 0,
                currentY: 0
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

