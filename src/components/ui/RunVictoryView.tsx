import { useGameStore } from '../../store/gameStore';
import { Crown, Camera, RotateCcw } from 'lucide-react';
import './RunVictoryView.css';

export function RunVictoryView() {
    const { floor, player, deckSize, abandonRun, initializeRun } = useGameStore(state => ({
        floor: state.floor,
        player: state.player,
        deckSize: state.masterDeck.length,
        abandonRun: state.abandonRun,
        initializeRun: state.initializeRun,
    }));

    const handleQuickRun = () => {
        const newSeed = Math.random().toString(36).substring(7);
        initializeRun(newSeed);
    };

    return (
        <div className="run-victory-container">
            <div className="run-victory-scanlines" />
            <div className="run-victory-glow" />

            {/* Neon confetti shards */}
            <div className="rv-confetti">
                {Array.from({ length: 14 }, (_, i) => (
                    <span key={i} className={`rv-shard rv-shard-${i % 5}`} style={{ '--i': i } as React.CSSProperties} />
                ))}
            </div>

            <div className="run-victory-content">
                <Crown size={64} className="run-victory-crown" />

                {player.portraitUrl && (
                    <div className="run-victory-portrait">
                        <img src={player.portraitUrl} alt={player.name} />
                    </div>
                )}

                <h1 className="run-victory-title">
                    <span>Spire</span> <span className="rv-cleared">Cleared</span>
                </h1>
                <p className="run-victory-sub">
                    {player.name ? `${player.name} topped the tower.` : 'You topped the tower.'} The streets sing your name.
                </p>

                <div className="run-victory-stats">
                    <div className="rv-stat">
                        <span className="rv-stat-value">{floor}</span>
                        <span className="rv-stat-label">Floors</span>
                    </div>
                    <div className="rv-stat">
                        <span className="rv-stat-value amber">{player.gold}</span>
                        <span className="rv-stat-label">Gold</span>
                    </div>
                    <div className="rv-stat">
                        <span className="rv-stat-value violet">{deckSize}</span>
                        <span className="rv-stat-label">Cards</span>
                    </div>
                    <div className="rv-stat">
                        <span className="rv-stat-value red">{player.hp}/{player.maxHp}</span>
                        <span className="rv-stat-label">HP Left</span>
                    </div>
                </div>

                <div className="run-victory-actions">
                    <button className="rv-btn primary" onClick={abandonRun}>
                        <Camera size={18} />
                        New Selfie, New Legend
                    </button>
                    <button className="rv-btn secondary" onClick={handleQuickRun}>
                        <RotateCcw size={16} />
                        Quick Run
                    </button>
                </div>
            </div>
        </div>
    );
}
