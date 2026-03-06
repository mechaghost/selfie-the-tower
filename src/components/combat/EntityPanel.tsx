import React, { useRef, useLayoutEffect } from 'react';
import { Entity } from '../../core/models';
import { Shield } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import './EntityPanel.css';

interface EntityPanelProps {
    entity: Entity;
    isPlayer?: boolean;
}

export function EntityPanel({ entity, isPlayer }: EntityPanelProps) {
    const avatarRef = useRef<HTMLDivElement>(null);
    const { playCard, floatingTexts, setEntityBounds } = useGameStore(state => ({
        playCard: state.playCard,
        floatingTexts: state.floatingTexts.filter(ft => ft.targetId === entity.id),
        setEntityBounds: state.setEntityBounds
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

    return (
        <div
            className={`entity-panel ${isPlayer ? 'player' : 'enemy'}`}
            data-entity-id={entity.id}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <div className="entity-avatar-container">
                <div ref={avatarRef} className="entity-avatar">
                    {isPlayer ? '🛡️' : '👹'}
                </div>
                {floatingTexts.map(ft => (
                    <div key={ft.id} className={`floating-text ${ft.type}`}>
                        {ft.type === 'damage' ? `-${ft.value}` : `+${ft.value}`}
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
                    {entity.statuses.map(status => (
                        <div key={status.id} className={`status-icon ${status.id}`} title={status.name}>
                            {status.id === 'vulnerable' ? '💔' : '🛡️'} {status.amount}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
