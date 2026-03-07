import 'dotenv/config';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { characterRoute } from './routes/character.js';

const app = new Hono();

// ── Security headers ──
app.use('*', secureHeaders());

// ── CORS: restrict to known origins ──
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:3001'];

app.use('*', cors({
    origin: (origin) => {
        if (!origin) return allowedOrigins[0]; // same-origin requests
        return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
    },
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
    maxAge: 86400,
}));

// ── Rate limiting (in-memory, per IP) ──
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // max requests per window

app.use('/api/*', async (c, next) => {
    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
        || c.req.header('x-real-ip')
        || 'unknown';

    const now = Date.now();
    let entry = rateLimitMap.get(ip);

    if (!entry || now > entry.resetAt) {
        entry = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
        rateLimitMap.set(ip, entry);
    }

    entry.count++;

    c.header('X-RateLimit-Limit', String(RATE_LIMIT_MAX));
    c.header('X-RateLimit-Remaining', String(Math.max(0, RATE_LIMIT_MAX - entry.count)));
    c.header('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > RATE_LIMIT_MAX) {
        return c.json({ error: 'Too many requests. Please try again later.' }, 429);
    }

    await next();
});

// Periodically clean up stale rate limit entries
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap) {
        if (now > entry.resetAt) rateLimitMap.delete(ip);
    }
}, 60_000);

// ── Request body size limit (5MB) ──
app.use('/api/*', async (c, next) => {
    const contentLength = c.req.header('content-length');
    if (contentLength && parseInt(contentLength, 10) > 5 * 1024 * 1024) {
        return c.json({ error: 'Request too large' }, 413);
    }
    await next();
});

app.route('/api', characterRoute);

app.get('/health', (c) => c.json({ status: 'ok' }));

// Serve the built client in production
app.use('/*', serveStatic({ root: '../dist' }));
app.use('/*', serveStatic({ root: '../dist', path: '/index.html' }));

const port = parseInt(process.env.PORT || '3001', 10);

serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}`);
});
