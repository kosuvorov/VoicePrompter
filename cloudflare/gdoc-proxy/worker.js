/**
 * gdoc-proxy — Cloudflare Worker
 *
 * Fetches the plain-text export of a public Google Doc and returns it
 * with CORS headers, so the VoicePrompter web app can import scripts.
 *
 * Usage:  GET https://<worker-url>/?id=<GOOGLE_DOC_ID>
 *
 * Abuse protection:
 *  - Requests must carry an Origin header from ALLOWED_ORIGINS
 *    (browsers set this automatically on cross-origin fetch; it blocks
 *    other sites and plain curl from using the proxy).
 *  - Per-IP rate limit via Cloudflare's ratelimit binding (see wrangler.toml).
 *
 * Deployed copy lives in the Cloudflare dashboard; this file is the
 * source of truth in the repo. Keep them in sync.
 */

const ALLOWED_ORIGINS = [
    'https://voiceprompter.app',
    'https://www.voiceprompter.app',
    'http://localhost:5173',
    'http://localhost:4173',
];

const DOC_ID_RE = /^[a-zA-Z0-9-_]{25,110}$/;

function corsHeaders(origin) {
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Vary': 'Origin',
    };
}

export default {
    async fetch(request, env) {
        const origin = request.headers.get('Origin') || '';
        if (!ALLOWED_ORIGINS.includes(origin)) {
            return new Response('Forbidden: this proxy only serves the VoicePrompter app.', { status: 403 });
        }
        const cors = corsHeaders(origin);

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: cors });
        }
        if (request.method !== 'GET') {
            return new Response('Method not allowed', { status: 405, headers: cors });
        }

        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        const { success } = await env.RATE_LIMITER.limit({ key: ip });
        if (!success) {
            return new Response('Too many requests. Please slow down and try again in a minute.', {
                status: 429,
                headers: { ...cors, 'Retry-After': '60' },
            });
        }

        const docId = new URL(request.url).searchParams.get('id') || '';
        if (!DOC_ID_RE.test(docId)) {
            return new Response('Missing or invalid ?id= Google Doc ID', { status: 400, headers: cors });
        }

        const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
        const upstream = await fetch(exportUrl, { redirect: 'follow' });

        if (!upstream.ok) {
            // 404 = doc not found; 401/403 or a redirect to a login page = not shared publicly
            const status = upstream.status === 404 ? 404 : 403;
            return new Response(
                'Could not fetch document. Make sure it is shared as "Anyone with the link" (Viewer).',
                { status, headers: cors }
            );
        }

        const contentType = upstream.headers.get('Content-Type') || '';
        if (contentType.includes('text/html')) {
            return new Response(
                'Document is not public. Share it as "Anyone with the link" (Viewer) and try again.',
                { status: 403, headers: cors }
            );
        }

        const text = await upstream.text();
        return new Response(text, {
            status: 200,
            headers: {
                ...cors,
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-store',
            },
        });
    },
};
