import { state } from './state';
import { els } from './elements';
import { updateMicUI, updateHighlight, scrollToCurrent, advancePastSkipped, restartScript } from './render';

// Track the last processed transcript length to only process NEW words
let lastProcessedLength = 0;

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
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            const allSpokenWords = transcript.trim().toLowerCase().split(/\s+/);

            const recentString = allSpokenWords.slice(-5).join(' ');
            if (state.config.voiceCommandsEnabled && recentString.includes('prompter restart')) {
                restartScript();
                lastProcessedLength = 0; // Reset on restart
                return;
            }

            // Only process NEW words that weren't in the previous transcript
            const currentLength = allSpokenWords.length;
            if (currentLength <= lastProcessedLength) {
                // No new words, skip processing
                return;
            }

            // Get only the new words since last processing
            const newWords = allSpokenWords.slice(lastProcessedLength);
            lastProcessedLength = currentLength;

            matchWords(newWords);
        };

        state.recognition.onend = () => {
            if (state.isListening) {
                try {
                    state.recognition.start();
                } catch (error) {
                    console.error('Failed to restart speech recognition:', error);
                }
            } else {
                updateMicUI(false);
                lastProcessedLength = 0; // Reset when stopping
            }
        };
    }
}

export function startListening(): void {
    if (!state.recognition) return;
    state.isListening = true;
    lastProcessedLength = 0; // Reset on start
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
    lastProcessedLength = 0; // Reset on stop
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
