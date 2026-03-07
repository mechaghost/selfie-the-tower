import React, { useRef, useLayoutEffect } from 'react';
import { Entity, Enemy } from '../../core/models';
import { Shield, Swords, ShieldPlus, Zap } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { STATUS_REGISTRY } from '../../data/statusEffects';
import './EntityPanel.css';

interface EntityPanelProps {
    entity: Entity;
    isPlayer?: boolean;
}

export function EntityPanel({ entity, isPlayer }: EntityPanelProps) {
    const avatarRef = useRef<HTMLDivElement>(null);
    const { playCard, floatingTexts, activeAnimations, setEntityBounds, dragState, entityBounds } = useGameStore(state => ({
        playCard: state.playCard,
        floatingTexts: state.floatingTexts.filter(ft => ft.targetId === entity.id),
        activeAnimations: state.activeAnimations.filter(a => a.targetId === entity.id),
        setEntityBounds: state.setEntityBounds,
        dragState: state.dragState,
        entityBounds: state.entityBounds
    }));
    const hpPercentage = (entity.hp / entity.maxHp) * 100;

    useLayoutEffect(() => {
        if (!isPlayer && avatarRef.current) {
            const rect = avatarRef.current.getBoundingClientRect();
            setEntityBounds(entity.id, rect);
        }
    }, [isPlayer, entity.id, setEntityBounds]);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        if (!isPlayer) {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'move';
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        if (!isPlayer) {
            e.preventDefault();
            e.stopPropagation();
            try {
                const data = JSON.parse(e.dataTransfer.getData('application/json'));
                if (data.target === 'Enemy') {
                    playCard(data.instanceId, entity.id);
                }
            } catch (err) {
                // Ignore invalid
            }
        }
    };

    let isTargeted = false;
    if (!isPlayer && dragState.isActive && dragState.targetType === 'Enemy') {
        const bounds = entityBounds[entity.id];
        if (bounds) {
            const centerX = bounds.left + bounds.width / 2;
            const centerY = bounds.top + bounds.height / 2;
            const dist = Math.hypot(centerX - dragState.currentX, centerY - dragState.currentY);
            const hoverRadius = (bounds.width / 2) + 30;

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

    // --- Player: compact presence (avatar + floating text only, stats in TopBar) ---
    if (isPlayer) {
        return (
            <div className="entity-panel player">
                <div className="entity-avatar-container">
                    <div
                        ref={avatarRef}
                        className={`entity-avatar ${animClasses}`}
                        style={lungeStyle}
                        data-entity-id={entity.id}
                    >
                        🛡️
                    </div>
                    {floatingTexts.map(ft => (
                        <div key={ft.id} className={`floating-text ${ft.type}`}>
                            {ft.type === 'damage' ? `-${ft.value}` : ft.type === 'status' ? ft.value : `+${ft.value}`}
                        </div>
                    ))}
                </div>
                <div className="entity-name player-name">{entity.name}</div>
            </div>
        );
    }

    // --- Enemy: card-style threat panel ---
    const enemy = entity as Enemy;
    const intent = enemy.intent;

    let threatClass = '';
    if (intent) {
        if (intent.type.includes('Attack')) threatClass = 'threat-attack';
        else if (intent.type.includes('Defend')) threatClass = 'threat-defend';
        else if (intent.type.includes('Buff')) threatClass = 'threat-buff';
    }

    return (
        <div
            className={`entity-panel enemy ${threatClass} ${isTargeted ? 'targeted-panel' : ''}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
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
                            {intent.block && <span className="intent-value">{intent.block}</span>}
                        </div>
                    )}
                    {intent.type === 'AttackDefend' && (
                        <div className="intent-item defend">
                            <ShieldPlus size={14} />
                        </div>
                    )}
                    {intent.type.includes('Buff') && (
                        <div className="intent-item buff">
                            <Zap size={16} />
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
                    👹
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
                    <div className="hp-text">{entity.hp} / {entity.maxHp}</div>
                    <div className="hp-bar-bg">
                        <div
                            className="hp-bar-fill"
                            style={{ width: `${hpPercentage}%` }}
                        />
                    </div>
                </div>

                <div className="status-container">
                    {entity.statuses.map(status => {
                        const def = STATUS_REGISTRY[status.id];
                        return (
                            <div
                                key={status.id}
                                className={`status-icon ${def?.type === 'Debuff' ? 'debuff' : 'buff'}`}
                                title={`${def?.name}: ${def?.type === 'Debuff' ? 'Takes 50% more damage' : 'Deals 25% less damage'}`}
                            >
                                {def?.icon || '❓'} {status.amount}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
