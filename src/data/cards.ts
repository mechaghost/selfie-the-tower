import { Card, GameAction } from '../core/models';

export const CARD_DATABASE: Record<string, Card> = {
    strike_red: {
        id: 'strike_red',
        instanceId: '', // Populated on instantiation
        name: 'Strike',
        type: 'Attack',
        cost: 1,
        description: 'Deal 6 damage.',
        target: 'Enemy'
    },
    defend_red: {
        id: 'defend_red',
        instanceId: '',
        name: 'Defend',
        type: 'Skill',
        cost: 1,
        description: 'Gain 5 Block.',
        target: 'Self'
    },
    bash: {
        id: 'bash',
        instanceId: '',
        name: 'Bash',
        type: 'Attack',
        cost: 2,
        description: 'Deal 8 damage. Apply 2 Vulnerable.',
        target: 'Enemy'
    }
};

export const createCardInstance = (cardId: string): Card => {
    const template = CARD_DATABASE[cardId];
    if (!template) throw new Error(`Card ${cardId} not found`);
    return {
        ...template,
        instanceId: `${cardId}_${Math.random().toString(36).substr(2, 9)}`
    };
};

export const resolveCardPlay = (card: Card, targetId?: string): GameAction[] => {
    const actions: GameAction[] = [];

    if (card.id === 'strike_red') {
        actions.push({ type: 'DAMAGE_ENTITY', payload: { targetId, amount: 6 } });
    } else if (card.id === 'defend_red') {
        actions.push({ type: 'GAIN_BLOCK', payload: { targetId: 'player', amount: 5 } });
    } else if (card.id === 'bash') {
        actions.push({ type: 'DAMAGE_ENTITY', payload: { targetId, amount: 8 } });
        actions.push({ type: 'APPLY_STATUS', payload: { targetId, status: { id: 'vulnerable', name: 'Vulnerable', amount: 2, justApplied: true } } });
    }

    return actions;
};
