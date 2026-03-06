import { useGameStore } from '../../store/gameStore';
import { Card } from '../../core/models';
import './HandHUD.css';

export function HandHUD() {
    const { hand, playCard, player } = useGameStore();

    const handleCardClick = (card: Card) => {
        // Basic auto-target enemies[0] for MVP testing if it's an attack
        const state = useGameStore.getState();
        const targetId = card.target === 'Enemy' && state.enemies.length > 0 ? state.enemies[0].id : undefined;
        playCard(card.instanceId, targetId);
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
                        style={{
                            transform: `translateY(${translateY}px) rotate(${rotation}deg)`,
                            zIndex: 10 + index
                        }}
                        onClick={() => handleCardClick(card)}
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
