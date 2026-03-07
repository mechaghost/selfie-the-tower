import { useGameStore } from '../../store/gameStore';
import { TopBar } from '../ui/TopBar';
import { EntityPanel } from './EntityPanel';
import { HandHUD } from './HandHUD';
import { TargetingArrow } from './TargetingArrow';
import { CombatResultOverlay } from './CombatResultOverlay';
import './CombatView.css';

export function CombatView() {
    const {
        player, enemies, endTurn, energy, isPlayerTurn, combatResult
    } = useGameStore((state) => ({
        player: state.player,
        enemies: state.enemies,
        endTurn: state.endTurn,
        energy: state.player.energy,
        isPlayerTurn: state.isPlayerTurn,
        combatResult: state.combatResult
    }));

    const isDisabled = !isPlayerTurn || combatResult !== null;

    return (
        <div className="combat-stage">
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
            {!isPlayerTurn && !combatResult && (
                <div className="turn-phase-banner enemy-turn">
                    ENEMY TURN
                </div>
            )}

            <div className="table-controls">
                <div className="controls-left">
                    <div className="energy-orb">
                        {energy}
                    </div>
                </div>

                <div className="controls-right">
                    <button className="end-turn-button" onClick={endTurn} disabled={isDisabled}>
                        End Turn
                    </button>
                </div>
            </div>

            <div className={`deck-table ${isDisabled ? 'disabled' : ''}`}>
                <HandHUD />
            </div>

            <TargetingArrow />
            <CombatResultOverlay />
        </div>
    );
}
