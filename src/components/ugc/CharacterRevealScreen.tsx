import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import { CardItem } from '../ui/CardItem';
import { Card } from '../../core/models';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import './CharacterRevealScreen.css';

export function CharacterRevealScreen() {
    const { generatedCharacter, generatedCards, startGeneratedRun } = useGameStore(state => ({
        generatedCharacter: state.generatedCharacter,
        generatedCards: state.generatedCards,
        startGeneratedRun: state.startGeneratedRun,
    }));

    const [revealStep, setRevealStep] = useState(0);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    useEffect(() => {
        const timers = [
            setTimeout(() => setRevealStep(1), 500),    // Archetype + title
            setTimeout(() => setRevealStep(2), 2000),   // Portrait
            setTimeout(() => setRevealStep(3), 3500),   // Cards begin
            setTimeout(() => setRevealStep(4), 6500),   // CTA button
        ];
        return () => timers.forEach(clearTimeout);
    }, []);

    // Keyboard navigation for lightbox
    useEffect(() => {
        if (lightboxIndex === null) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setLightboxIndex(null);
            if (e.key === 'ArrowLeft') setLightboxIndex(i => i !== null ? Math.max(0, i - 1) : null);
            if (e.key === 'ArrowRight' && displayCards) {
                setLightboxIndex(i => i !== null ? Math.min(displayCards.length - 1, i + 1) : null);
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [lightboxIndex]);

    // Swipe support for lightbox
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        (e.currentTarget as any)._touchStartX = e.touches[0].clientX;
    }, []);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        const startX = (e.currentTarget as any)._touchStartX;
        if (startX == null || !displayCards) return;
        const diff = e.changedTouches[0].clientX - startX;
        if (Math.abs(diff) > 50) {
            if (diff < 0) setLightboxIndex(i => i !== null ? Math.min(displayCards.length - 1, i + 1) : null);
            else setLightboxIndex(i => i !== null ? Math.max(0, i - 1) : null);
        }
    }, []);

    if (!generatedCharacter || !generatedCards) return null;

    // Convert GeneratedCards to Card objects for CardItem rendering
    const displayCards: Card[] = generatedCards.map((gc, i) => ({
        id: gc.id,
        instanceId: `reveal_${gc.id}_${i}`,
        name: gc.name,
        type: gc.type,
        cost: gc.cost,
        description: gc.description,
        target: gc.target,
        effects: gc.effects,
        imageUrl: gc.imageUrl,
        imageId: gc.imageId,
        exhausts: gc.exhausts,
        isHeroCard: gc.isHeroCard,
    }));

    const regularCards = displayCards.filter(c => !c.isHeroCard);
    const heroCard = displayCards.find(c => c.isHeroCard);

    return (
        <div className="reveal-screen">
            {/* Archetype + Title */}
            <div className={`reveal-header ${revealStep >= 1 ? 'visible' : ''}`}>
                <p className="reveal-archetype">{generatedCharacter.archetype}</p>
                <h2 className="reveal-name">{generatedCharacter.name}</h2>
                <p className="reveal-title">{generatedCharacter.title}</p>
            </div>

            {/* Portrait */}
            {generatedCharacter.portraitUrl && (
                <div className={`reveal-portrait ${revealStep >= 2 ? 'visible' : ''}`}>
                    <img
                        src={generatedCharacter.portraitUrl}
                        alt={generatedCharacter.name}
                        className="reveal-portrait-img"
                    />
                </div>
            )}

            {/* Traits */}
            <div className={`reveal-traits ${revealStep >= 2 ? 'visible' : ''}`}>
                {generatedCharacter.traits.map((trait, i) => (
                    <span key={i} className="reveal-trait">{trait}</span>
                ))}
            </div>

            {/* Hero Card */}
            {heroCard && (
                <div className={`reveal-hero-section ${revealStep >= 3 ? 'visible' : ''}`}>
                    <p className="reveal-hero-label">Your Signature Move</p>
                    <div
                        className="reveal-hero-slot"
                        onClick={() => setLightboxIndex(displayCards.indexOf(heroCard))}
                    >
                        <CardItem card={heroCard} canPlay={true} isDraggable={false} />
                    </div>
                </div>
            )}

            {/* Cards */}
            <div className={`reveal-cards ${revealStep >= 3 ? 'visible' : ''}`}>
                {regularCards.map((card, i) => (
                    <div
                        key={card.instanceId}
                        className="reveal-card-slot"
                        style={{ animationDelay: `${i * 0.15}s` }}
                        onClick={() => setLightboxIndex(displayCards.indexOf(card))}
                    >
                        <CardItem card={card} canPlay={true} isDraggable={false} />
                    </div>
                ))}
            </div>

            {/* CTA */}
            <button
                className={`reveal-cta ${revealStep >= 4 ? 'visible' : ''}`}
                onClick={startGeneratedRun}
            >
                Begin Your Journey
            </button>

            {/* Card Lightbox */}
            {lightboxIndex !== null && (
                <div className="card-lightbox-overlay" onClick={() => setLightboxIndex(null)}>
                    <div
                        className="card-lightbox"
                        onClick={(e) => e.stopPropagation()}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                    >
                        <button className="lightbox-close" onClick={() => setLightboxIndex(null)}>
                            <X size={20} />
                        </button>

                        <button
                            className="lightbox-nav lightbox-prev"
                            onClick={() => setLightboxIndex(Math.max(0, lightboxIndex - 1))}
                            disabled={lightboxIndex === 0}
                        >
                            <ChevronLeft size={28} />
                        </button>

                        <div className="lightbox-card">
                            <CardItem card={displayCards[lightboxIndex]} canPlay={true} isDraggable={false} />
                        </div>

                        <button
                            className="lightbox-nav lightbox-next"
                            onClick={() => setLightboxIndex(Math.min(displayCards.length - 1, lightboxIndex + 1))}
                            disabled={lightboxIndex === displayCards.length - 1}
                        >
                            <ChevronRight size={28} />
                        </button>

                        {/* Breadcrumb dots */}
                        <div className="lightbox-dots">
                            {displayCards.map((_, i) => (
                                <button
                                    key={i}
                                    className={`lightbox-dot ${i === lightboxIndex ? 'active' : ''}`}
                                    onClick={() => setLightboxIndex(i)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
