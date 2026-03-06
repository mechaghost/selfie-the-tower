import { useGameStore } from '../../store/gameStore';
import { TopBar } from '../ui/TopBar';
import { EntityPanel } from './EntityPanel';
import { HandHUD } from './HandHUD';
import './CombatView.css';

export function CombatView() {
    const { player, enemies, endTurn, energy, maxEnergy } = useGameStore((state) => ({
        player: state.player,
        enemies: state.enemies,
        endTurn: state.endTurn,
        energy: state.player.energy,
        maxEnergy: state.player.maxEnergy
    }));

    return (
        <div className="combat-stage">
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

            <button className="end-turn-button" onClick={endTurn}>
                End Turn
            </button>
        </div>
    );
}
