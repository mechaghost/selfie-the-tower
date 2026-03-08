import { useGameStore } from '../../store/gameStore';
import { CardItem } from '../ui/CardItem';
import '../ui/CardItem.css';

export function HandHUD() {
    const { hand, player, playingCards } = useGameStore(state => ({
        hand: state.hand,
        player: state.player,
        playingCards: state.playingCards
    }));

    const totalCards = hand.length;
    const totalRows = Math.ceil(totalCards / 3);

    return (
        <div className="hand-container" style={{ '--total-rows': totalRows } as React.CSSProperties}>
            {hand.map((card, index) => {
                const middleIndex = (totalCards - 1) / 2;
                const offset = index - middleIndex;
                const rotation = offset * 5;
                const translateY = Math.abs(offset) * 10;

                // Per-row layout for mobile (3 columns, centered)
                const col = index % 3;
                const rowIndex = Math.floor(index / 3);
                const rowStart = rowIndex * 3;
                const rowLength = Math.min(3, totalCards - rowStart);
                const rowMiddle = (rowLength - 1) / 2;
                const rowFanOffset = col - rowMiddle;
                const rowOffset = col - (rowLength - 1) / 2;

                const canPlay = player.energy >= card.cost;

                return (
                    <div
                        key={card.instanceId}
                        className="card-slot card-draw-anim"
                        style={{
                            '--card-offset': offset,
                            '--row-offset': rowOffset,
                            '--row-index': rowIndex,
                            '--row-rotation': `${rowFanOffset * 8}deg`,
                            '--row-lift': `${Math.abs(rowFanOffset) * 8}px`,
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
