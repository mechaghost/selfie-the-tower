import { v4 as uuidv4 } from 'uuid';
import { ARCHETYPES } from './archetypes.js';
import { GeminiAnalysis } from './gemini.js';

export function generateCharacterFromAnalysis(analysis: GeminiAnalysis, portraitUrl: string = '') {
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

    const cards = archetype.cards.map(card => ({
        id: `${analysis.archetype}_${card.name.toLowerCase().replace(/\s+/g, '_')}`,
        name: card.name,
        type: card.type,
        cost: card.cost,
        description: card.description,
        target: card.target,
        effects: card.effects,
        imageUrl: undefined as string | undefined,
        ...(card.exhausts ? { exhausts: true } : {}),
    }));

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
    return generateCharacterFromAnalysis(analysis);
}
