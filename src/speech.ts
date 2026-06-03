import { state } from './state';
import { els } from './elements';
import { updateMicUI, updateHighlight, scrollToCurrent, advancePastSkipped, restartScript, navigateSentences } from './render';

// Track the last matched word group to prevent matching the same sequence twice in a row
let lastMatchedWord = '';

// Track which result indices we already processed for commands
// to prevent re-firing when the recognition engine revisits finalized results
let lastProcessedResultIndex = -1;
let speechBlocked = false;

// Arc / silent-fail detection
let isFirstStart = true;
let gotResultOnFirstStart = false;

function showBrowserWarning() {
    els.browserWarning.classList.remove('hidden');
}

export function initSpeech(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
        // No API at all — Firefox, older browsers
        showBrowserWarning();
        return;
    }

    state.recognition = new SpeechRecognition();
    state.recognition.continuous = true;
    state.recognition.interimResults = true;
    state.recognition.lang = state.selectedLanguage;

    state.recognition.onresult = (event: any) => {
        // Mark that we got real results on first start (rules out Arc silent fail)
        if (isFirstStart) {
            gotResultOnFirstStart = true;
        }

        // --- Voice Commands: only on FINALIZED results ---
        // This ensures each command fires exactly once per utterance
        if (state.config.voiceCommandsEnabled) {
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal && i > lastProcessedResultIndex) {
                    lastProcessedResultIndex = i;
                    const finalText = event.results[i][0].transcript.trim().toLowerCase();
                    if (finalText.includes('prompter restart')) {
                        restartScript();
                        lastMatchedWord = '';
                        return;
                    }
                    if (finalText.includes('prompter back')) {
                        navigateSentences('back', 2);
                        lastMatchedWord = '';
                        return;
                    }
                    if (finalText.includes('prompter forward')) {
                        navigateSentences('forward', 2);
                        lastMatchedWord = '';
                        return;
                    }
                }
            }
        }

        // --- Word matching: uses all results (interim + final) for responsiveness ---
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        const spokenWords = transcript.trim().toLowerCase().split(/\s+/);
        // Match on a SMALL recent window, decoupled from look-ahead, so the latest words drive
        // matching. A large window keeps just-read words in play and blocks a backward re-read
        // jump until a long pause clears them; this keeps just enough to form a few groups.
        matchWords(spokenWords.slice(-(state.config.matchGroupSize + 3)));
    };

    state.recognition.onerror = (e: any) => {
        console.log('error:', e.error, e.message);

        // Arc / silent-fail detection: error fires immediately on first start with no results
        if (isFirstStart && !gotResultOnFirstStart) {
            isFirstStart = false;
            if (e.error === 'not-allowed' || e.error === 'service-not-allowed' || e.error === 'audio-capture' || e.error === 'aborted') {
                // These are legitimate errors that don't mean the browser lacks support
                // 'aborted' happens on Safari iOS when the permission dialog interrupts the first recognition start
            } else {
                showBrowserWarning();
            }
            state.isListening = false;
            updateMicUI(false);
            return;
        }

        if (e.error === 'aborted') {
            speechBlocked = true;

            // Modern iPad detection
            const isIPad = navigator.userAgent.includes('iPad') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 2);
            const isPWA = (window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches;

            if (isIPad && isPWA) {
                els.ipadPwaWarning.classList.remove('hidden');
            }

            state.isListening = false;
            updateMicUI(false);
            return;
        }
    };

    state.recognition.onend = () => {
        console.log('ended');

        // Arc / silent-fail detection: ended immediately on first start with no results and no error
        if (isFirstStart && !gotResultOnFirstStart) {
            isFirstStart = false;
            showBrowserWarning();
            state.isListening = false;
            updateMicUI(false);
            return;
        }
        isFirstStart = false;

        if (speechBlocked) return;
        if (state.isListening) {
            lastProcessedResultIndex = -1; // Reset for new recognition session
            try {
                state.recognition.start();
            } catch (error) {
                console.error('Failed to restart speech recognition:', error);
            }
        } else {
            updateMicUI(false);
        }
    };
}

export function startListening(): void {
    if (!state.recognition) return;
    state.isListening = true;
    lastMatchedWord = '';
    lastProcessedResultIndex = -1;
    speechBlocked = false;
    try {
        state.recognition.start();
        updateMicUI(true);
    } catch (error) {
        console.error('Failed to start speech recognition:', error);
        state.isListening = false;
        updateMicUI(false);
    }
}

export function stopListening(): void {
    if (!state.recognition) return;
    state.isListening = false;
    lastMatchedWord = '';
    lastProcessedResultIndex = -1;
    try {
        state.recognition.stop();
        updateMicUI(false);
    } catch (error) {
        console.error('Failed to stop speech recognition:', error);
    }
}

function matchWords(spokenWords: string[]) {
    if (state.currentIndex >= state.scriptWords.length) return;
    if (spokenWords.length === 0) return;

    const GROUP = Math.max(1, state.config.matchGroupSize);  // match consecutive word groups (bigrams by default)
    const LOOKAHEAD = state.config.lookaheadWords * GROUP;    // longer sequences => scan proportionally farther

    // Clean spoken words, then build the set of consecutive spoken n-grams for fast lookup
    const cleaned = spokenWords
        .map(w => w.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase())
        .filter(w => w.length > 0);
    if (cleaned.length < GROUP) return;

    const spokenGroups = new Set<string>();
    for (let i = 0; i + GROUP <= cleaned.length; i++) {
        spokenGroups.add(cleaned.slice(i, i + GROUP).join(' '));
    }

    // Read GROUP non-skip script words from `anchor` going in `dir`, returning the group's
    // forward-order key and the index of its trailing (highest) word, or null at the script edge.
    const groupAt = (anchor: number, dir: 1 | -1): { key: string; tail: number } | null => {
        const words: string[] = [];
        let ptr = anchor;
        let tail = anchor;
        while (ptr >= 0 && ptr < state.scriptWords.length && words.length < GROUP) {
            const w = state.scriptWords[ptr];
            if (!w.skip) {
                words.push(w.clean);
                tail = Math.max(tail, ptr);
            }
            ptr += dir;
        }
        if (words.length < GROUP) return null;
        if (dir === -1) words.reverse();  // express backward runs in forward reading order
        return { key: words.join(' '), tail };
    };

    // Scan candidate anchors outward in `dir`, jumping to the nearest spoken group match
    const scan = (start: number, dir: 1 | -1): boolean => {
        let anchor = start;
        let checked = 0;
        while (anchor >= 0 && anchor < state.scriptWords.length && checked < LOOKAHEAD) {
            if (state.scriptWords[anchor].skip) {
                anchor += dir;
                continue;
            }
            const group = groupAt(anchor, dir);
            if (group && spokenGroups.has(group.key)) {
                // Prevent re-matching the same group, but allow it at the nearest position
                if (group.key === lastMatchedWord && checked > 0) {
                    anchor += dir;
                    checked++;
                    continue;
                }
                lastMatchedWord = group.key;
                state.currentIndex = group.tail + 1;
                advancePastSkipped();
                updateHighlight();
                scrollToCurrent();
                return true;
            }
            anchor += dir;
            checked++;
        }
        return false;
    };

    // Look forward first (nearest upcoming words); if nothing matches, look back so a re-read
    // passage jumps backward too. The recent-words window (see caller) is kept small and
    // independent of LOOKAHEAD so just-read words clear quickly and don't block a backward jump.
    if (!scan(state.currentIndex, 1) && state.config.lookBackEnabled) {
        scan(state.currentIndex - 1, -1);
    }
}

