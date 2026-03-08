import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Card } from '../../core/models';
import { Flame, Heart, Hammer, ArrowLeft, Check } from 'lucide-react';
import { eightiesIcon } from '../ui/EightiesIcons';
import { TopBar } from '../ui/TopBar';
import './RestSiteView.css';

type RestPhase = 'choose' | 'smithing' | 'done';

export function RestSiteView() {
    const { player, masterDeck, restHeal, restUpgrade, dismissNodeEvent } = useGameStore(state => ({
        player: state.player,
        masterDeck: state.masterDeck,
        restHeal: state.restHeal,
        restUpgrade: state.restUpgrade,
        dismissNodeEvent: state.dismissNodeEvent,
    }));

    const [phase, setPhase] = useState<RestPhase>('choose');
    const [resultText, setResultText] = useState('');

    const healAmount = Math.floor(player.maxHp * 0.3);

    const handleRest = () => {
        setResultText(`Feeling fresh. +${healAmount} HP.`);
        restHeal();
        setPhase('done');
    };

    const handleSmithSelect = () => {
        setPhase('smithing');
    };

    const handleUpgradeCard = (card: Card) => {
        restUpgrade(card.instanceId);
        setResultText(`${card.name}+ forged. Now it hits different.`);
        setPhase('done');
    };

    const handleContinue = () => {
        dismissNodeEvent();
    };

    // Cards that can be upgraded (not already upgraded)
    const upgradableCards = masterDeck.filter(c => !c.upgraded);

    return (
        <div className="rest-container">
            <TopBar />

            <div className="rest-content">
                {/* Campfire area */}
                <div className="rest-campfire">
                    <div className="rest-campfire-glow" />
                    <Flame size={48} className="rest-flame-icon" />
                    <img src={eightiesIcon(1)} alt="" className="rest-deco-icon rest-deco-left" />
                    <img src={eightiesIcon(5)} alt="" className="rest-deco-icon rest-deco-right" />
                </div>

                <h1 className="rest-title">The Neon Dims</h1>
                <p className="rest-subtitle">A moment of quiet in the static.</p>

                {/* HP Display */}
                <div className="rest-hp-display">
                    <Heart size={14} className="rest-hp-icon" />
                    <span>HP: {player.hp}/{player.maxHp}</span>
                </div>

                {/* Choice Phase */}
                {phase === 'choose' && (
                    <div className="rest-choices">
                        <button className="rest-choice rest-choice-heal" onClick={handleRest}>
                            <div className="rest-choice-icon-wrap">
                                <Heart size={24} />
                            </div>
                            <div className="rest-choice-text">
                                <span className="rest-choice-label">Catch Some Z's</span>
                                <span className="rest-choice-desc">Crash out. Heal {healAmount} HP.</span>
                            </div>
                        </button>

                        <button className="rest-choice rest-choice-smith" onClick={handleSmithSelect}>
                            <div className="rest-choice-icon-wrap">
                                <Hammer size={24} />
                            </div>
                            <div className="rest-choice-text">
                                <span className="rest-choice-label">Hit the Forge</span>
                                <span className="rest-choice-desc">Sharpen your steel. Upgrade one card.</span>
                            </div>
                        </button>
                    </div>
                )}

                {/* Smithing Phase: card selection */}
                {phase === 'smithing' && (
                    <div className="rest-smith-panel">
                        <div className="rest-smith-header">
                            <button className="rest-back-btn" onClick={() => setPhase('choose')}>
                                <ArrowLeft size={16} />
                                Back
                            </button>
                            <span className="rest-smith-title">Pick a card to upgrade</span>
                        </div>

                        {upgradableCards.length === 0 ? (
                            <p className="rest-no-cards">All cards already upgraded. Nice.</p>
                        ) : (
                            <div className="rest-card-grid">
                                {upgradableCards.map(card => (
                                    <button
                                        key={card.instanceId}
                                        className={`rest-card-option type-${card.type.toLowerCase()}${card.isHeroCard ? ' hero' : ''}`}
                                        onClick={() => handleUpgradeCard(card)}
                                    >
                                        <div className="rest-card-cost">{card.cost}</div>
                                        <div className="rest-card-name">{card.name}</div>
                                        {(card.imageUrl || card.imageId) && (
                                            <div className="rest-card-art-wrap">
                                                <img
                                                    src={card.imageUrl || `/assets/cards/${card.imageId}.png`}
                                                    alt={card.name}
                                                    className="rest-card-art"
                                                />
                                            </div>
                                        )}
                                        <div className="rest-card-desc">{card.description}</div>
                                        <div className="rest-card-upgrade-hint">
                                            <Hammer size={10} />
                                            Upgrade
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Result Phase */}
                {phase === 'done' && (
                    <div className="rest-result">
                        <div className="rest-result-icon">
                            <Check size={32} />
                        </div>
                        <p className="rest-result-text">{resultText}</p>
                        <button className="rest-continue-btn" onClick={handleContinue}>
                            Continue
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
