import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import type { Context } from 'hono';
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
const RATE_LIMIT_MAX = 3; // max generation requests per IP per minute

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

// ── Daily generation cap (global, resets at midnight UTC) ──
let dailyGenerations = 0;
let dailyResetDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const DAILY_GENERATION_CAP = parseInt(process.env.DAILY_GENERATION_CAP || '200', 10);

function checkDailyCap(): boolean {
    const today = new Date().toISOString().slice(0, 10);
    if (today !== dailyResetDate) {
        dailyGenerations = 0;
        dailyResetDate = today;
    }
    return dailyGenerations < DAILY_GENERATION_CAP;
}

function incrementDailyCap(): void {
    dailyGenerations++;
    console.log(`Daily generations: ${dailyGenerations}/${DAILY_GENERATION_CAP}`);
}

app.use('/api/generate-character', async (c, next) => {
    if (!checkDailyCap()) {
        return c.json({ error: 'Daily generation limit reached. Please try again tomorrow.' }, 503);
    }
    incrementDailyCap();
    await next();
});

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

// ── index.html with request-derived absolute URLs ──
// The og:/twitter: preview tags need absolute URLs, but the deployed domain
// isn't known at build time. Template the real origin in at serve time so
// link previews are correct on any domain (Railway default, custom, etc.).
const FALLBACK_ORIGIN = 'https://selfie-the-spire-production.up.railway.app';
let indexTemplate: string | null = null;

function serveIndex(c: Context) {
    try {
        if (indexTemplate === null) {
            // Same base as serveStatic's root: paths resolve from server/
            indexTemplate = readFileSync('../dist/index.html', 'utf8');
        }
        const proto = c.req.header('x-forwarded-proto')?.split(',')[0]?.trim() || 'https';
        const host = c.req.header('host');
        const html = host
            ? indexTemplate.replaceAll(FALLBACK_ORIGIN, `${proto}://${host}`)
            : indexTemplate;
        return c.html(html);
    } catch {
        // dist not built (dev mode) — vite serves the client itself
        return c.notFound();
    }
}

// Serve the built client in production
app.get('/', serveIndex);
app.get('/index.html', serveIndex);
app.use('/*', serveStatic({ root: '../dist' }));
app.get('/*', serveIndex);

const port = parseInt(process.env.PORT || '3001', 10);

serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}`);
});
