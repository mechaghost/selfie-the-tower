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
    },
    // Ticking statuses are self-managed (tick then lose 1 stack at the
    // start of the owner's turn) — not via the generic decay pass.
    'burn': {
        id: 'burn',
        name: 'Burn',
        icon: '🔥',
        type: 'Debuff',
        decreasesPerTurn: false,
        hpLossPerTurn: 1
    },
    'thorns': {
        id: 'thorns',
        name: 'Spikes',
        icon: '🌵',
        type: 'Buff',
        decreasesPerTurn: false,
        retaliateDamagePerStack: 1
    },
    'regen': {
        id: 'regen',
        name: 'Regen',
        icon: '💚',
        type: 'Buff',
        decreasesPerTurn: false,
        healPerTurn: 1
    }
};
