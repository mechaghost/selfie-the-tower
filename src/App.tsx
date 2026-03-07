import { useGameStore } from './store/gameStore';
import { CombatView } from './components/combat/CombatView';
import { MapView } from './components/map/MapView';
import { GameOverView } from './components/ui/GameOverView';
import './App.css';

function App() {
    const { inCombat, initializeRun, seed, isGameOver } = useGameStore();

    // @ts-ignore
    window.__gameStore = useGameStore;

    const handleStartRun = () => {
        initializeRun('alpha_test_seed');
    };

    if (inCombat) {
        return <CombatView />;
    }

    if (isGameOver) {
        return <GameOverView />;
    }

    if (seed) {
        return (
            <div className="app-container">
                <MapView />
            </div>
        );
    }

    return (
        <div className="app-container">
            <h1>Slay the Tower</h1>
            <p>Roguelike Deckbuilder</p>
            <button className="start-button" onClick={handleStartRun}>
                Start New Run
            </button>
        </div>
    );
}

export default App;
