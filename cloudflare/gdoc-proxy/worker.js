/**
 * gdoc-proxy — Cloudflare Worker
 *
 * Fetches the plain-text export of a public Google Doc and returns it
 * with CORS headers, so the VoicePrompter web app can import scripts.
 *
 * Usage:  GET https://<worker-url>/?id=<GOOGLE_DOC_ID>
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
    const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    return {
        'Access-Control-Allow-Origin': allowed,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Vary': 'Origin',
    };
}

export default {
    async fetch(request) {
        const origin = request.headers.get('Origin') || '';
        const cors = corsHeaders(origin);

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: cors });
        }
        if (request.method !== 'GET') {
            return new Response('Method not allowed', { status: 405, headers: cors });
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
