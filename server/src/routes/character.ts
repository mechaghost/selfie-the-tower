import { Hono } from 'hono';
import { moderateSelfie, analyzeSelfie } from '../services/gemini.js';
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
            // Step 1: Moderate the selfie
            console.log('Moderating selfie...');
            const moderation = await moderateSelfie(body.image);
            if (!moderation.valid) {
                console.log('Selfie rejected:', moderation.reason);
                return c.json({ error: moderation.reason || 'Please upload a clear photo of your face' }, 422);
            }
            console.log('Selfie approved');

            // Step 2: Analyze for archetype
            console.log('Analyzing selfie with Gemini...');
            const analysis = await analyzeSelfie(body.image);
            console.log('Gemini analysis:', JSON.stringify(analysis));

            // Step 3: Build character with static art paths
            const portraitUrl = `/assets/characters/${analysis.archetype}.png`;
            const result = generateCharacterFromAnalysis(analysis, portraitUrl);

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
