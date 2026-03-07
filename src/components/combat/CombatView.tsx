import { useGameStore } from '../../store/gameStore';
import { TopBar } from '../ui/TopBar';
import { EntityPanel } from './EntityPanel';
import { HandHUD } from './HandHUD';
import { TargetingArrow } from './TargetingArrow';
import './CombatView.css';

export function CombatView() {
    const {
        player, enemies, endTurn, energy, maxEnergy, playCard,
        drawPile, discardPile, hand, isResolving
    } = useGameStore((state) => ({
        player: state.player,
        enemies: state.enemies,
        endTurn: state.endTurn,
        energy: state.player.energy,
        maxEnergy: state.player.maxEnergy,
        playCard: state.playCard,
        drawPile: state.drawPile,
        discardPile: state.discardPile,
        hand: state.hand,
        isResolving: state.isResolving
    }));

    const isEnemyTurn = hand.length === 0 && isResolving;

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            if (data.target !== 'Enemy') {
                playCard(data.instanceId);
            }
        } catch (err) {
            // Ignore invalid drops
        }
    };

    return (
        <div
            className="combat-stage"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {/* Background particle layer */}
            <div className="combat-particles" />

            <TopBar />

            <div className="entities-container">
                {/* Compact player presence for animations/floating text */}
                <div className="player-presence">
                    <EntityPanel entity={player} isPlayer={true} />
                </div>

                {/* Enemy zone */}
                <div className="enemy-zone">
                    {enemies.map((enemy) => (
                        <EntityPanel key={enemy.id} entity={enemy} isPlayer={false} />
                    ))}
                </div>
            </div>

            {/* Turn phase indicator */}
            {isEnemyTurn && (
                <div className="turn-phase-banner enemy-turn">
                    ENEMY TURN
                </div>
            )}

            <div className="table-controls">
                <div className="controls-left">
                    <div className="energy-badge">
                        {energy} / {maxEnergy}
                    </div>
                    <div className="pile-badge draw">
                        {drawPile.length}
                    </div>
                </div>

                <div className="controls-right">
                    <div className="pile-badge discard">
                        {discardPile.length}
                    </div>
                    <button className="end-turn-button" onClick={endTurn} disabled={isEnemyTurn}>
                        End Turn
                    </button>
                </div>
            </div>

            <div className={`deck-table ${isEnemyTurn ? 'disabled' : ''}`}>
                <HandHUD />
            </div>

            <TargetingArrow />
        </div>
    );
}
