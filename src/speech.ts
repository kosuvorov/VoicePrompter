import { state } from './state';
import { els } from './elements';
import { updateMicUI, updateHighlight, scrollToCurrent, advancePastSkipped, restartScript } from './render';

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
            const spokenWords = transcript.trim().toLowerCase().split(/\s+/);

            const recentString = spokenWords.slice(-5).join(' ');
            if (state.config.voiceCommandsEnabled && recentString.includes('prompter restart')) {
                restartScript();
                return;
            }

            matchWords(spokenWords.slice(-5));
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
            }
        };
    }
}

export function startListening(): void {
    if (!state.recognition) return;
    state.isListening = true;
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
    try {
        state.recognition.stop();
        updateMicUI(false);
    } catch (error) {
        console.error('Failed to stop speech recognition:', error);
    }
}

function matchWords(spokenWords: string[]) {
    if (state.currentIndex >= state.scriptWords.length) return;
    const LOOKAHEAD = state.config.lookaheadWords;

    for (let spokenWord of spokenWords) {
        // Clean spoken word: preserve letters from ALL languages (Cyrillic, Arabic, CJK, etc.)
        const cleanSpoken = spokenWord.replace(/[^\p{L}\p{N}]/gu, "");
        if (!cleanSpoken) continue;

        let scriptPtr = state.currentIndex;
        let validWordsChecked = 0;

        while (scriptPtr < state.scriptWords.length && validWordsChecked < LOOKAHEAD) {
            const scriptWordObj = state.scriptWords[scriptPtr];

            if (scriptWordObj.skip) {
                scriptPtr++;
                continue;
            }

            if (scriptWordObj.clean === cleanSpoken) {
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
}
