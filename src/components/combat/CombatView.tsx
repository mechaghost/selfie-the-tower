import { useState, useCallback, useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Enemy } from '../../core/models';
import { TopBar } from '../ui/TopBar';
import { EntityPanel, describeIntent, describeStatuses } from './EntityPanel';
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

    const [inspectedEnemyId, setInspectedEnemyId] = useState<string | null>(null);

    const handleStageClick = useCallback(() => {
        setInspectedEnemyId(null);
    }, []);

    const handleEnemyInspect = useCallback((enemyId: string) => {
        setInspectedEnemyId(prev => prev === enemyId ? null : enemyId);
    }, []);

    const inspectedEnemy = useMemo(() =>
        inspectedEnemyId ? enemies.find(e => e.id === inspectedEnemyId) as Enemy | undefined : undefined,
        [inspectedEnemyId, enemies]
    );

    return (
        <div className="combat-stage" onClick={handleStageClick}>
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
                        <EntityPanel
                            key={enemy.id}
                            entity={enemy}
                            isPlayer={false}
                            inspectedEnemyId={inspectedEnemyId}
                            onInspect={handleEnemyInspect}
                        />
                    ))}
                </div>
            </div>

            {/* Enemy inspect tooltip — rendered outside overflow:hidden container */}
            {inspectedEnemy && (
                <div className="enemy-info-tooltip">
                    <p className="enemy-info-name">{inspectedEnemy.name}</p>
                    <p className="enemy-info-intent">{describeIntent(inspectedEnemy.intent)}</p>
                    {inspectedEnemy.block > 0 && <p className="enemy-info-line">Block: {inspectedEnemy.block}</p>}
                    {describeStatuses(inspectedEnemy.statuses).map((line, i) => (
                        <p key={i} className="enemy-info-line">{line}</p>
                    ))}
                    {inspectedEnemy.statuses.length === 0 && inspectedEnemy.block === 0 && (
                        <p className="enemy-info-line">No active effects</p>
                    )}
                </div>
            )}

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
