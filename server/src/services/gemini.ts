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
