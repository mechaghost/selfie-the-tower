import { useGameStore } from './store/gameStore';
import { CombatView } from './components/combat/CombatView';
import { MapView } from './components/map/MapView';
import { RestSiteView } from './components/map/RestSiteView';
import { ShopView } from './components/map/ShopView';
import { MysteryEventView } from './components/map/MysteryEventView';
import { GameOverView } from './components/ui/GameOverView';
import { SelfieCaptureScreen } from './components/ugc/SelfieCaptureScreen';
import { CharacterRevealScreen } from './components/ugc/CharacterRevealScreen';
import { Camera, Swords, ChevronDown } from 'lucide-react';
import { eightiesIcon } from './components/ui/EightiesIcons';
import './App.css';

const ENEMIES = [
    'neon_yakuza', 'dj_phantom', 'subway_wyrm', 'the_billboard',
    'chrome_bouncer', 'fire_escape_spider', 'vending_golem', 'neon_wraith',
];

const CARDS = [
    { id: 'neon_neon_strike', color: '#ff3860' },
    { id: 'concrete_slab_slam', color: '#ffb347' },
    { id: 'chrome_riptide_slam', color: '#00d4ff' },
    { id: 'smoke_backstab', color: '#39ff14' },
    { id: 'volt_chain_lightning', color: '#b967ff' },
];


function App() {
    const { inCombat, seed, isGameOver, ugcPhase, nodeEvent, startSelfieCapture } = useGameStore();

    if (import.meta.env.DEV) {
        (window as any).__gameStore = useGameStore; // eslint-disable-line
    }

    if (inCombat) return <CombatView />;
    if (isGameOver) return <GameOverView />;
    if (nodeEvent === 'rest') return <RestSiteView />;
    if (nodeEvent === 'shop') return <ShopView />;
    if (nodeEvent === 'mystery') return <MysteryEventView />;
    if (seed) return <div className="app-container"><MapView /></div>;

    if (ugcPhase === 'capture' || ugcPhase === 'generating') return <SelfieCaptureScreen />;
    if (ugcPhase === 'reveal') return <CharacterRevealScreen />;

    return (
        <div className="landing-page">
            {/* === HERO SECTION === */}
            <section className="landing-hero">
                <div className="landing-scanlines" />
                <div className="landing-hero-content">
                    <h1 className="landing-title">
                        <span className="landing-title-selfie">Selfie</span>
                        <span className="landing-title-the">the</span>
                        <span className="landing-title-spire">Spire</span>
                    </h1>
                    <p className="landing-tagline">Your face. Your hero. Your deck.</p>
                    <p className="landing-subtitle">
                        80's Magic turns your selfie into a street legend with custom cards and hand-painted artwork.
                        Battle through a neon-lit tower in this roguelike deckbuilder.
                    </p>
                    <button className="start-button hero-button landing-cta" onClick={startSelfieCapture}>
                        <Camera size={20} />
                        Take a Selfie to Play
                    </button>
                </div>
                <div className="landing-scroll-hint">
                    <ChevronDown size={24} />
                </div>
            </section>

            {/* === SHOWCASE SECTION === */}
            <section className="landing-showcase">
                <h2 className="landing-section-title">The Gauntlet Awaits</h2>
                <p className="landing-section-desc">Battle bizarre enemies through the neon-lit tower</p>

                <div className="landing-enemies">
                    {ENEMIES.map((enemy, i) => (
                        <div className="landing-enemy-card" key={enemy} style={{ animationDelay: `${i * 0.15}s` }}>
                            <img src={`/assets/enemies/${enemy}.webp`} alt="" loading="lazy" />
                        </div>
                    ))}
                </div>

                <h2 className="landing-section-title" style={{ marginTop: '2rem' }}>Your Deck. Your Rules.</h2>
                <p className="landing-section-desc">Five archetypes. Fifty powers. Every hand hits different.</p>
                <div className="landing-carousel-scene">
                    <div className="landing-carousel-cylinder" />
                    <div className="landing-carousel-ring">
                        {CARDS.map((card, i) => (
                            <div
                                className="landing-carousel-card"
                                key={card.id}
                                style={{
                                    '--card-angle': `${i * 72}deg`,
                                    borderColor: card.color,
                                } as React.CSSProperties}
                            >
                                <img src={`/assets/cards/${card.id}.webp`} alt="" loading="lazy" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* === HOW IT WORKS === */}
            <section className="landing-steps">
                <h2 className="landing-section-title">How It Works</h2>
                <div className="landing-steps-grid">
                    <div className="landing-step" style={{ '--step-color': 'var(--color-accent-red)' } as React.CSSProperties}>
                        <div className="landing-step-number">1</div>
                        <Camera size={32} className="landing-step-icon" />
                        <h3 className="landing-step-heading">Take a Selfie</h3>
                        <p className="landing-step-desc">Snap a photo or upload one. The neon reads your soul.</p>
                    </div>
                    <div className="landing-step-connector" />
                    <div className="landing-step" style={{ '--step-color': 'var(--color-accent-violet)' } as React.CSSProperties}>
                        <div className="landing-step-number">2</div>
                        <img src={eightiesIcon(4)} alt="" className="landing-step-icon" style={{ width: 32, height: 32 }} />
                        <h3 className="landing-step-heading">80's Magic Forges Your Hero</h3>
                        <p className="landing-step-desc">A unique character, archetype, and custom card deck crafted from your face.</p>
                    </div>
                    <div className="landing-step-connector" />
                    <div className="landing-step" style={{ '--step-color': 'var(--color-accent-blue)' } as React.CSSProperties}>
                        <div className="landing-step-number">3</div>
                        <Swords size={32} className="landing-step-icon" />
                        <h3 className="landing-step-heading">Battle the Spire</h3>
                        <p className="landing-step-desc">Play your custom deck through a tower of neon-lit encounters.</p>
                    </div>
                </div>
            </section>

            {/* === FINAL CTA === */}
            <section className="landing-final">
                <div className="landing-final-glow" />
                <h2 className="landing-final-heading">Ready to Enter the Tower?</h2>
                <p className="landing-final-desc">One selfie. Infinite possibilities.</p>
                <button className="start-button hero-button landing-cta" onClick={startSelfieCapture}>
                    <Camera size={20} />
                    Take a Selfie to Play
                </button>
            </section>
        </div>
    );
}

export default App;
