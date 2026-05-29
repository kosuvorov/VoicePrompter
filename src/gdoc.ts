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

    const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt&cb=${Date.now()}`;
    
    // List of public CORS proxies to try, ordered by likelihood of production success.
    // We put allorigins first as it has fewer origin restrictions on custom domains.
    const proxies = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(exportUrl)}`,
        `https://corsproxy.io/?${encodeURIComponent(exportUrl)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(exportUrl)}`
    ];

    let lastError: any = null;

    for (const proxyUrl of proxies) {
        try {
            // Fetch with a 6-second timeout per proxy to keep the experience responsive
            const response = await fetchWithTimeout(proxyUrl, { cache: 'no-store' }, 6000);
            if (!response.ok) {
                throw new Error(`Proxy returned status ${response.status}`);
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
        } catch (error: any) {
            console.warn(`Failed to fetch via proxy ${proxyUrl}:`, error);
            lastError = error;
            // Continue to the next proxy
        }
    }

    // If all proxies failed, report the error details
    const isPermissionError = lastError?.message && lastError.message.includes('access denied');
    if (isPermissionError) {
        throw lastError;
    }
    
    throw new Error('Failed to connect to Google Docs. Please verify your document is shared with "Anyone with the link" as a Viewer, or try again later.');
}
