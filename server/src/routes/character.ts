import { Hono } from 'hono';
import { moderateSelfie, analyzeSelfie } from '../services/gemini.js';
import { generateCharacterFromAnalysis, generateMockCharacter } from '../services/generator.js';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB in base64 chars

export const characterRoute = new Hono();

characterRoute.post('/generate-character', async (c) => {
    try {
        const body = await c.req.json();

        if (!body.image || typeof body.image !== 'string') {
            return c.json({ error: 'Missing image field' }, 400);
        }
        if (body.image.length > MAX_IMAGE_SIZE) {
            return c.json({ error: 'Image too large (max 5MB)' }, 413);
        }
        if (!body.image.startsWith('data:image/')) {
            return c.json({ error: 'Invalid image format' }, 400);
        }

        // Use Gemini if API key is configured, otherwise fall back to mock
        if (process.env.GEMINI_API_KEY) {
            // Step 1: Moderate the selfie
            const moderation = await moderateSelfie(body.image);
            if (!moderation.valid) {
                return c.json({ error: moderation.reason || 'Please upload a clear photo of your face' }, 422);
            }

            // Step 2: Analyze for archetype
            const analysis = await analyzeSelfie(body.image);

            // Step 3: Build character with static art paths
            const portraitUrl = `/assets/characters/${analysis.archetype}.png`;
            const result = generateCharacterFromAnalysis(analysis, portraitUrl);

            return c.json(result);
        } else {
            const result = generateMockCharacter();
            return c.json(result);
        }
    } catch (err: any) {
        console.error('Generation error:', err);
        return c.json({ error: 'Character generation failed. Please try again.' }, 500);
    }
});
