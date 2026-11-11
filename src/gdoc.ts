/**
 * Utility functions for Google Docs integration.
 */

/**
 * Extracts the Google Document ID from a standard Google Doc URL.
 * Matches formats:
 * - https://docs.google.com/document/d/DOC_ID/edit
 * - https://docs.google.com/document/d/DOC_ID/export?format=txt
 * - https://docs.google.com/document/d/DOC_ID/
 */
export function extractDocId(url: string): string | null {
    const docIdRegex = /\/document\/d\/([a-zA-Z0-9-_]{25,110})/;
    const match = url.match(docIdRegex);
    return match ? match[1] : null;
}

/**
 * Fetches a URL with a strict timeout using AbortController.
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 6000): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (err) {
        clearTimeout(id);
        throw err;
    }
}

/**
 * Fetches the plain text of a Google Doc using a CORS proxy.
 * Google Doc must be shared publicly (Anyone with the link can view).
 */
export async function fetchGoogleDocText(docUrl: string): Promise<string> {
    const docId = extractDocId(docUrl);
    if (!docId) {
        throw new Error('Invalid Google Doc URL. Please check the link and try again.');
    }

    // Routed exclusively through our own Cloudflare Worker
    // (source: cloudflare/gdoc-proxy/worker.js). This previously fell back to
    // public CORS proxies (allorigins, corsproxy.io) which were unreliable — all
    // were down as of July 2026 — and which would have relayed the user's
    // document through unaffiliated third parties. A first-party-only path is
    // both more predictable and a better match for the app's privacy promise.
    const proxyUrl = `https://gdoc-proxy.kosuvorov.workers.dev/?id=${docId}`;

    let response: Response;
    try {
        // 6-second timeout to keep the experience responsive
        response = await fetchWithTimeout(proxyUrl, { cache: 'no-store' }, 6000);
    } catch (error) {
        console.warn('Google Doc import: request to the document proxy failed:', error);
        throw new Error('Couldn\'t reach the document service. Please check your connection and try again.');
    }

    if (!response.ok) {
        if (response.status === 403 || response.status === 404) {
            throw new Error('Document access denied. Please verify your Google Doc is shared with "Anyone with the link" as a Viewer.');
        }
        throw new Error(`Couldn't retrieve the document (error ${response.status}). Please try again later.`);
    }

    const text = await response.text();
    if (!text || text.trim().length === 0) {
        throw new Error('The retrieved document is empty.');
    }

    // Check if we received HTML (login page redirect)
    if (text.trim().startsWith('<!DOCTYPE html>') || text.includes('<html')) {
        if (text.includes('google-signin') || text.includes('accounts.google.com') || text.includes('ServiceLogin')) {
            throw new Error('Document access denied. Please verify your Google Doc is shared with "Anyone with the link" as a Viewer.');
        }
        throw new Error('Failed to retrieve plain text. The page was redirected.');
    }

    return text;
}
