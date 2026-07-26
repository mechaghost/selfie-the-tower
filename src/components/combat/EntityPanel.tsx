import React, { useRef, useLayoutEffect, useEffect } from 'react';
import { Entity, Enemy, FloatingText } from '../../core/models';
import { Shield, Swords, ShieldPlus, Zap } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { STATUS_REGISTRY } from '../../data/statusEffects';
import './EntityPanel.css';

// M-3: Status tooltip descriptions keyed by status id
const STATUS_DESCRIPTIONS: Record<string, string> = {
    vulnerable: 'Takes 50% more damage',
    weak: 'Deals 25% less damage',
    strength: '+1 damage per stack',
    dexterity: '+1 block per stack',
    burn: 'Loses HP each turn (ignores block), then cools by 1',
    thorns: 'Attackers take damage back per stack',
    regen: 'Heals HP each turn, then fades by 1'
};

function floatingTextLabel(ft: FloatingText): string | number {
    if (ft.type === 'damage' || ft.type === 'burn') return `-${ft.value}`;
    if (ft.type === 'status' || ft.type === 'blocked') return ft.value;
    return `+${ft.value}`;
}

function floatingTextClass(ft: FloatingText): string {
    const big = ft.type === 'damage' && typeof ft.value === 'number' && ft.value >= 10;
    return `floating-text ${ft.type}${big ? ' big' : ''}`;
}

export function describeIntent(intent: Enemy['intent']): string {
    if (!intent) return 'Waiting...';
    switch (intent.type) {
        case 'Attack': return `Attacking for ${intent.damage} damage`;
        case 'Defend': return `Defending — gaining ${intent.block} block`;
        case 'AttackDefend': return `Attacking for ${intent.damage} and gaining ${intent.block} block`;
        case 'Buff': {
            const parts: string[] = [];
            if (intent.block) parts.push(`gaining ${intent.block} block`);
            intent.effects?.forEach(e => {
                if (e.type === 'ApplyStatus') parts.push(`applying ${e.amount} ${e.statusId}`);
            });
            return `Buffing — ${parts.join(', ') || 'powering up'}`;
        }
        case 'Debuff': {
            const effects = intent.effects?.filter(e => e.type === 'ApplyStatus')
                .map(e => `${e.amount} ${e.statusId}`).join(', ');
            return `Debuffing — applying ${effects || 'a debuff'} to you`;
        }
        case 'AttackDebuff': return `Attacking for ${intent.damage} and applying a debuff`;
        default: return `Preparing something...`;
    }
}

export function describeStatuses(statuses: Entity['statuses']): string[] {
    return statuses.map(s => {
        const desc = STATUS_DESCRIPTIONS[s.id];
        const def = STATUS_REGISTRY[s.id];
        const name = def?.name || s.id;
        return `${name} ×${s.amount}${desc ? ` — ${desc}` : ''}`;
    });
}

// M-5: Unified hover radius padding
const HOVER_RADIUS_PADDING = 25;

interface EntityPanelProps {
    entity: Entity;
    isPlayer?: boolean;
    inspectedEnemyId?: string | null;
    onInspect?: (enemyId: string) => void;
}

export function EntityPanel({ entity, isPlayer, onInspect }: EntityPanelProps) {
    const avatarRef = useRef<HTMLDivElement>(null);
    const { floatingTexts, activeAnimations, setEntityBounds, dragState, entityBounds, playerPortraitUrl, playerSpriteUrl } = useGameStore(state => ({
        floatingTexts: state.floatingTexts.filter(ft => ft.targetId === entity.id),
        activeAnimations: state.activeAnimations.filter(a => a.targetId === entity.id),
        setEntityBounds: state.setEntityBounds,
        dragState: state.dragState,
        entityBounds: state.entityBounds,
        playerPortraitUrl: state.player?.portraitUrl,
        playerSpriteUrl: state.player?.spriteUrl,
    }));
    const hpPercentage = (entity.hp / entity.maxHp) * 100;

    // M-2: Update bounds on mount and window resize
    const updateBounds = React.useCallback(() => {
        if (!isPlayer && avatarRef.current) {
            setEntityBounds(entity.id, avatarRef.current.getBoundingClientRect());
        }
    }, [isPlayer, entity.id, setEntityBounds]);

    useLayoutEffect(updateBounds, [updateBounds]);

    useEffect(() => {
        window.addEventListener('resize', updateBounds);
        return () => window.removeEventListener('resize', updateBounds);
    }, [updateBounds]);

    let isTargeted = false;
    if (!isPlayer && entity.hp > 0 && dragState.isActive && dragState.targetType === 'Enemy') {
        const bounds = entityBounds[entity.id];
        if (bounds) {
            const centerX = bounds.left + bounds.width / 2;
            const centerY = bounds.top + bounds.height / 2;
            const dist = Math.hypot(centerX - dragState.currentX, centerY - dragState.currentY);
            const hoverRadius = (bounds.width / 2) + HOVER_RADIUS_PADDING;

            if (dist < hoverRadius) {
                isTargeted = true;
            }
        }
    }

    const animClasses = activeAnimations.map(a => `anim-${a.type}`).join(' ');

    let lungeStyle = {} as React.CSSProperties;
    const lungeAnim = activeAnimations.find(a => a.type === 'lunge');
    if (lungeAnim && lungeAnim.destinationId) {
        const sourceRect = entityBounds[entity.id];
        const destRect = entityBounds[lungeAnim.destinationId];
        if (sourceRect && destRect) {
            const sourceCX = sourceRect.left + sourceRect.width / 2;
            const sourceCY = sourceRect.top + sourceRect.height / 2;
            const destCX = destRect.left + destRect.width / 2;
            const destCY = destRect.top + destRect.height / 2;

            lungeStyle = {
                '--lunge-x': `${(destCX - sourceCX) * 0.3}px`,
                '--lunge-y': `${(destCY - sourceCY) * 0.3}px`
            } as React.CSSProperties;
        }
    }

    // --- Player: sprite or portrait or emoji fallback ---
    if (isPlayer) {
        const hasSprite = !!playerSpriteUrl;
        const hasPortrait = !!playerPortraitUrl;
        const avatarClasses = [
            'entity-avatar',
            animClasses,
            hasSprite ? 'has-sprite' : '',
            hasPortrait && !hasSprite ? 'has-portrait' : '',
        ].filter(Boolean).join(' ');

        const hpPct = (entity.hp / entity.maxHp) * 100;

        return (
            <div className="entity-panel player">
                <div className="player-info-bar">
                    <div className="player-name">{entity.name}</div>
                    <div className="hp-bar-container player-hp">
                        <div className="hp-text">{entity.hp}/{entity.maxHp}</div>
                        <div className="hp-bar-bg">
                            <div className="hp-bar-ghost" style={{ width: `${hpPct}%` }} />
                            <div className="hp-bar-fill" style={{ width: `${hpPct}%` }} />
                        </div>
                    </div>
                    <div className="player-status-row">
                        {entity.block > 0 && (
                            <div className="player-block-inline">
                                <Shield size={10} /> {entity.block}
                            </div>
                        )}
                        {entity.statuses.map(status => {
                            const def = STATUS_REGISTRY[status.id];
                            return (
                                <div
                                    key={status.id}
                                    className={`player-status-pip ${def?.type === 'Debuff' ? 'debuff' : 'buff'}`}
                                    title={`${def?.name}: ${status.amount}`}
                                >
                                    {def?.icon}{status.amount}
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="entity-avatar-container">
                    <div
                        ref={avatarRef}
                        className={avatarClasses}
                        style={lungeStyle}
                        data-entity-id={entity.id}
                    >
                        {hasSprite
                            ? <img src={playerSpriteUrl} alt={entity.name} className="player-sprite-img" />
                            : hasPortrait
                                ? <img src={playerPortraitUrl} alt={entity.name} className="player-portrait-img" />
                                : '🛡️'
                        }
                    </div>
                    {activeAnimations.filter(a => a.type === 'hit').map(a => (
                        <div key={a.id} className="hit-burst" />
                    ))}
                    {floatingTexts.map(ft => (
                        <div key={ft.id} className={floatingTextClass(ft)}>
                            {floatingTextLabel(ft)}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // --- Enemy: card-style threat panel ---
    const enemy = entity as Enemy;
    const isDead = entity.hp <= 0;
    const intent = isDead ? null : enemy.intent;

    let threatClass = '';
    if (intent) {
        if (intent.type.includes('Attack')) threatClass = 'threat-attack';
        else if (intent.type.includes('Defend')) threatClass = 'threat-defend';
        else if (intent.type.includes('Buff')) threatClass = 'threat-buff';
    }

    return (
        <div
            className={`entity-panel enemy ${threatClass} ${isTargeted ? 'targeted-panel' : ''} ${isDead ? 'is-dead' : ''}`}
            onClick={(e) => { e.stopPropagation(); if (!isDead) onInspect?.(entity.id); }}
        >
            {/* Tap-to-inspect highlight */}
            {/* Intent row at top of card */}
            {intent && (
                <div className="intent-row">
                    {intent.type.includes('Attack') && (
                        <div className="intent-item attack">
                            <Swords size={16} />
                            <span className="intent-value">{intent.damage}</span>
                        </div>
                    )}
                    {intent.type.includes('Defend') && intent.type !== 'AttackDefend' && (
                        <div className="intent-item defend">
                            <ShieldPlus size={16} />
                            {intent.block != null && <span className="intent-value">{intent.block}</span>}
                        </div>
                    )}
                    {intent.type === 'AttackDefend' && (
                        <div className="intent-item defend">
                            <ShieldPlus size={14} />
                        </div>
                    )}
                    {/* M-4: Show block value when Buff intent includes block */}
                    {intent.type === 'Buff' && (
                        <div className="intent-item buff">
                            <Zap size={16} />
                            {intent.block != null && (
                                <>
                                    <ShieldPlus size={14} />
                                    <span className="intent-value">{intent.block}</span>
                                </>
                            )}
                        </div>
                    )}
                    {intent.type === 'Debuff' && (
                        <div className="intent-item debuff">
                            <Zap size={16} />
                        </div>
                    )}
                    {intent.type === 'AttackDebuff' && !intent.type.includes('Defend') && (
                        <div className="intent-item attack">
                            <Swords size={16} />
                            <span className="intent-value">{intent.damage}</span>
                        </div>
                    )}
                </div>
            )}

            <div className="entity-avatar-container">
                <div
                    ref={avatarRef}
                    className={`entity-avatar ${isTargeted ? 'targeted' : ''} ${animClasses}`}
                    style={lungeStyle}
                    data-entity-id={isDead ? undefined : entity.id}
                >
                    <img
                        src={`/assets/enemies/${enemy.templateId}.png`}
                        alt={entity.name}
                        className="enemy-portrait-img"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; e.currentTarget.parentElement!.textContent = '👹'; }}
                    />
                </div>
                {activeAnimations.filter(a => a.type === 'hit').map(a => (
                    <div key={a.id} className="hit-burst" />
                ))}
                {floatingTexts.map(ft => (
                    <div key={ft.id} className={floatingTextClass(ft)}>
                        {floatingTextLabel(ft)}
                    </div>
                ))}
            </div>

            <div className="entity-info">
                <div className="entity-name">{entity.name}</div>

                {entity.block > 0 && !isDead && (
                    <div className="entity-block">
                        <Shield size={14} /> <span>{entity.block}</span>
                    </div>
                )}

                <div className="hp-bar-container">
                    <div className="hp-text">{isDead ? 'DOWN' : `${entity.hp}/${entity.maxHp}`}</div>
                    <div className="hp-bar-bg">
                        <div
                            className="hp-bar-ghost"
                            style={{ width: `${hpPercentage}%` }}
                        />
                        <div
                            className="hp-bar-fill"
                            style={{ width: `${hpPercentage}%` }}
                        />
                    </div>
                </div>

                {/* M-3: Fixed status tooltip descriptions */}
                <div className="status-container">
                    {entity.statuses.map(status => {
                        const def = STATUS_REGISTRY[status.id];
                        const desc = STATUS_DESCRIPTIONS[status.id] || (def?.type === 'Debuff' ? 'Negative effect' : 'Positive effect');
                        return (
                            <div
                                key={status.id}
                                className={`status-icon ${def?.type === 'Debuff' ? 'debuff' : 'buff'}`}
                                title={`${def?.name}: ${desc}`}
                            >
                                {def?.icon || '?'} {status.amount}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
