import { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { CardItem } from '../ui/CardItem';
import '../ui/CardItem.css';

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
    useEffect(() => {
        const mql = window.matchMedia('(max-width: 768px)');
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, []);
    return isMobile;
}

export function HandHUD() {
    const { hand, player, playingCards } = useGameStore(state => ({
        hand: state.hand,
        player: state.player,
        playingCards: state.playingCards
    }));
    const isMobile = useIsMobile();

    return (
        <div className="hand-container">
            {hand.map((card, index) => {
                const totalCards = hand.length;
                const middleIndex = (totalCards - 1) / 2;
                const offset = index - middleIndex;
                const rotation = offset * 5;
                const translateY = Math.abs(offset) * 10;

                const canPlay = player.energy >= card.cost;

                // Fix #16: Use reactive isMobile instead of window.innerWidth in render path
                const cardWidth = isMobile ? 70 : 100;
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
