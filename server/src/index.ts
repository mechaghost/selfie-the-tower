import 'dotenv/config';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { characterRoute } from './routes/character.js';

const app = new Hono();

app.use('*', cors());
app.route('/api', characterRoute);

app.get('/health', (c) => c.json({ status: 'ok' }));

// Serve the built client in production
app.use('/*', serveStatic({ root: '../dist' }));
app.use('/*', serveStatic({ root: '../dist', path: '/index.html' }));

const port = parseInt(process.env.PORT || '3001', 10);

serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}`);
});
