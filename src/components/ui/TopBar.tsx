import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { X } from 'lucide-react';
import './TopBar.css';

export function TopBar() {
    const { player, floor, abandonRun } = useGameStore(state => ({
        player: state.player,
        floor: state.floor,
        abandonRun: state.abandonRun,
    }));
    const [confirmAbandon, setConfirmAbandon] = useState(false);

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
                    <button className="abandon-btn" onClick={() => setConfirmAbandon(true)} title="Abandon run">
                        <X size={16} />
                    </button>
                )}
            </div>

            <div className="topbar-section center">
                <span className="floor-text">Floor {floor}</span>
            </div>

            <div className="topbar-section right">
                <span className="stat gold">💰 {player.gold}</span>
            </div>
        </div>
    );
}
