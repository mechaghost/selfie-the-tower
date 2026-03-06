import { useGameStore } from '../../store/gameStore';
import './TargetingArrow.css';

export function TargetingArrow() {
    const dragState = useGameStore(state => state.dragState);

    if (!dragState.isActive) return null;

    // Calculate Bezier curve control points to make an arching arrow
    const startX = dragState.startX;
    const startY = dragState.startY;
    const endX = dragState.currentX;
    const endY = dragState.currentY;

    // Control point 1 (pulls curve up from the card)
    const cp1x = startX;
    const cp1y = startY - 200;

    // Control point 2 (pulls curve towards target horizontally)
    const cp2x = endX;
    const cp2y = startY - 200;

    const pathD = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;

    // Calculate arrow head rotation based on exact mouse velocity (current vs previous frame)
    const dx = dragState.currentX - dragState.prevX;
    const dy = dragState.currentY - dragState.prevY;

    // Only update rotation if the mouse actually moved, otherwise keep pointing the last known direction
    // If it's the very first frame of dragging (dx/dy = 0), point straight up as default
    const angleRad = (dx === 0 && dy === 0) ? -Math.PI / 2 : Math.atan2(dy, dx);
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
                stroke="var(--color-accent-red)"
                strokeWidth="6"
                filter="url(#glow)"
                className="targeting-path"
            />
            {/* Arrow Head */}
            <polygon
                points="-24,-12 0,0 -24,12"
                fill="var(--color-accent-red)"
                style={{
                    transform: `translate(${endX}px, ${endY}px) rotate(${angleDeg}deg)`,
                    transformOrigin: '0 0'
                }}
            />
        </svg>
    );
}
