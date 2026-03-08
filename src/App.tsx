import { useGameStore } from './store/gameStore';
import { CombatView } from './components/combat/CombatView';
import { MapView } from './components/map/MapView';
import { GameOverView } from './components/ui/GameOverView';
import { SelfieCaptureScreen } from './components/ugc/SelfieCaptureScreen';
import { CharacterRevealScreen } from './components/ugc/CharacterRevealScreen';
import './App.css';

function App() {
    const { inCombat, seed, isGameOver, ugcPhase, startSelfieCapture } = useGameStore();

    if (import.meta.env.DEV) {
        (window as any).__gameStore = useGameStore; // eslint-disable-line
    }

    if (inCombat) return <CombatView />;
    if (isGameOver) return <GameOverView />;
    if (seed) return <div className="app-container"><MapView /></div>;

    if (ugcPhase === 'capture' || ugcPhase === 'generating') return <SelfieCaptureScreen />;
    if (ugcPhase === 'reveal') return <CharacterRevealScreen />;

    return (
        <div className="app-container">
            <h1>Selfie the Spire</h1>
            <p>Neon Roguelike Deckbuilder</p>
            <button className="start-button hero-button" onClick={startSelfieCapture}>
                Take a Selfie to Play
            </button>
        </div>
    );
}

export default App;
