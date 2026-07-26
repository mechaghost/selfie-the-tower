import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { X, Layers } from 'lucide-react';
import './TopBar.css';

const FINAL_FLOOR = 9; // 8 map floors + the boss

export function TopBar() {
    const { player, floor, deckSize, abandonRun } = useGameStore(state => ({
        player: state.player,
        floor: state.floor,
        deckSize: state.masterDeck.length,
        abandonRun: state.abandonRun,
    }));
    const [confirmAbandon, setConfirmAbandon] = useState(false);

    const hpPct = player.maxHp > 0 ? (player.hp / player.maxHp) * 100 : 0;

    return (
        <div className="topbar-container">
            <div className="topbar-section">
                {confirmAbandon ? (
                    <div className="abandon-confirm">
                        <span className="abandon-confirm-text">Quit run?</span>
                        <button className="abandon-yes" onClick={abandonRun}>Yes</button>
                        <button className="abandon-no" onClick={() => setConfirmAbandon(false)}>No</button>
                    </div>
                ) : (
                    <>
                        <button className="abandon-btn" onClick={() => setConfirmAbandon(true)} title="Abandon run">
                            <X size={16} />
                        </button>
                        {player.maxHp > 0 && (
                            <div className="player-hp-inline" title={`${player.name || 'You'}: ${player.hp}/${player.maxHp} HP`}>
                                <div className="player-hp-bar-bg">
                                    <div className="player-hp-bar-fill" style={{ width: `${hpPct}%` }} />
                                </div>
                                <div className="player-hp-text">{player.hp}/{player.maxHp}</div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="topbar-section center">
                <span className="floor-text">Floor {floor}<span className="floor-total"> / {FINAL_FLOOR}</span></span>
            </div>

            <div className="topbar-section right">
                <span className="stat deck" title="Cards in your deck">
                    <Layers size={14} /> {deckSize}
                </span>
                <span className="stat gold">💰 {player.gold}</span>
            </div>
        </div>
    );
}
