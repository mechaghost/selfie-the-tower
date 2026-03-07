import { Hono } from 'hono';
import { analyzeSelfie } from '../services/gemini.js';
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
            const result = generateCharacterFromAnalysis(analysis);
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
