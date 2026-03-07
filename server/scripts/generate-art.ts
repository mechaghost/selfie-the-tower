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
const ART_STYLE = `Risograph print illustration in the style of 1980s city pop album covers and retro arcade art: bold halftone grain, limited ink palette with overprint effects, thick outlines, stylized proportions, dramatic neon lighting against urban nightscapes. Textured like layered screen prints on rough paper. Mix of Japanese manga influence and 80s American street art.`;

// ── Archetype prompts ──
const ARCHETYPE_CHARACTER_PROMPTS: Record<string, string> = {
    neon: 'a street pyromancer wreathed in neon flame tattoos that glow, wearing a vintage bomber jacket with glowing kanji patches, fingerless gloves crackling with fire, neon signs flickering behind them in a dark alley',
    chrome: 'a rain walker surrounded by floating rain droplets and chrome reflections, wearing a sleek silver trench coat with mirror-finish accents, rain-soaked city street behind them with reflected neon',
    volt: 'a punk mage crackling with electricity from rooftop antenna arrays, wearing torn punk vest with circuit-board patches, headphones around neck sparking with energy, radio tower silhouette behind them',
    concrete: 'an urban druid entwined with vines bursting through cracked pavement, wearing work boots and a moss-covered denim jacket with glowing rune graffiti, abandoned warehouse behind them with overgrown walls',
    smoke: 'an alley ghost dissolving into city fog and cigarette smoke, wearing a dark hoodie with phosphorescent trim, flickering streetlight above them, shadows pooling unnaturally at their feet in a narrow alley',
};

const ARCHETYPE_PALETTES: Record<string, string> = {
    neon: 'vermillion red, hot orange, molten amber, and neon pink. Neon signs, spray paint, flame',
    chrome: 'teal, electric cyan, silver chrome, and deep navy. Rain, reflections, wet streets',
    volt: 'electric violet, neon yellow, white lightning, and deep purple. Sparks, circuits, antenna glow',
    concrete: 'olive green, terracotta brown, warm amber, and moss. Vines, cracked concrete, graffiti',
    smoke: 'deep purple, lavender mist, ghostly white, and charcoal. Fog, smoke trails, flickering light',
};

// ── Enemy art descriptions ──
const ENEMY_DESCRIPTIONS: Record<string, string> = {
    alley_rat: 'A large mutant rat with glowing neon-pink eyes, scurrying through a dark neon-lit alley. Matted fur with bioluminescent patches. Trash and broken bottles around it.',
    neon_junkie: 'A twitchy humanoid figure with cracked glowing neon tubes embedded in their skin, wearing tattered rave clothes. Eyes wild and unfocused, sparking with unstable energy.',
    graffiti_imp: 'A small mischievous creature made of living spray paint, dripping colors. Graffiti wings, sharp paint-splatter teeth, hovering near a tagged wall.',
    stray_voltage: 'A floating ball of crackling electricity with a vaguely skull-like face, arcing between power lines. Blue-white lightning tendrils, sparks raining down.',
    dumpster_crawler: 'A hulking creature assembled from dumpster parts — rusted metal plates as armor, a trash can lid shield, glowing eyes peering from behind refuse. Urban junkyard golem.',
    smoke_specter: 'A translucent ghostly figure formed from exhaust fumes and cigarette smoke, drifting through a foggy alley. Hollow glowing eyes, wispy tendrils for hands.',
    taxi_ghost: 'A spectral taxi driver, translucent and glowing yellow-green, emerging from a wrecked 1980s taxi cab. Ghostly meter still running, headlights like eyes.',
    manhole_mimic: 'A manhole cover that has sprouted metallic jaws and tentacle-like pipes, lurching up from the street. Steam pouring out, iron teeth gleaming under streetlights.',
    boombox_brute: 'A massive muscular figure carrying a giant ghetto blaster that radiates visible sound waves. Gold chains, headband, torn tank top, sneakers. Pure 80s muscle.',
    neon_wraith: 'An ethereal being made of bent and broken neon sign tubes, floating above the street. Flickering between forms, casting colored light and shadow. Beautiful and terrifying.',
    payphone_phantom: 'A haunted payphone booth come alive — the receiver is a screaming mouth, the cord writhes like a snake, coins orbit it like electrons. Cracked glass panels glow.',
    sewer_slime: 'A massive blob of iridescent toxic sewer sludge with multiple glowing eyes. Bubbling, oozing up from a storm drain grate. Chemical rainbow sheen on its surface.',
    fire_escape_spider: 'A giant mechanical spider made of fire escape ladders and iron railings. Riveted joints, rust-red body, webs of twisted metal cable. Climbing a brick wall.',
    vending_golem: 'A rogue vending machine that has grown legs and arms from its internal mechanisms. Cracked display showing error codes, cans and bottles as projectiles. Menacing stance.',
    circuit_breaker: 'A towering armored figure made of fused electrical switchgear and transformer parts. Sparking circuit patterns across its body, massive fist crackling with power. Industrial and imposing.',
    neon_yakuza: 'A sleek, dangerous figure in a neon-trimmed black suit with a glowing katana. Irezumi tattoos visible, glowing with inner light. Rain-slicked rooftop, city lights behind.',
    chrome_bouncer: 'A huge chrome-plated humanoid bouncer with mirror-finish skin, wearing a black suit that strains against metallic muscles. Velvet rope in one hand, reflecting neon signs.',
    the_billboard: 'A massive living neon billboard sign that has ripped free from a rooftop. Hundreds of light bulbs form a shifting face. Electric tentacles of wire, towering over the street.',
    subway_wyrm: 'A dragon-like creature made of subway cars and train parts, bursting from a tunnel mouth. Rails for horns, sparking third-rail electricity, graffiti-covered scales.',
    dj_phantom: 'A ghostly DJ hovering behind spectral turntables, headphones fused to a skull-like head. Vinyl records orbit like weapons. Sound waves visible as neon rings. Rave energy.',
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
        const prompt = `Generate a full-body character portrait of ${desc}. Show from head to toe in a powerful idle standing pose. The background should be a dark neon-lit urban alley with subtle city elements. ${ART_STYLE}`;

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

    // 2. Card art (50 × 512px)
    for (const [archetypeId, archetype] of Object.entries(ARCHETYPES)) {
        const palette = ARCHETYPE_PALETTES[archetypeId];
        for (const card of archetype.cards) {
            const cardSlug = toSnakeCase(card.name);
            const imageId = `${archetypeId}_${cardSlug}`;
            const outPath = path.join(OUTPUT_ROOT, 'cards', `${imageId}.png`);

            const prompt = `Generate a square card art illustration for a neon-soaked 1980s urban magic card game.
Card: "${card.name}" - ${card.description}
Card type: ${card.type}
Color palette: ${palette}
No text, no words, no letters. Centered iconic composition, suitable for a small card thumbnail. ${ART_STYLE}`;

            tasks.push({
                label: `card/${imageId}`,
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
        const prompt = `Generate a monster/creature portrait for a neon-soaked 1980s urban magic card game.
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
