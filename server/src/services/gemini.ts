import { GoogleGenerativeAI } from '@google/generative-ai';

const ARCHETYPE_IDS = ['neon', 'chrome', 'volt', 'concrete', 'smoke'] as const;
type ArchetypeId = typeof ARCHETYPE_IDS[number];

export interface GeminiAnalysis {
    archetype: ArchetypeId;
    name: string;
    title: string;
    traits: string[];
}

// ── Shared art style applied to ALL image generation ──
const ART_STYLE = `Clean minimalist risograph print illustration. Flat color blocking in 2-3 solid ink layers, bold geometric shapes. Sparse hatching only for shading — large areas of clean flat color. No grain, no noise, no halftone dots. Sharp edges, high contrast, simple iconic forms. Inspired by modern risograph poster art and screen print minimalism.`;

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
const ANALYSIS_PROMPT = `You are a street oracle in a neon-lit 1980s urban magic card game called "Selfie the Spire."
A brave challenger has stepped out of the city crowd and revealed their face to you.
Analyze their appearance, expression, and energy to determine their street magic archetype.

The five archetypes are:
- **neon**: Fierce, intense, passionate energy. Street pyromancers who bend neon signs, spray-can sorcerers with flame tattoos. Think: 80s punk rocker meets Tokyo back-alley fire dancer.
- **chrome**: Calm, adaptive, mysterious energy. Rain walkers who command reflections on wet pavement, chrome-mirror mages. Think: cyberpunk detective meets midnight city drifter.
- **volt**: Electric, dynamic, unpredictable energy. Rooftop punks who channel radio towers and power lines, antenna hackers. Think: 80s skate punk meets lightning-rod rebel.
- **concrete**: Steady, grounded, enduring energy. Urban druids who grow vines through cracked pavement, warehouse wardens. Think: construction worker turned street shaman, moss and rebar.
- **smoke**: Cunning, elusive, precise energy. Alley ghosts who flicker streetlights and bend city fog, shadow runners. Think: 80s noir detective meets phantom graffiti artist.

IMPORTANT: This game is set in a neon-soaked 1980s city (Tokyo/LA mashup). All names and titles MUST sound urban, street-level, and retro — like characters from an 80s anime or arcade game. Do NOT use generic fantasy names or medieval/nature titles.

Good name examples: "Blaze Tanaka", "Nyx Fuego", "Sparks Miyamoto", "Shade Mori", "Rex Ampere"
Good title examples: "Street Pyromancer", "The Chrome Mirror", "Antenna Punk", "Warehouse Warden", "The Smoke Signal"
BAD examples (too fantasy): "Tidecaller", "Earthshaper", "Flamebringer", "Shadowweaver", "Stormkeeper"

Based on this person's image, respond with ONLY a JSON object (no markdown, no code fences):
{
  "archetype": "<one of: neon, chrome, volt, concrete, smoke>",
  "name": "<first + last name, urban/street style, 80s anime vibe>",
  "title": "<dramatic street title, 2-4 words, urban not fantasy>",
  "traits": ["<trait1>", "<trait2>", "<trait3>"]
}

Be creative and make each character feel unique. Every name should sound like it belongs on a neon sign in 1985 Shibuya.`;

// ── Archetype-specific character descriptions ──
const ARCHETYPE_CHARACTER_PROMPTS: Record<string, string> = {
    neon: 'wreathed in neon flame tattoos that glow, wearing a vintage bomber jacket with glowing kanji patches, fingerless gloves crackling with fire, neon signs flickering behind them in a dark alley',
    chrome: 'surrounded by floating rain droplets and chrome reflections, wearing a sleek silver trench coat with mirror-finish accents, rain-soaked city street behind them with reflected neon',
    volt: 'crackling with electricity from rooftop antenna arrays, wearing torn punk vest with circuit-board patches, headphones around neck sparking with energy, radio tower silhouette behind them',
    concrete: 'entwined with vines bursting through cracked pavement, wearing work boots and a moss-covered denim jacket with glowing rune graffiti, abandoned warehouse behind them with overgrown walls',
    smoke: 'dissolving into city fog and cigarette smoke, wearing a dark hoodie with phosphorescent trim, flickering streetlight above them, shadows pooling unnaturally at their feet in a narrow alley',
};

const ARCHETYPE_PALETTES: Record<string, string> = {
    neon: 'vermillion red, hot orange, molten amber, and neon pink. Neon signs, spray paint, flame',
    chrome: 'teal, electric cyan, silver chrome, and deep navy. Rain, reflections, wet streets',
    volt: 'electric violet, neon yellow, white lightning, and deep purple. Sparks, circuits, antenna glow',
    concrete: 'olive green, terracotta brown, warm amber, and moss. Vines, cracked concrete, graffiti',
    smoke: 'deep purple, lavender mist, ghostly white, and charcoal. Fog, smoke trails, flickering light',
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
        model: 'gemini-3.1-flash-image-preview',
        generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
        } as any,
    });
}

async function extractImageFromResponse(result: any): Promise<string> {
    const candidate = result.response.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    for (const part of parts) {
        if ((part as any).inlineData) {
            const { mimeType, data } = (part as any).inlineData;
            return `data:${mimeType};base64,${data}`;
        }
    }
    const finishReason = candidate?.finishReason || 'unknown';
    const textParts = parts.filter((p: any) => p.text).map((p: any) => p.text).join(' ');
    throw new Error(`No image in response (finishReason=${finishReason}${textParts ? `, text: ${textParts.slice(0, 200)}` : ''})`);
}

function stripBase64Prefix(imageBase64: string): string {
    return imageBase64.replace(/^data:image\/\w+;base64,/, '');
}

// Retry wrapper for flaky image generation
async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
    for (let i = 0; i <= retries; i++) {
        try {
            return await fn();
        } catch (err: any) {
            if (i === retries) throw err;
            console.warn(`Image gen attempt ${i + 1} failed: ${err.message}, retrying...`);
            await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        }
    }
    throw new Error('Unreachable');
}

// ── Moderation ──
export async function moderateSelfie(imageBase64: string): Promise<{ valid: boolean; reason: string }> {
    const client = getClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const base64Data = stripBase64Prefix(imageBase64);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    let result;
    try {
        result = await model.generateContent({
            contents: [{ role: 'user', parts: [
                { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                { text: MODERATION_PROMPT },
            ]}],
        }, { signal: controller.signal } as any);
    } finally {
        clearTimeout(timeout);
    }

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

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    let result;
    try {
        result = await model.generateContent({
            contents: [{ role: 'user', parts: [
                { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                { text: ANALYSIS_PROMPT },
            ]}],
        }, { signal: controller.signal } as any);
    } finally {
        clearTimeout(timeout);
    }

    const text = result.response.text().trim();
    const cleaned = text.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();

    let parsed;
    try {
        parsed = JSON.parse(cleaned);
    } catch {
        throw new Error('Failed to parse character analysis response');
    }

    if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid character analysis response');
    }

    if (!ARCHETYPE_IDS.includes(parsed.archetype)) {
        parsed.archetype = ARCHETYPE_IDS[Math.floor(Math.random() * ARCHETYPE_IDS.length)];
    }
    if (!Array.isArray(parsed.traits) || parsed.traits.length !== 3) {
        parsed.traits = ['Mysterious', 'Resilient', 'Bold'];
    }

    return {
        archetype: parsed.archetype,
        name: String(parsed.name || 'Unknown Wanderer').slice(0, 100),
        title: String(parsed.title || 'Seeker of the Spire').slice(0, 100),
        traits: parsed.traits.map((t: unknown) => String(t).slice(0, 50)),
    };
}

// ── Full-body Character Art (1024px) ──
export async function generateCharacterArt(imageBase64: string, archetype: string): Promise<string> {
    const model = getImageModel();
    const base64Data = stripBase64Prefix(imageBase64);
    const desc = ARCHETYPE_CHARACTER_PROMPTS[archetype] || ARCHETYPE_CHARACTER_PROMPTS.neon;

    const prompt = `Transform this person into a full-body fantasy street mage character sprite for a neon-soaked 1980s urban magic card game. The character should be ${desc}. Show the FULL BODY from head to toe in a powerful idle standing pose. The background must be plain solid white (#FFFFFF). No scenery, no environment, no floor shadows — just the character on a white background. Keep facial features recognizable but stylized. ${ART_STYLE}`;

    return withRetry(async () => {
        const result = await model.generateContent([
            { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
            { text: prompt },
        ]);
        return extractImageFromResponse(result);
    });
}

// ── Card Art (512px for cost efficiency) ──
export async function generateCardArt(
    cardName: string,
    cardDescription: string,
    cardType: string,
    archetype: string,
): Promise<string> {
    const model = getImageModel();
    const palette = ARCHETYPE_PALETTES[archetype] || ARCHETYPE_PALETTES.neon;

    const prompt = `Generate card art in landscape 4:3 aspect ratio for a neon-soaked 1980s urban magic card game.
Card: "${cardName}" - ${cardDescription}
Card type: ${cardType}
Color palette: ${palette}
No text, no words, no letters, no numbers. Centered iconic composition, suitable for a small card thumbnail. ${ART_STYLE}`;

    return withRetry(async () => {
        const result = await model.generateContent([{ text: prompt }]);
        return extractImageFromResponse(result);
    });
}
