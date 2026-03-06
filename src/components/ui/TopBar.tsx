import { useGameStore } from '../../store/gameStore';
import { Shield, Heart, Zap } from 'lucide-react';
import './TopBar.css';

export function TopBar() {
    const { player, floor } = useGameStore();

    return (
        <div className="topbar-container">
            <div className="topbar-section player-stats">
                <div className="stat hp">
                    <Heart className="icon" size={20} />
                    <span>{player.hp} / {player.maxHp}</span>
                </div>
                <div className="stat gold">
                    <span className="gold-icon">💰</span>
                    <span>{player.gold}</span>
                </div>
            </div>

            <div className="topbar-section center">
                <span className="floor-text">Floor {floor}</span>
            </div>

            <div className="topbar-section right">
                {/* Future relic spacing */}
            </div>
        </div>
    );
}
