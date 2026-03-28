import { state } from './state';
import { els } from './elements';
import { updateMicUI, updateHighlight, scrollToCurrent, advancePastSkipped, restartScript, navigateSentences } from './render';

// Track the last matched word to prevent matching the same word twice in a row
let lastMatchedWord = '';

// Track which result indices we already processed for commands
// to prevent re-firing when the recognition engine revisits finalized results
let lastProcessedResultIndex = -1;
let speechBlocked = false;

export function initSpeech(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
        els.browserWarning.classList.remove('hidden');
    } else {
        state.recognition = new SpeechRecognition();
        state.recognition.continuous = true;
        state.recognition.interimResults = true;
        state.recognition.lang = state.selectedLanguage;

        state.recognition.onresult = (event: any) => {
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
            matchWords(spokenWords.slice(-5));
        };

        state.recognition.onerror = (e: any) => {
            console.log('error:', e.error, e.message);
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

    const LOOKAHEAD = state.config.lookaheadWords;

    // Create a Set of cleaned spoken words for fast lookup
    const spokenSet = new Set(
        spokenWords
            .map(w => w.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase())
            .filter(w => w.length > 0)
    );

    if (spokenSet.size === 0) return;

    // Iterate through SCRIPT words from nearest to farthest
    // This ensures we always advance to the nearest matching word
    let scriptPtr = state.currentIndex;
    let validWordsChecked = 0;

    while (scriptPtr < state.scriptWords.length && validWordsChecked < LOOKAHEAD) {
        const scriptWordObj = state.scriptWords[scriptPtr];

        if (scriptWordObj.skip) {
            scriptPtr++;
            continue;
        }

        // Check if this script word was spoken
        if (spokenSet.has(scriptWordObj.clean)) {
            // Prevent matching the same word twice in a row (prevents double-jump)
            // But allow it if it's at the current position (position 0 in lookahead)
            if (scriptWordObj.clean === lastMatchedWord && validWordsChecked > 0) {
                // Same word as last match, and not at current position - skip it
                scriptPtr++;
                validWordsChecked++;
                continue;
            }

            lastMatchedWord = scriptWordObj.clean;
            state.currentIndex = scriptPtr + 1;
            advancePastSkipped();
            updateHighlight();
            scrollToCurrent();
            return;
        }

        scriptPtr++;
        validWordsChecked++;
    }
}

