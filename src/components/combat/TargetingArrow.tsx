import { useGameStore } from '../../store/gameStore';
import './TargetingArrow.css';

export function TargetingArrow() {
    const { dragState, entityBounds } = useGameStore(state => ({
        dragState: state.dragState,
        entityBounds: state.entityBounds
    }));

    if (!dragState.isActive) return null;

    // Calculate Bezier curve control points to make an arching arrow
    const startX = dragState.startX;
    const startY = dragState.startY;
    let endX = dragState.currentX;
    let endY = dragState.currentY;

    // --- Magnetic Snapping Logic ---
    const SNAP_RADIUS = 150; // pixels
    let minDistance = Infinity;
    let snappedTarget = null;

    Object.entries(entityBounds).forEach(([id, rect]) => {
        // Calculate center of the entity panel
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Calculate distance from cursor to center
        const dist = Math.hypot(centerX - dragState.currentX, centerY - dragState.currentY);

        if (dist < SNAP_RADIUS && dist < minDistance) {
            minDistance = dist;
            snappedTarget = { x: centerX, y: centerY };
        }
    });

    // If we're close enough to a target, snap the arrow head directly to its center
    if (snappedTarget) {
        endX = (snappedTarget as any).x;
        endY = (snappedTarget as any).y;
    }

    // Control point 1 (pulls curve up from the card)
    const cp1x = startX;
    const cp1y = startY - 200;

    // Control point 2 (pulls curve towards target horizontally)
    const cp2x = endX;
    const cp2y = startY - 200;

    const pathD = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;

    // Calculate arrow head rotation
    // We estimate the tangent at the end of the bezier curve (t=1). 
    // Deriv: 3*(1-t)^2*(P1-P0) + 6*(1-t)*t*(P2-P1) + 3*t^2*(P3-P2)
    // at t=1, direction is vector (P3 - P2), which is (end - cp2)
    const angleRad = Math.atan2(endY - cp2y, endX - cp2x);
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
