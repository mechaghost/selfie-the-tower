import { v4 as uuidv4 } from 'uuid';
import { ARCHETYPES } from './archetypes.js';
import { GeminiAnalysis } from './gemini.js';

interface HeroCardInput {
    name: string;
    type: string;
    cost: number;
    description: string;
    target: string;
    effects: any[];
    exhausts: boolean;
    imageUrl?: string;
}

export function generateCharacterFromAnalysis(analysis: GeminiAnalysis, portraitUrl: string = '', heroCard?: HeroCardInput) {
    const archetype = ARCHETYPES[analysis.archetype];
    const characterId = uuidv4();

    const character = {
        id: characterId,
        name: analysis.name,
        archetype: analysis.archetype,
        title: analysis.title,
        portraitUrl,
        maxHp: 70 + Math.floor(Math.random() * 11),
        maxEnergy: 3,
        startingGold: 90 + Math.floor(Math.random() * 21),
        traits: analysis.traits,
    };

    const cards: Array<{
        id: string; name: string; type: string; cost: number; description: string;
        target: string; effects: any[]; imageId?: string; imageUrl?: string;
        exhausts?: boolean; isHeroCard?: boolean;
    }> = archetype.cards.map(card => {
        const cardId = `${analysis.archetype}_${card.name.toLowerCase().replace(/\s+/g, '_')}`;
        return {
            id: cardId,
            name: card.name,
            type: card.type,
            cost: card.cost,
            description: card.description,
            target: card.target,
            effects: card.effects,
            imageId: card.imageId,
            imageUrl: undefined as string | undefined,
            ...(card.exhausts ? { exhausts: true } : {}),
        };
    });

    if (heroCard) {
        cards.push({
            id: `hero_${analysis.archetype}_${heroCard.name.toLowerCase().replace(/\s+/g, '_')}`,
            name: heroCard.name,
            type: heroCard.type as any,
            cost: heroCard.cost,
            description: heroCard.description,
            target: heroCard.target as any,
            effects: heroCard.effects,
            imageId: undefined as string | undefined,
            imageUrl: heroCard.imageUrl,
            exhausts: heroCard.exhausts,
            isHeroCard: true,
        });
    }

    return { character, cards };
}

export function generateMockCharacter() {
    const archetypeKeys = Object.keys(ARCHETYPES);
    const archetypeId = archetypeKeys[Math.floor(Math.random() * archetypeKeys.length)];
    const archetype = ARCHETYPES[archetypeId];

    const name = archetype.names[Math.floor(Math.random() * archetype.names.length)];
    const title = archetype.titles[Math.floor(Math.random() * archetype.titles.length)];
    const traits = archetype.traits[Math.floor(Math.random() * archetype.traits.length)];

    const analysis: GeminiAnalysis = { archetype: archetypeId as any, name, title, traits };
    const portraitUrl = `/assets/characters/${archetypeId}.webp`;
    return generateCharacterFromAnalysis(analysis, portraitUrl);
}
