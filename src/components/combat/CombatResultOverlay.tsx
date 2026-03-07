import { useGameStore } from '../../store/gameStore';
import { Trophy, Skull } from 'lucide-react';
import './CombatResultOverlay.css';

export function CombatResultOverlay() {
    const { combatResult, goldReward, floor, seed, initializeRun, continueCombatResult } = useGameStore((state) => ({
        combatResult: state.combatResult,
        goldReward: state.goldReward,
        floor: state.floor,
        seed: state.seed,
        initializeRun: state.initializeRun,
        continueCombatResult: state.continueCombatResult
    }));

    if (!combatResult) return null;

    const isVictory = combatResult === 'victory';

    const handleNewRun = () => {
        const newSeed = Math.random().toString(36).substring(7);
        initializeRun(newSeed);
    };

    return (
        <div className="combat-result-backdrop">
            <div className={`combat-result-card ${combatResult}`}>
                {isVictory ? (
                    <Trophy size={64} className="combat-result-icon victory" />
                ) : (
                    <Skull size={64} className="combat-result-icon defeat" />
                )}

                <h1 className={`combat-result-title ${combatResult}`}>
                    {isVictory ? 'VICTORY' : 'DEFEAT'}
                </h1>

                <p className="combat-result-stats">
                    {isVictory ? (
                        <>Gold earned: <strong className="combat-result-gold">{goldReward}</strong></>
                    ) : (
                        <>Floor reached: <strong>{floor}</strong></>
                    )}
                </p>

                <div className="combat-result-actions">
                    {isVictory ? (
                        <button
                            className="combat-result-btn primary victory"
                            onClick={continueCombatResult}
                        >
                            Continue
                        </button>
                    ) : (
                        <>
                            <button
                                className="combat-result-btn primary defeat"
                                onClick={handleNewRun}
                            >
                                New Run
                            </button>
                            <button
                                className="combat-result-btn secondary"
                                onClick={() => initializeRun(seed)}
                            >
                                Retry Seed
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
