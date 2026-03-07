import { Hono } from 'hono';
import { analyzeSelfie, generatePortrait, generateCardArt } from '../services/gemini.js';
import { generateCharacterFromAnalysis, generateMockCharacter } from '../services/generator.js';

export const characterRoute = new Hono();

characterRoute.post('/generate-character', async (c) => {
    try {
        const body = await c.req.json();
        if (!body.image) {
            return c.json({ error: 'Missing image field' }, 400);
        }

        // Use Gemini if API key is configured, otherwise fall back to mock
        if (process.env.GEMINI_API_KEY) {
            console.log('Analyzing selfie with Gemini...');
            const analysis = await analyzeSelfie(body.image);
            console.log('Gemini analysis:', JSON.stringify(analysis));

            // Build character first to get card list
            const result = generateCharacterFromAnalysis(analysis);

            // Generate portrait + all card art in parallel
            console.log(`Generating portrait + ${result.cards.length} card images...`);
            const imagePromises = [
                generatePortrait(body.image, analysis.archetype)
                    .catch((err) => { console.warn('Portrait failed:', err.message); return ''; }),
                ...result.cards.map((card) =>
                    generateCardArt(card.name, card.description, card.type, analysis.archetype)
                        .catch((err) => { console.warn(`Card art failed for ${card.name}:`, err.message); return ''; })
                ),
            ];

            const [portraitUrl, ...cardImages] = await Promise.all(imagePromises);
            console.log(`Generated: portrait=${portraitUrl ? 'yes' : 'no'}, cards=${cardImages.filter(Boolean).length}/${result.cards.length}`);

            // Attach images to results
            result.character.portraitUrl = portraitUrl;
            result.cards.forEach((card, i) => {
                if (cardImages[i]) {
                    card.imageUrl = cardImages[i];
                }
            });

            return c.json(result);
        } else {
            console.log('No GEMINI_API_KEY set, using mock generation');
            const result = generateMockCharacter();
            return c.json(result);
        }
    } catch (err: any) {
        console.error('Generation error:', err);
        return c.json({ error: err.message || 'Internal server error' }, 500);
    }
});
