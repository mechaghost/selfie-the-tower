import { useGameStore } from '../../store/gameStore';
import { TopBar } from '../ui/TopBar';
import { EntityPanel } from './EntityPanel';
import { HandHUD } from './HandHUD';
import { TargetingArrow } from './TargetingArrow';
import './CombatView.css';

export function CombatView() {
    const { player, enemies, endTurn, energy, maxEnergy, playCard } = useGameStore((state) => ({
        player: state.player,
        enemies: state.enemies,
        endTurn: state.endTurn,
        energy: state.player.energy,
        maxEnergy: state.player.maxEnergy,
        playCard: state.playCard
    }));

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
            <TopBar />

            <div className="entities-container">
                <div className="player-side">
                    <EntityPanel entity={player} isPlayer={true} />
                </div>

                <div className="enemy-side">
                    {enemies.map((enemy) => (
                        <EntityPanel key={enemy.id} entity={enemy} isPlayer={false} />
                    ))}
                </div>
            </div>

            <div className="energy-hud">
                <div className="energy-orb">
                    {energy} / {maxEnergy}
                </div>
            </div>

            <HandHUD />
            <TargetingArrow />

            <button className="end-turn-button" onClick={endTurn}>
                End Turn
            </button>
        </div>
    );
}
