import { GoogleGenerativeAI } from '@google/generative-ai';

const ARCHETYPE_IDS = ['ember', 'tide', 'storm', 'root', 'shade'] as const;
type ArchetypeId = typeof ARCHETYPE_IDS[number];

export interface GeminiAnalysis {
    archetype: ArchetypeId;
    name: string;
    title: string;
    traits: string[];
}

const PROMPT = `You are a mystical oracle in a dark fantasy card game called "Slay the Tower."
A brave adventurer has stepped forward and revealed their face to you.
Analyze their appearance, expression, and energy to determine their elemental archetype.

The five archetypes are:
- **ember** (fire): For those with fierce, intense, or passionate energy. Warm tones, bold expressions, fiery spirit.
- **tide** (water): For those with calm, adaptive, or mysterious energy. Cool composure, deep eyes, flowing presence.
- **storm** (lightning): For those with electric, dynamic, or unpredictable energy. Sharp features, bright eyes, restless spirit.
- **root** (earth): For those with steady, grounded, or enduring energy. Strong build, patient gaze, unyielding presence.
- **shade** (shadow): For those with cunning, elusive, or precise energy. Sharp look, calculating eyes, mysterious aura.

Based on this adventurer's image, respond with ONLY a JSON object (no markdown, no code fences):
{
  "archetype": "<one of: ember, tide, storm, root, shade>",
  "name": "<a unique fantasy character name that feels inspired by their appearance>",
  "title": "<a dramatic title like 'Wielder of Living Flame' or 'Walker Between Shadows'>",
  "traits": ["<trait1>", "<trait2>", "<trait3>"]
}

Be creative and make each character feel unique. The name should sound fantastical but subtly echo something about the person's appearance or vibe.`;

let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
    if (!genAI) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY environment variable is not set');
        }
        genAI = new GoogleGenerativeAI(apiKey);
    }
    return genAI;
}

const ARCHETYPE_PORTRAIT_PROMPTS: Record<string, string> = {
    ember: 'wreathed in living flames, with glowing ember-like eyes and hair that flickers like fire, wearing ornate crimson and gold armor with molten details',
    tide: 'surrounded by flowing water and coral, with deep ocean-blue eyes and flowing aquamarine hair, wearing iridescent scaled armor with pearl accents',
    storm: 'crackling with lightning, with electric-white eyes and wind-swept silver hair, wearing sleek violet and chrome armor with arcing energy',
    root: 'entwined with ancient vines and bark, with deep emerald eyes and moss-flecked brown hair, wearing living wooden armor with glowing rune carvings',
    shade: 'dissolving into shadow and smoke, with piercing violet eyes and raven-black hair, wearing dark leather armor with ghostly wisps trailing off',
};

export async function generatePortrait(imageBase64: string, archetype: string): Promise<string> {
    const model = getImageModel();
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const archetypeDesc = ARCHETYPE_PORTRAIT_PROMPTS[archetype] || ARCHETYPE_PORTRAIT_PROMPTS.ember;

    const portraitPrompt = `Transform this person's photo into a dramatic fantasy character portrait for a dark card game. The character should be ${archetypeDesc}. Style: painted digital art, dramatic lighting, dark moody background, shoulders-up portrait composition. Keep the person's basic facial features recognizable but make them look like an epic fantasy hero.`;

    const result = await model.generateContent([
        {
            inlineData: {
                mimeType: 'image/jpeg',
                data: base64Data,
            },
        },
        { text: portraitPrompt },
    ]);

    return extractImageFromResponse(result);
}

function getImageModel() {
    const client = getClient();
    return client.getGenerativeModel({
        model: 'gemini-2.0-flash-exp-image-generation',
        // @ts-ignore - responseModalities is supported by the API but not yet in SDK types
        generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
        },
    } as any);
}

async function extractImageFromResponse(result: any): Promise<string> {
    const parts = result.response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
        if ((part as any).inlineData) {
            const { mimeType, data } = (part as any).inlineData;
            return `data:${mimeType};base64,${data}`;
        }
    }
    throw new Error('No image generated in response');
}

const ARCHETYPE_STYLES: Record<string, string> = {
    ember: 'fiery reds, oranges, and molten gold. Flames, embers, and heat distortion',
    tide: 'deep blues, teals, and aquamarines. Water, waves, and coral',
    storm: 'electric purples, whites, and silvers. Lightning, wind, and crackling energy',
    root: 'deep greens, browns, and amber. Vines, bark, ancient wood, and glowing runes',
    shade: 'dark purples, blacks, and ghostly violet. Shadow, smoke, and darkness',
};

export async function generateCardArt(
    cardName: string,
    cardDescription: string,
    cardType: string,
    archetype: string,
): Promise<string> {
    const model = getImageModel();
    const style = ARCHETYPE_STYLES[archetype] || ARCHETYPE_STYLES.ember;

    const prompt = `Generate a square card art illustration for a dark fantasy card game.
Card: "${cardName}" - ${cardDescription}
Card type: ${cardType}
Color palette: ${style}
Style: Dark fantasy digital painting, dramatic lighting, no text or words, centered iconic composition, suitable for a small card thumbnail.`;

    const result = await model.generateContent([{ text: prompt }]);
    return extractImageFromResponse(result);
}

export async function analyzeSelfie(imageBase64: string): Promise<GeminiAnalysis> {
    const client = getClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Strip data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const result = await model.generateContent([
        {
            inlineData: {
                mimeType: 'image/jpeg',
                data: base64Data,
            },
        },
        { text: PROMPT },
    ]);

    const response = result.response;
    const text = response.text().trim();

    // Parse JSON - strip any accidental markdown fences
    const cleaned = text.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(cleaned);

    // Validate archetype
    if (!ARCHETYPE_IDS.includes(parsed.archetype)) {
        parsed.archetype = ARCHETYPE_IDS[Math.floor(Math.random() * ARCHETYPE_IDS.length)];
    }

    // Validate traits array
    if (!Array.isArray(parsed.traits) || parsed.traits.length !== 3) {
        parsed.traits = ['Mysterious', 'Resilient', 'Bold'];
    }

    return {
        archetype: parsed.archetype,
        name: String(parsed.name || 'Unknown Wanderer'),
        title: String(parsed.title || 'Seeker of the Spire'),
        traits: parsed.traits.map(String),
    };
}
