import React, { useRef, useLayoutEffect } from 'react';
import { Entity } from '../../core/models';
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
            e.stopPropagation(); // Don't let the CombatView background catch this drop
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
            const hoverRadius = (bounds.width / 2) + 20;

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

            // Lunge ~30% of the distance towards the target
            lungeStyle = {
                '--lunge-x': `${(destCX - sourceCX) * 0.3}px`,
                '--lunge-y': `${(destCY - sourceCY) * 0.3}px`
            } as React.CSSProperties;
        }
    }

    const renderIntent = () => {
        if (isPlayer) return null;
        const enemy = entity as import('../../core/models').Enemy;
        if (!enemy.intent) return null;

        const { type, damage, block } = enemy.intent;

        return (
            <div className="intent-badge">
                {type.includes('Attack') && (
                    <div className="intent-item attack">
                        <Swords size={20} className="intent-icon" />
                        <span className="intent-value">{damage}</span>
                    </div>
                )}
                {type.includes('Defend') && type !== 'AttackDefend' && (
                    <div className="intent-item defend">
                        <ShieldPlus size={20} className="intent-icon" />
                        {block && <span className="intent-value">{block}</span>}
                    </div>
                )}
                {type === 'AttackDefend' && (
                    <div className="intent-item defend">
                        <ShieldPlus size={16} className="intent-icon secondary" />
                    </div>
                )}
                {type.includes('Buff') && (
                    <div className="intent-item buff">
                        <Zap size={20} className="intent-icon" />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={`entity-panel ${isPlayer ? 'player' : 'enemy'}`}>
            <div className="entity-avatar-container">
                {renderIntent()}
                <div
                    ref={avatarRef}
                    className={`entity-avatar ${isTargeted ? 'targeted' : ''} ${animClasses}`}
                    style={lungeStyle}
                    data-entity-id={entity.id}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    {isPlayer ? '🛡️' : '👹'}
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
                        <Shield size={16} /> <span>{entity.block}</span>
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
                            <div key={status.id} className={`status-icon ${status.id}`} title={def?.name || status.id}>
                                {def?.icon || '❓'} {status.amount}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
