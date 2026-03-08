import { useGameStore } from '../../store/gameStore';
import './TopBar.css';

export function TopBar() {
    const { player, floor } = useGameStore(state => ({
        player: state.player,
        floor: state.floor,
    }));

    return (
        <div className="topbar-container">
            <div className="topbar-section" />

            <div className="topbar-section center">
                <span className="floor-text">Floor {floor}</span>
            </div>

            <div className="topbar-section right">
                <span className="stat gold">💰 {player.gold}</span>
            </div>
        </div>
    );
}
