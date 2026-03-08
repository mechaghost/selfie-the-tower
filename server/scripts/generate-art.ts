/**
 * Batch art generation script for Selfie the Spire.
 *
 * Generates static art assets using Gemini 3.1 Flash Image Preview:
 *   - 5 character portraits  → public/assets/characters/{archetype}.png
 *   - 50 card art             → public/assets/cards/{archetype}_{card_name_snake}.png
 *   - 20 enemy portraits      → public/assets/enemies/{enemy_id}.png
 *
 * Usage:
 *   cd server && GEMINI_API_KEY=xxx npm run generate-art
 *
 * Resumable: skips files that already exist.
 */

import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';
import { ARCHETYPES } from '../src/services/archetypes';

// ── Config ──
const OUTPUT_ROOT = path.resolve(import.meta.dirname, '../../public/assets');
const RATE_LIMIT_MS = 4000; // 4s between requests to avoid quota issues
const MAX_RETRIES = 3;

// ── Art style ──
const ART_STYLE = `Clean minimalist risograph print illustration. Flat color blocking in 2-3 solid ink layers, bold geometric shapes. Sparse hatching only for shading — large areas of clean flat color. No grain, no noise, no halftone dots. Sharp edges, high contrast, simple iconic forms. Inspired by modern risograph poster art and screen print minimalism. IMPORTANT: Full bleed artwork — the illustration must extend to every edge of the image. No white borders, no margins, no frames, no matte, no padding. Edge-to-edge color.`;

// ── Archetype prompts ──
const ARCHETYPE_CHARACTER_PROMPTS: Record<string, string> = {
    neon: 'a street pyromancer with flame tattoos and a bomber jacket, fire in their fists, neon alley background',
    chrome: 'a rain walker in a silver trench coat, floating rain droplets, wet neon-lit street background',
    volt: 'a punk mage with electricity sparks, torn vest with circuit patches, radio tower silhouette background',
    concrete: 'an urban druid with vines and moss, denim jacket with rune graffiti, cracked pavement background',
    smoke: 'an alley ghost in a dark hoodie, dissolving into fog, flickering streetlight background',
};

const ARCHETYPE_PALETTES: Record<string, string> = {
    neon: 'vermillion red, hot orange, molten amber, and neon pink. Neon signs, spray paint, flame',
    chrome: 'teal, electric cyan, silver chrome, and deep navy. Rain, reflections, wet streets',
    volt: 'electric violet, neon yellow, white lightning, and deep purple. Sparks, circuits, antenna glow',
    concrete: 'olive green, terracotta brown, warm amber, and moss. Vines, cracked concrete, graffiti',
    smoke: 'deep purple, lavender mist, ghostly white, and charcoal. Fog, smoke trails, flickering light',
};

// ── Enemy art descriptions (kept simple for risograph style) ──
const ENEMY_DESCRIPTIONS: Record<string, string> = {
    alley_rat: 'A mutant rat with glowing pink eyes, neon alley, vermillion and pink palette',
    neon_junkie: 'A twitchy figure with cracked neon tubes in their skin, orange and pink palette',
    graffiti_imp: 'A small creature made of living spray paint, dripping colors, graffiti wings',
    stray_voltage: 'A floating electric skull with lightning tendrils, blue-white and violet palette',
    dumpster_crawler: 'A hulking junkyard golem made of dumpster parts, rust-red and amber palette',
    smoke_specter: 'A ghostly figure formed from smoke, hollow glowing eyes, purple and lavender palette',
    taxi_ghost: 'A spectral taxi driver emerging from a wrecked cab, yellow-green glow',
    manhole_mimic: 'A manhole cover with metallic jaws and pipe tentacles, steam rising, iron grey palette',
    boombox_brute: 'A muscular figure with a giant boombox, gold chains, 80s muscle, orange and gold palette',
    neon_wraith: 'An ethereal being made of broken neon tubes, flickering colored light, pink and cyan palette',
    payphone_phantom: 'A haunted payphone booth come alive, glowing receiver mouth, teal and green palette',
    sewer_slime: 'A toxic sludge blob with glowing eyes, rainbow chemical sheen, green and purple palette',
    fire_escape_spider: 'A mechanical spider made of fire escape ladders, rust-red body, metal web',
    vending_golem: 'A rogue vending machine with legs and arms, cracked display, menacing stance',
    circuit_breaker: 'A towering armored figure made of switchgear, sparking circuits, electric blue palette',
    neon_yakuza: 'A suited figure with a glowing katana, neon-trimmed black suit, red and cyan palette',
    chrome_bouncer: 'A chrome-plated bouncer with mirror skin, black suit, silver and teal palette',
    the_billboard: 'A massive living neon billboard with a light-bulb face, electric wire tentacles, towering',
    subway_wyrm: 'A dragon made of subway cars, rail horns, sparking electricity, graffiti scales',
    dj_phantom: 'A ghostly DJ with spectral turntables, orbiting vinyl records, neon sound waves',
};

// ── Gemini client ──
let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
    if (!genAI) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('ERROR: GEMINI_API_KEY environment variable is not set');
            process.exit(1);
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

async function extractImageData(result: any): Promise<Buffer> {
    const candidate = result.response.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    for (const part of parts) {
        if ((part as any).inlineData) {
            const { data } = (part as any).inlineData;
            return Buffer.from(data, 'base64');
        }
    }
    const finishReason = candidate?.finishReason || 'unknown';
    const textParts = parts.filter((p: any) => p.text).map((p: any) => p.text).join(' ');
    throw new Error(`No image in response (finishReason=${finishReason}${textParts ? `, text: ${textParts.slice(0, 200)}` : ''})`);
}

async function withRetry<T>(fn: () => Promise<T>, label: string, retries = MAX_RETRIES): Promise<T> {
    for (let i = 0; i <= retries; i++) {
        try {
            return await fn();
        } catch (err: any) {
            if (i === retries) {
                console.error(`  FAILED after ${retries + 1} attempts: ${err.message}`);
                throw err;
            }
            const wait = 2000 * (i + 1);
            console.warn(`  Attempt ${i + 1} failed for ${label}: ${err.message}, retrying in ${wait}ms...`);
            await sleep(wait);
        }
    }
    throw new Error('Unreachable');
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function toSnakeCase(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

// ── Generation tasks ──

interface ArtTask {
    label: string;
    outputPath: string;
    generate: () => Promise<Buffer>;
}

function buildTasks(): ArtTask[] {
    const tasks: ArtTask[] = [];

    // 1. Character portraits (5 × 1024px)
    for (const archetype of Object.keys(ARCHETYPES)) {
        const outPath = path.join(OUTPUT_ROOT, 'characters', `${archetype}.png`);
        const desc = ARCHETYPE_CHARACTER_PROMPTS[archetype];
        const palette = ARCHETYPE_PALETTES[archetype];
        const prompt = `Generate a single full-body street mage character portrait of ${desc}. IMPORTANT: Only ONE character — do not duplicate or mirror the figure. Show from head to toe in a powerful idle standing pose, centered in the frame. Dark moody urban background with neon lighting. Color palette: ${palette}. No text, no words, no letters. ${ART_STYLE}`;

        tasks.push({
            label: `character/${archetype}`,
            outputPath: outPath,
            generate: async () => {
                const model = getImageModel();
                const result = await model.generateContent([{ text: prompt }]);
                return extractImageData(result);
            },
        });
    }

    // 2. Card art (50 × 4:3 landscape)
    for (const [archetypeId, archetype] of Object.entries(ARCHETYPES)) {
        const palette = ARCHETYPE_PALETTES[archetypeId];
        for (const card of archetype.cards) {
            const outPath = path.join(OUTPUT_ROOT, 'cards', `${card.imageId}.png`);

            const prompt = `CRITICAL: The artwork must have ZERO border, ZERO frame, ZERO margin. Color must touch every single edge of the image. Do NOT add any white, black, or colored border/frame around the artwork.

Generate card art in landscape 4:3 aspect ratio for a neon-soaked 1980s urban magic card game.
Card: "${card.name}" - ${card.description}
Card type: ${card.type}
Color palette: ${palette}
No text, no words, no letters, no numbers. Centered iconic composition, suitable for a small card thumbnail. ${ART_STYLE}`;

            tasks.push({
                label: `card/${card.imageId}`,
                outputPath: outPath,
                generate: async () => {
                    const model = getImageModel();
                    const result = await model.generateContent([{ text: prompt }]);
                    return extractImageData(result);
                },
            });
        }
    }

    // 3. Enemy art (20 × 512px)
    for (const [enemyId, description] of Object.entries(ENEMY_DESCRIPTIONS)) {
        const outPath = path.join(OUTPUT_ROOT, 'enemies', `${enemyId}.png`);
        const prompt = `CRITICAL: The artwork must have ZERO border, ZERO frame, ZERO margin. Color must touch every single edge of the image. Do NOT add any white, black, or colored border/frame around the artwork.

Generate a monster/creature portrait for a neon-soaked 1980s urban magic card game.
Subject: ${description}
Show the creature in an aggressive or menacing pose. Dark urban background with neon lighting. No text, no words. ${ART_STYLE}`;

        tasks.push({
            label: `enemy/${enemyId}`,
            outputPath: outPath,
            generate: async () => {
                const model = getImageModel();
                const result = await model.generateContent([{ text: prompt }]);
                return extractImageData(result);
            },
        });
    }

    return tasks;
}

// ── Main ──

async function main() {
    const allTasks = buildTasks();

    // Filter to only tasks whose output doesn't exist yet
    const pending = allTasks.filter(t => !fs.existsSync(t.outputPath));
    const skipped = allTasks.length - pending.length;

    console.log(`\n🎨 Selfie the Spire — Art Generator`);
    console.log(`   Total: ${allTasks.length} images`);
    console.log(`   Skipping: ${skipped} (already exist)`);
    console.log(`   Generating: ${pending.length}\n`);

    if (pending.length === 0) {
        console.log('All art assets already exist. Nothing to do!');
        return;
    }

    let completed = 0;
    let failed = 0;

    for (const task of pending) {
        const progress = `[${completed + failed + 1}/${pending.length}]`;
        console.log(`${progress} Generating ${task.label}...`);

        try {
            const imageData = await withRetry(task.generate, task.label);

            // Ensure output directory exists
            const dir = path.dirname(task.outputPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(task.outputPath, imageData);
            console.log(`  ✓ Saved ${path.relative(OUTPUT_ROOT, task.outputPath)}`);
            completed++;
        } catch (err: any) {
            console.error(`  ✗ Failed: ${err.message}`);
            failed++;
        }

        // Rate limit
        if (pending.indexOf(task) < pending.length - 1) {
            await sleep(RATE_LIMIT_MS);
        }
    }

    console.log(`\n✨ Done! Generated: ${completed}, Failed: ${failed}, Skipped: ${skipped}`);

    if (failed > 0) {
        console.log(`\nRe-run the script to retry failed images (they'll be picked up automatically).`);
        process.exit(1);
    }
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
