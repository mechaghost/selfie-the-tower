import React, { useRef, useLayoutEffect, useEffect, useState } from 'react';
import { Entity, Enemy } from '../../core/models';
import { Shield, Swords, ShieldPlus, Zap } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { STATUS_REGISTRY } from '../../data/statusEffects';
import './EntityPanel.css';

// M-3: Status tooltip descriptions keyed by status id
const STATUS_DESCRIPTIONS: Record<string, string> = {
    vulnerable: 'Takes 50% more damage',
    weak: 'Deals 25% less damage',
    strength: '+1 damage per stack',
    dexterity: '+1 block per stack'
};

function describeIntent(intent: Enemy['intent']): string {
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

function describeStatuses(statuses: Entity['statuses']): string[] {
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
}

export function EntityPanel({ entity, isPlayer }: EntityPanelProps) {
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
    if (!isPlayer && dragState.isActive && dragState.targetType === 'Enemy') {
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
                    {floatingTexts.map(ft => (
                        <div key={ft.id} className={`floating-text ${ft.type}`}>
                            {ft.type === 'damage' ? `-${ft.value}` : ft.type === 'status' ? ft.value : `+${ft.value}`}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // --- Enemy: card-style threat panel ---
    const enemy = entity as Enemy;
    const intent = enemy.intent;
    const [showInfo, setShowInfo] = useState(false);

    // Auto-dismiss info tooltip after 4 seconds
    useEffect(() => {
        if (!showInfo) return;
        const timer = setTimeout(() => setShowInfo(false), 4000);
        return () => clearTimeout(timer);
    }, [showInfo]);

    let threatClass = '';
    if (intent) {
        if (intent.type.includes('Attack')) threatClass = 'threat-attack';
        else if (intent.type.includes('Defend')) threatClass = 'threat-defend';
        else if (intent.type.includes('Buff')) threatClass = 'threat-buff';
    }

    return (
        <div
            className={`entity-panel enemy ${threatClass} ${isTargeted ? 'targeted-panel' : ''}`}
            onClick={() => setShowInfo(prev => !prev)}
        >
            {/* Tap-to-inspect info tooltip */}
            {showInfo && (
                <div className="enemy-info-tooltip">
                    <p className="enemy-info-intent">{describeIntent(intent)}</p>
                    {entity.block > 0 && <p className="enemy-info-line">Block: {entity.block}</p>}
                    {describeStatuses(entity.statuses).map((line, i) => (
                        <p key={i} className="enemy-info-line">{line}</p>
                    ))}
                    {entity.statuses.length === 0 && entity.block === 0 && (
                        <p className="enemy-info-line">No active effects</p>
                    )}
                </div>
            )}
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
                    data-entity-id={entity.id}
                >
                    <img
                        src={`/assets/enemies/${enemy.templateId}.png`}
                        alt={entity.name}
                        className="enemy-portrait-img"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; e.currentTarget.parentElement!.textContent = '👹'; }}
                    />
                </div>
                {floatingTexts.map(ft => (
                    <div key={ft.id} className={`floating-text ${ft.type}`}>
                        {ft.type === 'damage' ? `-${ft.value}` : ft.type === 'status' ? ft.value : `+${ft.value}`}
                    </div>
                ))}
            </div>

            <div className="entity-info">
                <div className="entity-name">{entity.name}</div>

                {entity.block > 0 && (
                    <div className="entity-block">
                        <Shield size={14} /> <span>{entity.block}</span>
                    </div>
                )}

                <div className="hp-bar-container">
                    <div className="hp-text">{entity.hp}/{entity.maxHp}</div>
                    <div className="hp-bar-bg">
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
