import { state } from './state';
import { els } from './elements';
import { updateMicUI, updateHighlight, scrollToCurrent, advancePastSkipped, restartScript, navigateParagraphs } from './render';

// Track the last matched word to prevent matching the same word twice in a row
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
                    // Conflict resolution: look ahead up to 10 words
                    const upcomingScript = state.scriptWords.slice(state.currentIndex, state.currentIndex + 10).map(w => w.word.toLowerCase().replace(/[^\w\s]/g, ''));
                    
                    let conflict = false;
                    for (let j = 0; j < Math.max(0, upcomingScript.length - 1); j++) {
                        if (upcomingScript[j] === commandTokens[0] && upcomingScript[j+1] === commandTokens[1]) {
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
        matchWords(spokenWords.slice(-5));
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

