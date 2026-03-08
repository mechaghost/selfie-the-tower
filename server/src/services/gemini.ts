import { GoogleGenerativeAI } from '@google/generative-ai';
import sharp from 'sharp';

const ARCHETYPE_IDS = ['neon', 'chrome', 'volt', 'concrete', 'smoke'] as const;
type ArchetypeId = typeof ARCHETYPE_IDS[number];

export interface GeminiAnalysis {
    archetype: ArchetypeId;
    name: string;
    title: string;
    traits: string[];
}

// ── Shared art style applied to ALL image generation ──
const ART_STYLE = `Clean minimalist risograph print illustration. Flat color blocking in 2-3 solid ink layers, bold geometric shapes. Sparse hatching only for shading — large areas of clean flat color. No grain, no noise, no halftone dots. Sharp edges, high contrast, simple iconic forms. Inspired by modern risograph poster art and screen print minimalism. IMPORTANT: Full bleed artwork — the illustration must extend to every edge of the image. No white borders, no margins, no frames, no matte, no padding. Edge-to-edge color.`;

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

IMPORTANT: Names should be 1980s arcade-style usernames/handles — short, punchy, all-caps energy. Think high score screens, BBS handles, and CB radio callsigns. NOT Japanese names, NOT fantasy names.

Good name examples: "HOTSHOT", "BLADE", "NEON VIPER", "CHROME FOX", "STATIC", "GHOST WIRE", "TURBO"
Good title examples: "Street Pyromancer", "The Chrome Mirror", "Antenna Punk", "Warehouse Warden", "The Smoke Signal"
BAD examples: "Blaze Tanaka", "Akira Sato", "Tidecaller", "Earthshaper" (no Japanese names, no fantasy names)

Based on this person's image, respond with ONLY a JSON object (no markdown, no code fences):
{
  "archetype": "<one of: neon, chrome, volt, concrete, smoke>",
  "name": "<1-2 word 80s arcade handle/username, ALL CAPS energy>",
  "title": "<dramatic street title, 2-4 words, urban not fantasy>",
  "traits": ["<trait1>", "<trait2>", "<trait3>"]
}

Be creative and make each character feel unique. Every name should sound like it belongs on an arcade high score screen in 1985.`;

// ── Archetype magical effects (no costume overrides — person's real appearance drives the look) ──
const ARCHETYPE_MAGIC_EFFECTS: Record<string, string> = {
    neon: 'glowing flame tattoos on their arms, fire flickering from their hands, neon signs in the alley behind them',
    chrome: 'floating rain droplets suspended around them, chrome reflections on wet pavement, neon reflected in puddles',
    volt: 'electricity arcing from their fingertips, sparks in the air around them, radio tower silhouette behind them',
    concrete: 'glowing rune graffiti on the wall behind them, vines cracking through the pavement at their feet',
    smoke: 'wisps of smoke curling from their hands, shadows pooling at their feet, a flickering streetlight above',
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

// Optimize generated images: resize + convert to webp
async function optimizeImage(dataUrl: string, width: number, height?: number): Promise<string> {
    const base64Data = stripBase64Prefix(dataUrl);
    const buffer = Buffer.from(base64Data, 'base64');
    const optimized = await sharp(buffer)
        .resize(width, height, { fit: 'cover' })
        .webp({ quality: 80 })
        .toBuffer();
    return `data:image/webp;base64,${optimized.toString('base64')}`;
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
    const magic = ARCHETYPE_MAGIC_EFFECTS[archetype] || ARCHETYPE_MAGIC_EFFECTS.neon;
    const palette = ARCHETYPE_PALETTES[archetype] || ARCHETYPE_PALETTES.neon;

    const prompt = `${ART_STYLE}

Illustrate this person as a street mage character for a 1980s neon urban card game. ONLY ONE character, centered in frame, full body head to toe, powerful standing pose.

IDENTITY IS CRITICAL: Preserve this person's EXACT face, hairstyle, skin tone, glasses, clothing, and accessories. Their real appearance drives the character — do NOT replace their outfit. Keep what they are actually wearing but enhance it with subtle magical elements.

Magical effects to ADD (do not change their clothes, just layer these on): ${magic}.
Dark moody neon-lit alley background. Color palette: ${palette}.
No text, no words, no letters.`;

    return withRetry(async () => {
        const result = await model.generateContent([
            { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
            { text: prompt },
        ]);
        const raw = await extractImageFromResponse(result);
        return optimizeImage(raw, 512, 512);
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
        const raw = await extractImageFromResponse(result);
        return optimizeImage(raw, 384, 288);
    });
}

// ── Hero Card Mechanics (AI-generated unique card per player) ──
const HERO_CARD_PROMPT = `You are designing a signature hero card for a player character in a 1980s neon urban deckbuilding card game.

Character: {name} — {title}
Archetype: {archetype}
Traits: {traits}

Design ONE powerful signature card that reflects this character's personality and fighting style.
The card should combine exactly 2 effects to feel like a devastating signature move.

CONSTRAINTS (follow EXACTLY):
- name: exactly 1 word, max 10 characters, dramatic, relates to the character
- type: "Attack" | "Skill" | "Power"
- cost: 1 (always costs 1 energy)
- target: "Enemy" | "Self" | "AllEnemies"
- exhausts: true (hero cards always exhaust after use)
- description: MAX 60 characters. Short mechanical text ONLY. Example: "Deal 14 damage. Apply 2 Vulnerable." No flavor text, no adjectives.
- effects: array of EXACTLY 2 effect objects

Each effect MUST be one of these exact formats:
  { "type": "Damage", "amount": <8-20>, "target": "Target" }
  { "type": "Damage", "amount": <8-20>, "target": "AllEnemies" }
  { "type": "Block", "amount": <8-18>, "target": "Self" }
  { "type": "ApplyStatus", "amount": <1-3>, "statusId": "vulnerable", "target": "Target" }
  { "type": "ApplyStatus", "amount": <1-3>, "statusId": "weak", "target": "Target" }
  { "type": "ApplyStatus", "amount": <1-3>, "statusId": "weak", "target": "AllEnemies" }
  { "type": "ApplyStatus", "amount": <1-3>, "statusId": "strength", "target": "Self" }
  { "type": "ApplyStatus", "amount": <1-3>, "statusId": "dexterity", "target": "Self" }
  { "type": "Heal", "amount": <4-8>, "target": "Self" }
  { "type": "Draw", "amount": <1-3>, "target": "Self" }

Respond with ONLY a JSON object (no markdown, no code fences):
{
  "name": "...",
  "type": "...",
  "cost": ...,
  "description": "...",
  "target": "...",
  "exhausts": true,
  "effects": [...]
}`;

const VALID_EFFECT_TYPES = ['Damage', 'Block', 'ApplyStatus', 'Heal', 'Draw'];
const VALID_STATUS_IDS = ['vulnerable', 'weak', 'strength', 'dexterity'];
const VALID_TARGETS = ['Self', 'Target', 'AllEnemies'];
const VALID_CARD_TYPES = ['Attack', 'Skill', 'Power'];
const VALID_CARD_TARGETS = ['Enemy', 'Self', 'AllEnemies'];

interface HeroCardMechanics {
    name: string;
    type: 'Attack' | 'Skill' | 'Power';
    cost: number;
    description: string;
    target: 'Enemy' | 'Self' | 'AllEnemies';
    exhausts: boolean;
    effects: { type: string; amount?: number; statusId?: string; target: string }[];
}

const HERO_FALLBACKS: Record<string, HeroCardMechanics> = {
    neon: { name: 'Inferno', type: 'Attack', cost: 1, target: 'AllEnemies', exhausts: true, description: 'Deal 15 damage to ALL. Apply 2 Vulnerable.', effects: [{ type: 'Damage', amount: 15, target: 'AllEnemies' }, { type: 'ApplyStatus', amount: 2, statusId: 'vulnerable', target: 'AllEnemies' }] },
    chrome: { name: 'Deluge', type: 'Skill', cost: 1, target: 'Self', exhausts: true, description: 'Gain 16 Block. Gain 2 Dexterity.', effects: [{ type: 'Block', amount: 16, target: 'Self' }, { type: 'ApplyStatus', amount: 2, statusId: 'dexterity', target: 'Self' }] },
    volt: { name: 'Overdrive', type: 'Attack', cost: 1, target: 'Enemy', exhausts: true, description: 'Deal 12 damage. Draw 3 cards.', effects: [{ type: 'Damage', amount: 12, target: 'Target' }, { type: 'Draw', amount: 3, target: 'Self' }] },
    concrete: { name: 'Fortress', type: 'Skill', cost: 1, target: 'Self', exhausts: true, description: 'Gain 18 Block. Heal 6.', effects: [{ type: 'Block', amount: 18, target: 'Self' }, { type: 'Heal', amount: 6, target: 'Self' }] },
    smoke: { name: 'Eclipse', type: 'Attack', cost: 1, target: 'Enemy', exhausts: true, description: 'Deal 12 damage. Apply 2 Weak.', effects: [{ type: 'Damage', amount: 12, target: 'Target' }, { type: 'ApplyStatus', amount: 2, statusId: 'weak', target: 'Target' }] },
};

export async function generateHeroCardMechanics(analysis: GeminiAnalysis): Promise<HeroCardMechanics> {
    const client = getClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = HERO_CARD_PROMPT
        .replace('{name}', analysis.name)
        .replace('{title}', analysis.title)
        .replace('{archetype}', analysis.archetype)
        .replace('{traits}', analysis.traits.join(', '));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    let result;
    try {
        result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
        }, { signal: controller.signal } as any);
    } finally {
        clearTimeout(timeout);
    }

    const text = result.response.text().trim();
    const cleaned = text.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();

    let parsed: any;
    try {
        parsed = JSON.parse(cleaned);
    } catch {
        console.warn('Failed to parse hero card response, using fallback');
        return HERO_FALLBACKS[analysis.archetype] || HERO_FALLBACKS.neon;
    }

    // Validate and sanitize
    const name = String(parsed.name || 'Hero').split(/\s+/)[0].slice(0, 10);
    const type = VALID_CARD_TYPES.includes(parsed.type) ? parsed.type : 'Attack';
    const cost = 1;
    const target = VALID_CARD_TARGETS.includes(parsed.target) ? parsed.target : (type === 'Attack' ? 'Enemy' : 'Self');

    // Validate effects
    const rawEffects = Array.isArray(parsed.effects) ? parsed.effects : [];
    const validEffects = rawEffects
        .filter((e: any) => e && VALID_EFFECT_TYPES.includes(e.type) && VALID_TARGETS.includes(e.target))
        .filter((e: any) => {
            if (e.type === 'ApplyStatus' && !VALID_STATUS_IDS.includes(e.statusId)) return false;
            return true;
        })
        .map((e: any) => ({
            type: e.type,
            amount: Math.max(1, Math.min(25, Math.round(Number(e.amount) || 1))),
            ...(e.statusId ? { statusId: e.statusId } : {}),
            target: e.target,
        }))
        .slice(0, 2);

    // If too few valid effects, use fallback
    if (validEffects.length < 2) {
        console.warn('Hero card had fewer than 2 valid effects, using fallback');
        return HERO_FALLBACKS[analysis.archetype] || HERO_FALLBACKS.neon;
    }

    return {
        name,
        type: type as HeroCardMechanics['type'],
        cost,
        description: String(parsed.description || '').slice(0, 80),
        target: target as HeroCardMechanics['target'],
        exhausts: true,
        effects: validEffects,
    };
}

// ── Hero Card Art (selfie-based, 4:3 landscape) ──
export async function generateHeroCardArt(
    imageBase64: string,
    cardName: string,
    cardDescription: string,
    cardType: string,
    archetype: string,
): Promise<string> {
    const model = getImageModel();
    const base64Data = stripBase64Prefix(imageBase64);
    const palette = ARCHETYPE_PALETTES[archetype] || ARCHETYPE_PALETTES.neon;

    const prompt = `CRITICAL: The artwork must have ZERO border, ZERO frame, ZERO margin. Color must touch every single edge of the image.

${ART_STYLE}

Generate card art in landscape 4:3 aspect ratio for a neon-soaked 1980s urban magic card game.
This is a HERO CARD — the player's ultimate signature move called "${cardName}": ${cardDescription}.

IDENTITY IS CRITICAL: Preserve this person's EXACT face, hairstyle, skin tone, glasses, and features. Show them in a dynamic action pose unleashing their power.

Card type: ${cardType}. Color palette: ${palette}.
Add a golden energy aura or golden light burst to mark this as a special hero card.
No text, no words, no letters, no numbers. Centered iconic composition.`;

    return withRetry(async () => {
        const result = await model.generateContent([
            { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
            { text: prompt },
        ]);
        const raw = await extractImageFromResponse(result);
        return optimizeImage(raw, 384, 288);
    });
}
