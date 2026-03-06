import { useGameStore } from '../../store/gameStore';
import { CardItem } from '../ui/CardItem';
import '../ui/CardItem.css';

export function HandHUD() {
    const { hand, player } = useGameStore(state => ({
        hand: state.hand,
        player: state.player
    }));

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
                    <CardItem
                        key={card.instanceId}
                        card={card}
                        canPlay={canPlay}
                        isDraggable={true}
                        style={{
                            transform: `translateY(${translateY}px) rotate(${rotation}deg)`,
                            zIndex: 10 + index
                        }}
                    />
                );
            })}
        </div>
    );
}
