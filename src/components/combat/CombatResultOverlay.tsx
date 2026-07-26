import { useGameStore } from '../../store/gameStore';
import { Trophy, Skull } from 'lucide-react';
import { CardItem } from '../ui/CardItem';
import './CombatResultOverlay.css';

export function CombatResultOverlay() {
    const { combatResult, goldReward, cardRewards, floor, seed, initializeRun, continueCombatResult, claimCardReward } = useGameStore((state) => ({
        combatResult: state.combatResult,
        goldReward: state.goldReward,
        cardRewards: state.cardRewards,
        floor: state.floor,
        seed: state.seed,
        initializeRun: state.initializeRun,
        continueCombatResult: state.continueCombatResult,
        claimCardReward: state.claimCardReward
    }));

    if (!combatResult) return null;

    const isVictory = combatResult === 'victory';
    const hasRewards = isVictory && cardRewards.length > 0;

    const handleNewRun = () => {
        const newSeed = Math.random().toString(36).substring(7);
        initializeRun(newSeed);
    };

    return (
        <div className="combat-result-backdrop">
            <div className={`combat-result-card ${combatResult}`}>
                {isVictory ? (
                    <Trophy size={48} className="combat-result-icon victory" />
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

                {hasRewards && (
                    <div className="reward-section">
                        <h2 className="reward-heading">Loot the remains</h2>
                        <p className="reward-hint">Tap a card to add it to your deck.</p>
                        <div className="reward-card-row">
                            {cardRewards.map((card, i) => (
                                <div
                                    key={card.instanceId}
                                    className="reward-card-slot"
                                    style={{ animationDelay: `${0.15 + i * 0.12}s` }}
                                    onClick={() => claimCardReward(card.instanceId)}
                                >
                                    <CardItem card={card} canPlay={true} isDraggable={false} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="combat-result-actions">
                    {isVictory ? (
                        <button
                            className={`combat-result-btn ${hasRewards ? 'secondary' : 'primary victory'}`}
                            onClick={continueCombatResult}
                        >
                            {hasRewards ? 'Skip — keep it lean' : 'Continue'}
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
