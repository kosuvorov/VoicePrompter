import { state } from './state';
import { els } from './elements';
import { updateMicUI, updateHighlight, scrollToCurrent, advancePastSkipped, restartScript, navigateParagraphs } from './render';

// Track the last matched word group to prevent matching the same sequence twice in a row
let lastMatchedWord = '';

// Track which result indices we already processed for commands
// to prevent re-firing when the recognition engine revisits finalized results

let speechBlocked = false;

// Voice command arming to prevent duplicate triggers
let commandArmed = true;

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

        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }

        // --- Voice Commands (Mac-Style) ---
        if (state.config.voiceCommandsEnabled) {
            const cleanTokens = transcript.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(t => t.length > 0);
            if (cleanTokens.length >= 2) {
                const lastTwoWords = cleanTokens.slice(-2).join(' ');
                let commandMatched: string | null = null;
                
                if (lastTwoWords === 'go start') commandMatched = 'go start';
                else if (lastTwoWords === 'go finish') commandMatched = 'go finish';
                else if (lastTwoWords === 'go next') commandMatched = 'go next';
                else if (lastTwoWords === 'go back') commandMatched = 'go back';
                
                if (commandMatched) {
                    const commandTokens = commandMatched.split(' ');
                    // Conflict resolution: look around the current index (back 4, forward 10)
                    const startIdx = Math.max(0, state.currentIndex - 4);
                    const endIdx = Math.min(state.scriptWords.length, state.currentIndex + 10);
                    const windowScript = state.scriptWords.slice(startIdx, endIdx).map(w => w.word.toLowerCase().replace(/[^\w\s]/g, ''));
                    
                    let conflict = false;
                    for (let j = 0; j < Math.max(0, windowScript.length - 1); j++) {
                        if (windowScript[j] === commandTokens[0] && windowScript[j+1] === commandTokens[1]) {
                            conflict = true;
                            break;
                        }
                    }
                    
                    if (!conflict) {
                        if (commandArmed) {
                            commandArmed = false;
                            console.log(`[VoiceCommand] TRIGGER: ${commandMatched}`);
                            if (commandMatched === 'go start') {
                                restartScript();
                            } else if (commandMatched === 'go finish') {
                                state.currentIndex = Math.max(0, state.scriptWords.length - 1);
                                updateHighlight();
                                scrollToCurrent();
                            } else if (commandMatched === 'go next') {
                                navigateParagraphs('forward', 1);
                            } else if (commandMatched === 'go back') {
                                navigateParagraphs('back', 1);
                            }
                            lastMatchedWord = '';
                            return; // Stop processing to prevent the command from being read as script text
                        }
                    } else {
                        commandArmed = true;
                    }
                } else {
                    commandArmed = true;
                }
            } else {
                commandArmed = true;
            }
        }

        // --- Word matching: uses all results (interim + final) for responsiveness ---
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

