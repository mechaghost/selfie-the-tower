import React from 'react';
import { Card } from '../../core/models';
import { useGameStore } from '../../store/gameStore';
import { Crosshair, Users, User } from 'lucide-react';
import './CardItem.css';

// Pre-load a 1x1 transparent pixel so it's decoded before any drag starts
const EMPTY_DRAG_IMG = new Image();
EMPTY_DRAG_IMG.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

interface CardItemProps {
    card: Card;
    style?: React.CSSProperties;
    canPlay?: boolean;
    isDraggable?: boolean;
}

export function CardItem({ card, style, canPlay = true, isDraggable = true }: CardItemProps) {
    const { dragState, setDragState, resetDragState, playCard } = useGameStore(state => ({
        dragState: state.dragState,
        setDragState: state.setDragState,
        resetDragState: state.resetDragState,
        playCard: state.playCard
    }));

    const isBeingTouched = dragState.isActive && dragState.isTouch && dragState.cardId === card.instanceId;

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        if (!canPlay) {
            e.preventDefault();
            return;
        }

        e.dataTransfer.setData('application/json', JSON.stringify({
            instanceId: card.instanceId,
            target: card.target
        }));
        e.dataTransfer.effectAllowed = 'move';

        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        const startX = rect.left + rect.width / 2;
        const startY = rect.top;

        // Recalculate all bounding boxes precisely at drag start
        if (card.target === 'Enemy') {
            const state = useGameStore.getState();
            document.querySelectorAll('.entity-avatar').forEach(el => {
                const id = el.getAttribute('data-entity-id');
                if (id) {
                    state.setEntityBounds(id, el.getBoundingClientRect());
                }
            });
        }

        setDragState({
            isActive: true,
            cardId: card.instanceId,
            targetType: card.target,
            isTouch: false,
            startX,
            startY,
            currentX: e.clientX,
            currentY: e.clientY
        });

        e.dataTransfer.setDragImage(EMPTY_DRAG_IMG, 0, 0);
    };

    const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
        if (e.clientX === 0 && e.clientY === 0) return;

        const state = useGameStore.getState();
        if (state.dragState.isActive) {
            state.setDragState({
                currentX: e.clientX,
                currentY: e.clientY
            });
        }
    };

    const handleDragEnd = () => {
        resetDragState();
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        if (!canPlay) return;

        // Recalculate bounds for touch targets before drag starts
        if (card.target === 'Enemy') {
            const state = useGameStore.getState();
            document.querySelectorAll('.entity-avatar').forEach(el => {
                const id = el.getAttribute('data-entity-id');
                if (id) {
                    state.setEntityBounds(id, el.getBoundingClientRect());
                }
            });
        }

        const touch = e.touches[0];
        setDragState({
            isActive: true,
            isTouch: true,
            cardId: card.instanceId,
            targetType: card.target,
            startX: touch.clientX,
            startY: touch.clientY,
            currentX: touch.clientX,
            currentY: touch.clientY
        });
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (!isBeingTouched) return;
        // Prevent generic scrolling
        if (e.cancelable) e.preventDefault();

        const touch = e.touches[0];
        setDragState({
            currentX: touch.clientX,
            currentY: touch.clientY
        });
    };

    const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
        if (!isBeingTouched) return;
        const touch = e.changedTouches[0];

        const elementUnder = document.elementFromPoint(touch.clientX, touch.clientY);
        let dropSuccessful = false;

        if (card.target === 'Enemy') {
            const enemyAvatar = elementUnder?.closest('.entity-avatar') as HTMLElement | null;
            if (enemyAvatar) {
                const enemyId = enemyAvatar.getAttribute('data-entity-id');
                if (enemyId && enemyId !== 'player') {
                    playCard(card.instanceId, enemyId);
                    dropSuccessful = true;
                }
            }
        } else {
            // Self or AllEnemies cards just need to be dragged high enough (above the bottom 250px UI zone)
            if (touch.clientY < window.innerHeight - 250) {
                playCard(card.instanceId);
                dropSuccessful = true;
            }
        }

        if (!dropSuccessful) {
            resetDragState();
        }
    };

    const getTargetIcon = (target: string) => {
        switch (target) {
            case 'Enemy': return <span title="Single Target" style={{ display: 'flex' }}><Crosshair size={14} /></span>;
            case 'AllEnemies': return <span title="Multi Target" style={{ display: 'flex' }}><Users size={14} /></span>;
            case 'Self': return <span title="Player Target" style={{ display: 'flex' }}><User size={14} /></span>;
            default: return null;
        }
    };

    const combinedStyle: React.CSSProperties = { ...style };

    return (
        <div
            className={`card ${canPlay ? 'playable' : 'unplayable'} type-${card.type.toLowerCase()} ${isBeingTouched ? 'is-dragging' : ''}`}
            draggable={isDraggable && canPlay}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={combinedStyle}
        >
            <div className="card-cost">{card.cost}</div>
            {card.target !== 'None' && (
                <div className="card-target-badge">
                    {getTargetIcon(card.target)}
                </div>
            )}
            <div className="card-name">{card.name}</div>
            <div className="card-type">{card.type}</div>
            {card.imageId && (
                <img src={`/assets/cards/${card.imageId}.png`} className="card-artwork" alt={card.name} />
            )}
            <div className="card-desc">{card.description}</div>
        </div>
    );
}
