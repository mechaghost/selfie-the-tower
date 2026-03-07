import { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { CardItem } from '../ui/CardItem';
import { Card } from '../../core/models';
import './CharacterRevealScreen.css';

export function CharacterRevealScreen() {
    const { generatedCharacter, generatedCards, startGeneratedRun } = useGameStore(state => ({
        generatedCharacter: state.generatedCharacter,
        generatedCards: state.generatedCards,
        startGeneratedRun: state.startGeneratedRun,
    }));

    const [revealStep, setRevealStep] = useState(0);

    useEffect(() => {
        const timers = [
            setTimeout(() => setRevealStep(1), 500),    // Archetype + title
            setTimeout(() => setRevealStep(2), 2000),   // Portrait
            setTimeout(() => setRevealStep(3), 3500),   // Cards begin
            setTimeout(() => setRevealStep(4), 6500),   // CTA button
        ];
        return () => timers.forEach(clearTimeout);
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
        exhausts: gc.exhausts,
    }));

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

            {/* Cards */}
            <div className={`reveal-cards ${revealStep >= 3 ? 'visible' : ''}`}>
                {displayCards.map((card, i) => (
                    <div
                        key={card.instanceId}
                        className="reveal-card-slot"
                        style={{ animationDelay: `${i * 0.15}s` }}
                    >
                        <CardItem card={card} canPlay={false} isDraggable={false} />
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
        </div>
    );
}
