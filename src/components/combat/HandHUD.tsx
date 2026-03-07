import { useGameStore } from '../../store/gameStore';
import { CardItem } from '../ui/CardItem';
import '../ui/CardItem.css';

export function HandHUD() {
    const { hand, player, playingCards } = useGameStore(state => ({
        hand: state.hand,
        player: state.player,
        playingCards: state.playingCards
    }));

    return (
        <div className="hand-container">
            {hand.map((card, index) => {
                const totalCards = hand.length;
                const middleIndex = (totalCards - 1) / 2;
                const offset = index - middleIndex;
                const rotation = offset * 5;
                const translateY = Math.abs(offset) * 10;

                const canPlay = player.energy >= card.cost;

                return (
                    <div
                        key={card.instanceId}
                        className="card-slot card-draw-anim"
                        style={{
                            '--card-offset': offset,
                            zIndex: 10 + index,
                            animationDelay: `${index * 0.1}s`
                        } as React.CSSProperties}
                    >
                        <CardItem
                            card={card}
                            canPlay={canPlay}
                            isDraggable={true}
                            style={{
                                transform: `translateY(${translateY}px) rotate(${rotation}deg)`
                            }}
                        />
                    </div>
                );
            })}

            {playingCards.map((pc) => (
                <div key={pc.id} className="card-playing-wrapper">
                    <CardItem
                        card={pc.card}
                        canPlay={false}
                        isDraggable={false}
                    />
                </div>
            ))}
        </div>
    );
}
