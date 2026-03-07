import { Shield } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { STATUS_REGISTRY } from '../../data/statusEffects';
import './TopBar.css';

export function TopBar() {
    const { player, floor } = useGameStore(state => ({
        player: state.player,
        floor: state.floor,
    }));

    const hpPct = (player.hp / player.maxHp) * 100;

    return (
        <div className="topbar-container">
            <div className="topbar-section">
                <div className="player-hp-inline">
                    <div className="player-hp-bar-bg">
                        <div className="player-hp-bar-fill" style={{ width: `${hpPct}%` }} />
                        <span className="player-hp-text">{player.hp}/{player.maxHp}</span>
                    </div>
                </div>
                {player.block > 0 && (
                    <div className="player-block-badge">
                        <Shield size={12} /> {player.block}
                    </div>
                )}
                {player.statuses.map(status => {
                    const def = STATUS_REGISTRY[status.id];
                    return (
                        <div
                            key={status.id}
                            className={`player-status-pip ${def?.type === 'Debuff' ? 'debuff' : 'buff'}`}
                            title={`${def?.name}: ${status.amount}`}
                        >
                            {def?.icon}{status.amount}
                        </div>
                    );
                })}
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
