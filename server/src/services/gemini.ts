import { GoogleGenerativeAI } from '@google/generative-ai';

const ARCHETYPE_IDS = ['ember', 'tide', 'storm', 'root', 'shade'] as const;
type ArchetypeId = typeof ARCHETYPE_IDS[number];

export interface GeminiAnalysis {
    archetype: ArchetypeId;
    name: string;
    title: string;
    traits: string[];
}

// ── Shared art style applied to ALL image generation ──
const ART_STYLE = `Hand-painted dark fantasy illustration in the style of Slay the Spire and Darkest Dungeon: bold thick outlines, rich saturated colors, painterly brushstrokes, exaggerated proportions, dramatic chiaroscuro lighting, slightly stylized and cartoonish but menacing. Textured like oil paint on canvas.`;

// ── Selfie moderation ──
const MODERATION_PROMPT = `Analyze this image. Respond with ONLY a JSON object (no markdown, no code fences):
{
  "valid": true/false,
  "reason": "<brief reason if invalid>"
}

The image is VALID only if ALL of these are true:
- It contains a clearly visible human face (selfie or portrait photo)
- It is appropriate (no nudity, violence, gore, weapons, drugs, hate symbols, or offensive content)
- It is a real photograph (not a drawing, screenshot, meme, or AI-generated image)

Reject anything that is not a straightforward photo of a person's face.`;

// ── Archetype analysis prompt ──
const ANALYSIS_PROMPT = `You are a mystical oracle in a dark fantasy card game called "Slay the Tower."
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

// ── Archetype-specific character descriptions ──
const ARCHETYPE_CHARACTER_PROMPTS: Record<string, string> = {
    ember: 'wreathed in living flames, with glowing ember-like eyes, wearing ornate crimson and gold armor with molten details, fire swirling around their feet',
    tide: 'surrounded by flowing water and coral, with deep ocean-blue eyes, wearing iridescent scaled armor with pearl accents, waves crashing around them',
    storm: 'crackling with lightning, with electric-white eyes, wearing sleek violet and chrome armor with arcing energy, storm clouds gathering behind them',
    root: 'entwined with ancient vines and bark, with deep emerald eyes, wearing living wooden armor with glowing rune carvings, roots erupting from the ground',
    shade: 'dissolving into shadow and smoke, with piercing violet eyes, wearing dark leather armor with ghostly wisps, darkness pooling at their feet',
};

const ARCHETYPE_PALETTES: Record<string, string> = {
    ember: 'fiery reds, oranges, and molten gold. Flames, embers, and heat distortion',
    tide: 'deep blues, teals, and aquamarines. Water, waves, and coral',
    storm: 'electric purples, whites, and silvers. Lightning, wind, and crackling energy',
    root: 'deep greens, browns, and amber. Vines, bark, ancient wood, and glowing runes',
    shade: 'dark purples, blacks, and ghostly violet. Shadow, smoke, and darkness',
};

// ── Client setup ──
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

function getImageModel() {
    const client = getClient();
    return client.getGenerativeModel({
        model: 'gemini-2.0-flash-exp-image-generation',
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

function stripBase64Prefix(imageBase64: string): string {
    return imageBase64.replace(/^data:image\/\w+;base64,/, '');
}

// ── Moderation ──
export async function moderateSelfie(imageBase64: string): Promise<{ valid: boolean; reason: string }> {
    const client = getClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const base64Data = stripBase64Prefix(imageBase64);

    const result = await model.generateContent([
        { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
        { text: MODERATION_PROMPT },
    ]);

    const text = result.response.text().trim();
    const cleaned = text.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();

    try {
        const parsed = JSON.parse(cleaned);
        return { valid: !!parsed.valid, reason: String(parsed.reason || '') };
    } catch {
        return { valid: false, reason: 'Could not verify image' };
    }
}

// ── Archetype Analysis ──
export async function analyzeSelfie(imageBase64: string): Promise<GeminiAnalysis> {
    const client = getClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const base64Data = stripBase64Prefix(imageBase64);

    const result = await model.generateContent([
        { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
        { text: ANALYSIS_PROMPT },
    ]);

    const text = result.response.text().trim();
    const cleaned = text.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!ARCHETYPE_IDS.includes(parsed.archetype)) {
        parsed.archetype = ARCHETYPE_IDS[Math.floor(Math.random() * ARCHETYPE_IDS.length)];
    }
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

// ── Full-body Character Art ──
export async function generateCharacterArt(imageBase64: string, archetype: string): Promise<string> {
    const model = getImageModel();
    const base64Data = stripBase64Prefix(imageBase64);
    const desc = ARCHETYPE_CHARACTER_PROMPTS[archetype] || ARCHETYPE_CHARACTER_PROMPTS.ember;

    const prompt = `Transform this person into a full-body fantasy character for a dark roguelike card game. The character should be ${desc}. Show the FULL BODY from head to toe in a powerful hero pose, standing on dark terrain. Keep facial features recognizable but stylized. ${ART_STYLE}`;

    const result = await model.generateContent([
        { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
        { text: prompt },
    ]);

    return extractImageFromResponse(result);
}

// ── Card Art ──
export async function generateCardArt(
    cardName: string,
    cardDescription: string,
    cardType: string,
    archetype: string,
): Promise<string> {
    const model = getImageModel();
    const palette = ARCHETYPE_PALETTES[archetype] || ARCHETYPE_PALETTES.ember;

    const prompt = `Generate a square card art illustration for a dark fantasy roguelike card game.
Card: "${cardName}" - ${cardDescription}
Card type: ${cardType}
Color palette: ${palette}
No text, no words, no letters. Centered iconic composition, suitable for a small card thumbnail. ${ART_STYLE}`;

    const result = await model.generateContent([{ text: prompt }]);
    return extractImageFromResponse(result);
}
