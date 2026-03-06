import { useGameStore } from './store/gameStore';
import { CombatView } from './components/combat/CombatView';
import { MapView } from './components/map/MapView';
import { createCardInstance } from './data/cards';
import './App.css';

function App() {
    const { inCombat, initializeRun, seed } = useGameStore();

    const handleStartRun = () => {
        initializeRun('alpha_test_seed');

        // Pre-populate mastering deck for MVP
        useGameStore.setState({
            masterDeck: [
                createCardInstance('strike_red'),
                createCardInstance('strike_red'),
                createCardInstance('strike_red'),
                createCardInstance('strike_red'),
                createCardInstance('defend_red'),
                createCardInstance('defend_red'),
                createCardInstance('defend_red'),
                createCardInstance('defend_red'),
                createCardInstance('bash')
            ]
        });
    };

    if (inCombat) {
        return <CombatView />;
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
            <button
                style={{ padding: '1rem 2rem', fontSize: '1.2rem', marginTop: '2rem', cursor: 'pointer', fontFamily: 'var(--font-family-display)' }}
                onClick={handleStartRun}
            >
                Start New Run
            </button>
        </div>
    );
}

export default App;
