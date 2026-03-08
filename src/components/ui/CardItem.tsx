import React, { useRef, useCallback } from 'react';
import { Card } from '../../core/models';
import { useGameStore } from '../../store/gameStore';
import './CardItem.css';

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

    const cardRef = useRef<HTMLDivElement>(null);
    const isMouseDragging = useRef(false);

    const isTargetingMode = card.target === 'Enemy';
    const isThisActive = dragState.isActive && dragState.cardId === card.instanceId;
    const isBeingTouched = isThisActive && dragState.isTouch;

    // --- Shared: recalculate enemy bounds ---
    const refreshEnemyBounds = useCallback(() => {
        if (card.target === 'Enemy') {
            const state = useGameStore.getState();
            document.querySelectorAll('.entity-avatar').forEach(el => {
                const id = el.getAttribute('data-entity-id');
                if (id) {
                    state.setEntityBounds(id, el.getBoundingClientRect());
                }
            });
        }
    }, [card.target]);

    // ==========================================
    // MOUSE: Enemy-target → arrow targeting mode
    // MOUSE: Self/AoE → card-drag mode
    // ==========================================

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!canPlay || !isDraggable || e.button !== 0) return;
        e.preventDefault();

        isMouseDragging.current = true;
        refreshEnemyBounds();

        const rect = cardRef.current!.getBoundingClientRect();

        // Enemy cards: start from card center (arrow origin)
        // Self/AoE cards: start from mouse position (so card follows with zero offset)
        const sx = isTargetingMode ? rect.left + rect.width / 2 : e.clientX;
        const sy = isTargetingMode ? rect.top : e.clientY;

        setDragState({
            isActive: true,
            cardId: card.instanceId,
            targetType: card.target,
            isTouch: false,
            startX: sx,
            startY: sy,
            currentX: e.clientX,
            currentY: e.clientY
        });

        const handleMouseMove = (ev: MouseEvent) => {
            if (!isMouseDragging.current) return;
            const state = useGameStore.getState();
            if (state.dragState.isActive) {
                state.setDragState({
                    currentX: ev.clientX,
                    currentY: ev.clientY
                });
            }
        };

        const handleMouseUp = (ev: MouseEvent) => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            isMouseDragging.current = false;

            const state = useGameStore.getState();
            if (!state.dragState.isActive) return;

            if (isTargetingMode) {
                // Enemy target: check if cursor is over an enemy
                const el = document.elementFromPoint(ev.clientX, ev.clientY);
                const enemyAvatar = el?.closest('.entity-avatar') as HTMLElement | null;
                if (enemyAvatar) {
                    const enemyId = enemyAvatar.getAttribute('data-entity-id');
                    if (enemyId && enemyId !== 'player') {
                        playCard(card.instanceId, enemyId);
                        return;
                    }
                }
                // Also check by distance to entity bounds
                const { entityBounds } = state;
                for (const [id, rect] of Object.entries(entityBounds)) {
                    if (id === 'player') continue;
                    const cx = rect.left + rect.width / 2;
                    const cy = rect.top + rect.height / 2;
                    const dist = Math.hypot(cx - ev.clientX, cy - ev.clientY);
                    if (dist < (rect.width / 2) + 25) {
                        playCard(card.instanceId, id);
                        return;
                    }
                }
            } else {
                // Self/AllEnemies: release above the hand area to play
                if (ev.clientY < window.innerHeight - 250) {
                    playCard(card.instanceId);
                    return;
                }
            }

            state.resetDragState();
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }, [canPlay, isDraggable, card.instanceId, card.target, isTargetingMode, refreshEnemyBounds, setDragState, playCard, resetDragState]);

    // ==========================================
    // TOUCH: Same split behavior
    // ==========================================

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        if (!canPlay) return;
        refreshEnemyBounds();

        const touch = e.touches[0];
        const rect = cardRef.current!.getBoundingClientRect();
        setDragState({
            isActive: true,
            isTouch: true,
            cardId: card.instanceId,
            targetType: card.target,
            startX: rect.left + rect.width / 2,
            startY: rect.top,
            currentX: touch.clientX,
            currentY: touch.clientY
        });
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (!isBeingTouched) return;
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

        if (isTargetingMode) {
            const el = document.elementFromPoint(touch.clientX, touch.clientY);
            const enemyAvatar = el?.closest('.entity-avatar') as HTMLElement | null;
            if (enemyAvatar) {
                const enemyId = enemyAvatar.getAttribute('data-entity-id');
                if (enemyId && enemyId !== 'player') {
                    playCard(card.instanceId, enemyId);
                    return;
                }
            }
        } else {
            if (touch.clientY < window.innerHeight - 250) {
                playCard(card.instanceId);
                return;
            }
        }

        resetDragState();
    };

    // --- Prevent native drag (we use pointer events now) ---
    const handleDragStart = (e: React.DragEvent) => e.preventDefault();

    // --- Compute styles ---
    const combinedStyle: React.CSSProperties = { ...style };
    const isAnyDragActive = dragState.isActive && !dragState.isTouch;

    if (isAnyDragActive && isThisActive && !isTargetingMode) {
        // Self/AoE card-drag: card follows cursor
        const dx = dragState.currentX - dragState.startX;
        const dy = dragState.currentY - dragState.startY;
        combinedStyle.transform = `translate(${dx}px, ${dy}px) translateY(var(--card-hover-lift)) rotate(0deg) scale(1.05)`;
        combinedStyle.transition = 'none';
        combinedStyle.zIndex = 9999;
        combinedStyle.pointerEvents = 'none'; // Prevent :hover from fighting the drag transform
        combinedStyle.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.8)';
    } else if (isAnyDragActive && !isThisActive) {
        // Other cards: transparent to pointer events during any drag
        combinedStyle.pointerEvents = 'none';
    }

    const cardClasses = [
        'card',
        canPlay ? 'playable' : 'unplayable',
        `type-${card.type.toLowerCase()}`,
        card.isHeroCard ? 'hero-card' : '',
        isBeingTouched ? 'is-dragging' : '',
        isThisActive && isTargetingMode ? 'is-targeting' : '',
    ].filter(Boolean).join(' ');

    return (
        <div
            ref={cardRef}
            className={cardClasses}
            onMouseDown={handleMouseDown}
            onDragStart={handleDragStart}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={combinedStyle}
        >
            <div className="card-cost">{card.cost}</div>
            <div className="card-name">{card.name}</div>
            {(card.imageUrl || card.imageId) ? (
                <div className="card-artwork-wrap">
                    <img src={card.imageUrl || `/assets/cards/${card.imageId}.png`} className="card-artwork" alt={card.name} />
                    <div className="card-type-badge">{card.type}</div>
                </div>
            ) : (
                <div className="card-artwork-placeholder" />
            )}
            <div className="card-desc">{card.description}</div>
        </div>
    );
}
