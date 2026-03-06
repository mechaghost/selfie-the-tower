import { StatusDefinition } from '../core/models';

export const STATUS_REGISTRY: Record<string, StatusDefinition> = {
    'vulnerable': {
        id: 'vulnerable',
        name: 'Vulnerable',
        icon: '💔',
        type: 'Debuff',
        decreasesPerTurn: true,
        damageTakenMultiplier: 1.5
    },
    'weak': {
        id: 'weak',
        name: 'Weak',
        icon: '📉',
        type: 'Debuff',
        decreasesPerTurn: true,
        damageGivenMultiplier: 0.75
    },
    'strength': {
        id: 'strength',
        name: 'Strength',
        icon: '💪',
        type: 'Buff',
        decreasesPerTurn: false,
        flatDamageGivenPerStack: 1
    },
    'dexterity': {
        id: 'dexterity',
        name: 'Dexterity',
        icon: '🛡️',
        type: 'Buff',
        decreasesPerTurn: false,
        flatBlockGivenPerStack: 1
    }
};
