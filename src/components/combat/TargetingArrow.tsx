import { useGameStore } from '../../store/gameStore';
import { Sparkles } from 'lucide-react';
import './TargetingArrow.css';

export function TargetingArrow() {
    const { dragState, entityBounds, hand } = useGameStore(state => ({
        dragState: state.dragState,
        entityBounds: state.entityBounds,
        hand: state.hand
    }));

    // Only show targeting arrow for enemy-targeted cards
    if (!dragState.isActive || dragState.targetType !== 'Enemy') return null;

    const startX = dragState.startX;
    const startY = dragState.startY;
    const endX = dragState.currentX;
    const endY = dragState.currentY;

    const pathD = `M ${startX} ${startY} L ${endX} ${endY}`;

    // --- Hover Target Detection ---
    let isValidTarget = false;

    if (dragState.targetType === 'Enemy') {
        Object.entries(entityBounds).forEach(([_id, rect]) => {
            // Calculate center of the entity panel
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            // Calculate distance from cursor to center
            const dist = Math.hypot(centerX - dragState.currentX, centerY - dragState.currentY);

            // M-5: Unified hover radius matching EntityPanel
            const hoverRadius = (rect.width / 2) + 25;

            if (dist < hoverRadius) {
                isValidTarget = true;
            }
        });
    } else {
        // Self or AllEnemies targets just need to be dragged high enough (above the bottom 250px UI zone)
        if (dragState.currentY < window.innerHeight - 250) {
            isValidTarget = true;
        }
    }

    const draggedCard = hand.find(c => c.instanceId === dragState.cardId);

    let validColor = 'var(--color-accent-red)'; // Default Damage red
    if (draggedCard && draggedCard.effects.length > 0) {
        const primaryEffect = draggedCard.effects[0].type;
        if (primaryEffect === 'Block') {
            validColor = '#00d4ff'; // Shield Cyan
        } else if (primaryEffect === 'ApplyStatus') {
            validColor = '#39ff14'; // Buff Neon Green
        }
    }

    const arrowColor = isValidTarget ? validColor : 'rgba(255, 255, 255, 0.4)';

    const angleRad = Math.atan2(endY - startY, endX - startX);
    const angleDeg = (angleRad * 180) / Math.PI;

    return (
        <svg className="targeting-arrow-svg">
            <defs>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            <path
                d={pathD}
                fill="none"
                stroke={arrowColor}
                strokeWidth="6"
                filter="url(#glow)"
                className="targeting-path"
            />
            {/* Arrow Head */}
            <g
                style={{
                    transform: `translate(${endX}px, ${endY}px) rotate(${angleDeg}deg)`,
                    transformOrigin: '0 0'
                }}
            >
                <Sparkles
                    color={arrowColor}
                    fill={arrowColor}
                    size={32}
                    x={-16}
                    y={-16}
                />
            </g>
        </svg>
    );
}
