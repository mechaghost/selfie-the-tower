import { useGameStore } from '../../store/gameStore';
import { Card } from '../../core/models';
import { Crosshair, Users, User } from 'lucide-react';
import './HandHUD.css';

export function HandHUD() {
    const { hand, player, setDragState, resetDragState } = useGameStore();

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, card: Card) => {
        if (player.energy < card.cost) {
            e.preventDefault();
            return;
        }
        // Set generic data payload
        e.dataTransfer.setData('application/json', JSON.stringify({
            instanceId: card.instanceId,
            target: card.target
        }));
        e.dataTransfer.effectAllowed = 'move';

        // Custom Bezier Targeting for specific entities
        if (card.target === 'Enemy') {
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            // Origin point is the top-center of the physical card Div
            const startX = rect.left + rect.width / 2;
            const startY = rect.top;

            setDragState({
                isActive: true,
                cardId: card.instanceId,
                startX,
                startY,
                currentX: e.clientX,
                currentY: e.clientY
            });

            // Hide the native browser drag ghost image so we only see the SVG arrow
            const img = new Image();
            img.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
            e.dataTransfer.setDragImage(img, 0, 0);
        }
    };

    const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
        // e.clientX is 0 right before drop, so we ignore 0,0 to prevent the arrow snapping to top-left
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

    const getTargetIcon = (target: string) => {
        switch (target) {
            case 'Enemy': return <span title="Single Target" style={{ display: 'flex' }}><Crosshair size={14} /></span>;
            case 'AllEnemies': return <span title="Multi Target" style={{ display: 'flex' }}><Users size={14} /></span>;
            case 'Self': return <span title="Player Target" style={{ display: 'flex' }}><User size={14} /></span>;
            default: return null;
        }
    };

    return (
        <div className="hand-container">
            {hand.map((card, index) => {
                // Calculate dynamic fanning
                const totalCards = hand.length;
                const middleIndex = (totalCards - 1) / 2;
                const offset = index - middleIndex;
                const rotation = offset * 5; // 5 degrees per card
                const translateY = Math.abs(offset) * 10; // Arching effect

                const canPlay = player.energy >= card.cost;

                return (
                    <div
                        key={card.instanceId}
                        className={`card ${canPlay ? 'playable' : 'unplayable'} type-${card.type.toLowerCase()}`}
                        draggable={canPlay}
                        onDragStart={(e) => handleDragStart(e, card)}
                        onDrag={handleDrag}
                        onDragEnd={handleDragEnd}
                        style={{
                            transform: `translateY(${translateY}px) rotate(${rotation}deg)`,
                            zIndex: 10 + index
                        }}
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
            })}
        </div>
    );
}
