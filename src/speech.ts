import { state } from './state';
import { els } from './elements';
import { updateMicUI, updateHighlight, scrollToCurrent, advancePastSkipped, restartScript, navigateSentences } from './render';

// Track the last matched word to prevent matching the same word twice in a row
let lastMatchedWord = '';

// Track which result indices we already processed for commands
// to prevent re-firing when the recognition engine revisits finalized results
let lastProcessedResultIndex = -1;
let speechBlocked = false;

// Arc / silent-fail detection
let isFirstStart = true;
let gotResultOnFirstStart = false;

const isBrave = !!(navigator as any).brave;

function showBrowserWarning() {
    els.browserWarning.classList.remove('hidden');
}

function showSpeechServiceWarning(errorType: 'service-not-allowed' | 'not-allowed') {
    const { speechServiceWarning, speechServiceWarningTitle, speechServiceWarningBody } = els;

    if (errorType === 'not-allowed') {
        speechServiceWarningTitle.textContent = 'Microphone Access Denied';
        speechServiceWarningBody.innerHTML =
            'VoicePrompter needs microphone access to follow your voice.<br><br>' +
            'Click the <strong class="text-neutral-200">lock icon</strong> in your browser\'s address bar, ' +
            'set <strong class="text-neutral-200">Microphone</strong> to Allow, then reload the page.';
    } else if (isBrave) {
        speechServiceWarningTitle.textContent = 'Brave Shields Blocking Voice';
        speechServiceWarningBody.innerHTML =
            'Brave\'s privacy shields block the speech recognition service used by this app.<br><br>' +
            '<strong class="text-neutral-200">To enable voice scrolling in Brave:</strong><br>' +
            '1. Click the <strong class="text-neutral-200">Brave Shields icon</strong> (🦁) in the address bar<br>' +
            '2. Toggle <strong class="text-neutral-200">Shields</strong> off for this site<br>' +
            '3. Reload the page<br><br>' +
            'Or switch to <strong class="text-neutral-200">Chrome</strong>, ' +
            '<strong class="text-neutral-200">Edge</strong>, or ' +
            '<strong class="text-neutral-200">Safari</strong>.';
    } else {
        speechServiceWarningTitle.textContent = 'Voice Recognition Blocked';
        speechServiceWarningBody.innerHTML =
            'Your browser or network is blocking the speech recognition service.<br><br>' +
            'Try <strong class="text-neutral-200">Chrome</strong>, ' +
            '<strong class="text-neutral-200">Edge</strong>, or ' +
            '<strong class="text-neutral-200">Safari</strong> for voice scrolling.';
    }

    speechServiceWarning.classList.remove('hidden');
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
        matchWords(spokenWords.slice(-5));
    };

    state.recognition.onerror = (e: any) => {
        console.log('error:', e.error, e.message);

        // Arc / silent-fail detection: error fires immediately on first start with no results
        if (isFirstStart && !gotResultOnFirstStart) {
            isFirstStart = false;
            if (e.error === 'service-not-allowed') {
                showSpeechServiceWarning('service-not-allowed');
            } else if (e.error === 'not-allowed' || e.error === 'audio-capture') {
                showSpeechServiceWarning('not-allowed');
            } else if (e.error !== 'aborted') {
                // 'aborted' on Safari iOS = permission dialog interrupted first start; not an error
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

