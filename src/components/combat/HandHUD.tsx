import { useGameStore } from '../../store/gameStore';
import { Card } from '../../core/models';
import './HandHUD.css';

export function HandHUD() {
    const { hand, player } = useGameStore();

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, card: Card) => {
        if (player.energy < card.cost) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData('application/json', JSON.stringify({
            instanceId: card.instanceId,
            target: card.target
        }));
        e.dataTransfer.effectAllowed = 'move';
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
                        style={{
                            transform: `translateY(${translateY}px) rotate(${rotation}deg)`,
                            zIndex: 10 + index
                        }}
                    >
                        <div className="card-cost">{card.cost}</div>
                        <div className="card-name">{card.name}</div>
                        <div className="card-type">{card.type}</div>
                        <div className="card-desc">{card.description}</div>
                    </div>
                );
            })}
        </div>
    );
}
