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
                // Calculate dynamic fanning
                const totalCards = hand.length;
                const middleIndex = (totalCards - 1) / 2;
                const offset = index - middleIndex;
                const rotation = offset * 5; // 5 degrees per card
                const translateY = Math.abs(offset) * 10; // Arching effect

                const canPlay = player.energy >= card.cost;

                // Convert pure Flexbox to bounded Absolute positioning to enable transition easing
                const cardWidth = window.innerWidth <= 768 ? 70 : 120; // smaller spacing on mobile
                const cardLeftOffset = `calc(50% + ${offset * cardWidth}px - ${cardWidth / 2}px)`;

                return (
                    <div
                        key={card.instanceId}
                        className="card-draw-anim"
                        style={{
                            position: 'absolute',
                            left: cardLeftOffset,
                            bottom: 0,
                            transition: 'left 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), z-index 0s',
                            zIndex: 10 + index,
                            animationDelay: `${index * 0.1}s`
                        }}
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
