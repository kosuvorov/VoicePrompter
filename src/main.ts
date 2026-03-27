import './style.css';
import { registerSW } from 'virtual:pwa-register';
import { initElements, els } from './elements';
import { state } from './state';
import { renderScript, updateHighlight, scrollToCurrent, applySettings, renderHistoryList, restartScript } from './render';
import { initSpeech, startListening, stopListening } from './speech';
import { saveToHistory, getHistory, clearAllHistory } from './storage';
import { ScriptWord } from './types';
import { enterVideoMode, exitVideoMode, toggleVideoLayout, startRecording, stopRecording } from './video';
import { detect } from 'tinyld/light';

const LANG_MAP: Record<string, string> = {
    'en': 'en-US',
    'es': 'es-ES',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'it': 'it-IT',
    'pt': 'pt-PT',
    'ru': 'ru-RU',
    'ja': 'ja-JP',
    'zh': 'zh-CN',
    'ko': 'ko-KR',
    'ar': 'ar-SA',
    'nl': 'nl-NL',
    'pl': 'pl-PL',
    'uk': 'uk-UA',
    'hi': 'hi-IN',
    'tr': 'tr-TR',
    'sv': 'sv-SE',
    'da': 'da-DK',
    'fi': 'fi-FI',
    'no': 'no-NO'
};

function updateAutoDetectText(detectedVal: string | null) {
    let text = 'Auto-detect';
    if (detectedVal) {
        const option = Array.from(els.languageSelect.options).find(o => o.value === detectedVal && o.value !== 'auto');
        if (option) {
            const cleanName = option.textContent?.replace(/\s*\([^)]*\)\s*/g, '').trim() || detectedVal;
            text = `Automatic (${cleanName})`;
        }
    }
    
    // Update both select dropdowns
    const autoOpt1 = els.languageSelect.querySelector('option[value="auto"]');
    if (autoOpt1) autoOpt1.textContent = text;
    const autoOpt2 = els.languageSelectSettings.querySelector('option[value="auto"]');
    if (autoOpt2) autoOpt2.textContent = text;
}

// --- PWA Update Handling ---
registerSW({ immediate: true });

// --- Initialization ---
initElements();
initSpeech();

// --- Main Logic ---

function loadScript(text: string): void {
    if (!text) return;
    const scriptText = text.trim();
    if (!scriptText) return;

    // Save to history (unless it's a reload of the same text, handled by storage)
    saveToHistory(scriptText);

    // Detect language and update Speech Recognition
    state.languageSetting = els.languageSelect.value;
    let targetLang = state.languageSetting;

    if (targetLang === 'auto') {
        const detection = detect(scriptText);
        let mappedLang = LANG_MAP[detection] || 'en-US';
        state.detectedLanguage = mappedLang;
        targetLang = mappedLang;
        updateAutoDetectText(mappedLang);
    } else {
        state.detectedLanguage = null;
        updateAutoDetectText(null);
    }

    state.selectedLanguage = targetLang;
    if (state.recognition) {
        state.recognition.lang = targetLang;
    }


    // Instant Update Logic:
    // If preserveFormatting is ON, we want to treat newlines as actual breaks.
    // We'll use ||BR|| for this.
    let processedText = scriptText;
    if (state.config.preserveFormatting) {
        processedText = processedText.replace(/\n/g, ' ||BR|| ');
    } else {
        processedText = processedText.replace(/\n+/g, ' ||LB|| ');
    }

    const rawWords = processedText.split(/\s+/);

    let inBracket = false;
    state.scriptWords = rawWords.map(word => {
        // Check special stop sign token
        if (word === '||LB||') {
            return {
                word: '🛑',
                clean: '',
                element: null,
                skip: true,
                isStop: true
            } as ScriptWord;
        }

        // Check special break token
        if (word === '||BR||') {
            return {
                word: '',
                clean: '',
                element: null,
                skip: true,
                isBreak: true, // Flag to mark as line break
                isStop: false
            } as ScriptWord;
        }

        // Check bracket state
        if (word.startsWith('[')) inBracket = true;
        const shouldSkip = inBracket || /[\u{1F300}-\u{1F9FF}]/u.test(word); // Skip brackets and emojis
        if (word.endsWith(']')) inBracket = false;

        // Clean word for matching
        const cleanWord = word.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();

        return {
            word: word,
            clean: cleanWord,
            element: null,
            skip: shouldSkip,
            isStop: false
        } as ScriptWord;
    });

    renderScript();
    applySettings(); // Ensure settings are applied after render
}

function resetApp(): void {
    stopListening();
    els.prompterContainer.classList.add('hidden');
    els.setupScreen.classList.remove('hidden');
    renderHistoryList(getHistory(), loadScript);
}

function clearHistory(): void {
    if (confirm('Clear all recent scripts?')) {
        clearAllHistory();
        renderHistoryList(getHistory(), loadScript);
    }
}

// --- Event Listeners ---

// Load Script Button
els.loadScriptBtn.addEventListener('click', () => {
    (window as any).umami?.track('start-teleprompter');
    loadScript(els.inputScript.value);
});

// Clear Script Button
els.clearScriptBtn.addEventListener('click', () => {
    (window as any).umami?.track('clear-script');
    els.inputScript.value = '';
    els.inputScript.focus();
});

// Copy Script Button
els.copyScriptBtn.addEventListener('click', async () => {
    const text = els.inputScript.value;
    if (!text) return;
    (window as any).umami?.track('copy-script');
    try {
        await navigator.clipboard.writeText(text);
        const originalText = els.copyScriptBtn.textContent;
        els.copyScriptBtn.textContent = 'Copied!';
        setTimeout(() => els.copyScriptBtn.textContent = originalText, 1500);
    } catch (err) {
        console.error('Failed to copy!', err);
    }
});

// Paste Script Button
els.pasteScriptBtn.addEventListener('click', async () => {
    (window as any).umami?.track('paste-script');
    try {
        const text = await navigator.clipboard.readText();
        els.inputScript.value = text;
        els.inputScript.focus();
    } catch (err) {
        console.error('Failed to paste!', err);
    }
});

// Mic Button
els.micButton.addEventListener('click', () => {
    if (state.isListening) {
        (window as any).umami?.track('mic-stop');
        stopListening();
    } else {
        (window as any).umami?.track('mic-start');
        startListening();
    }
});

// Reset App Button
els.resetAppBtn.addEventListener('click', resetApp);

// Restart Script Button
els.restartScriptBtn.addEventListener('click', restartScript);

// Toggle Settings
els.toggleSettingsBtn.addEventListener('click', () => {
    (window as any).umami?.track('settings-toggle');
    els.settingsPanel.classList.toggle('hidden');
});

// Close Settings
els.closeSettingsBtn.addEventListener('click', () => {
    els.settingsPanel.classList.add('hidden');
});

// Font Size Slider
els.fontSizeInput.addEventListener('input', (e) => {
    const val = parseInt((e.target as HTMLInputElement).value);
    state.config.fontSize = val;
    els.fontSizeVal.textContent = `${val}px`;
    els.scriptContent.style.fontSize = `${val}px`;
});

// Line Height Slider
els.lineHeightInput.addEventListener('input', (e) => {
    const val = parseFloat((e.target as HTMLInputElement).value);
    state.config.lineHeight = val;
    els.lineHeightVal.textContent = `${val}x`;
    els.scriptContent.style.lineHeight = `${val}`;
});

// Paragraph Spacing Slider
els.paragraphSpacingInput.addEventListener('input', (e) => {
    const val = parseFloat((e.target as HTMLInputElement).value);
    state.config.paragraphSpacing = val;
    els.paragraphSpacingVal.textContent = `${val}em`;
    applySettings();
});

// Margin Slider
els.marginInput.addEventListener('input', (e) => {
    const val = parseInt((e.target as HTMLInputElement).value);
    state.config.margin = val;
    els.marginVal.textContent = `${val}px`;
    els.scriptContent.style.paddingLeft = `${val}px`;
    els.scriptContent.style.paddingRight = `${state.config.margin}px`;
});

// Active Line Position Slider
els.activeLinePositionInput.addEventListener('input', (e) => {
    const val = parseInt((e.target as HTMLInputElement).value);
    state.config.activeLinePosition = val;
    els.activeLinePositionVal.textContent = `${val}%`;

    // Update spacer to allow scrolling to the bottom-most position
    // If position is 90% (bottom), we need less spacer at top but more at bottom?
    // Actually, scrollToCurrent handles the positioning logic.
    // We just need to trigger a scroll update.
    scrollToCurrent();
});

// Lookahead Words Slider
els.lookaheadWordsInput.addEventListener('input', (e) => {
    const val = parseInt((e.target as HTMLInputElement).value);
    state.config.lookaheadWords = val;
    els.lookaheadWordsVal.textContent = `${val}`;
});

// Text Color Picker
els.textColorInput.addEventListener('input', (e) => {
    state.config.textColor = (e.target as HTMLInputElement).value;
    applySettings();
});

// Background Color Picker
els.bgColorInput.addEventListener('input', (e) => {
    state.config.bgColor = (e.target as HTMLInputElement).value;
    applySettings();
});

// Alignment Buttons
(['left', 'center', 'right'] as const).forEach(align => {
    els.alignBtns[align].addEventListener('click', () => {
        state.config.textAlign = align;
        els.scriptContent.style.textAlign = align;
        updateAlignmentButtons();
    });
});

// Theme Presets
els.themeDarkBtn.addEventListener('click', () => {
    state.config.bgColor = '#000000';
    state.config.textColor = '#ffffff';
    els.bgColorInput.value = '#000000';
    els.textColorInput.value = '#ffffff';
    applySettings();
});

els.themeLightBtn.addEventListener('click', () => {
    state.config.bgColor = '#ffffff';
    state.config.textColor = '#000000';
    els.bgColorInput.value = '#ffffff';
    els.textColorInput.value = '#000000';
    applySettings();
});

// Mirror Toggle
els.mirrorToggle.addEventListener('change', (e) => {
    state.isMirrored = (e.target as HTMLInputElement).checked;

    if (state.isMirrored) {
        els.scrollContainer.classList.add('mirror-mode');
    } else {
        els.scrollContainer.classList.remove('mirror-mode');
    }
});

// Stop Sign Toggle
els.stopSignToggle.addEventListener('change', (e) => {
    state.config.showStopIcon = (e.target as HTMLInputElement).checked;
    if (state.config.showStopIcon) {
        els.scriptContent.classList.add('show-stops');
    } else {
        els.scriptContent.classList.remove('show-stops');
    }
});

function handleLanguageChange(lang: string) {
    (window as any).umami?.track('language-select', { language: lang });
    state.languageSetting = lang;
    
    // Sync both selects
    els.languageSelect.value = lang;
    els.languageSelectSettings.value = lang;

    // if auto, re-detect if there is a script
    if (lang === 'auto') {
        if (els.inputScript.value.trim()) {
            const detection = detect(els.inputScript.value.trim());
            const mappedLang = LANG_MAP[detection] || 'en-US';
            state.detectedLanguage = mappedLang;
            state.selectedLanguage = mappedLang;
            updateAutoDetectText(mappedLang);
        } else {
            state.selectedLanguage = 'en-US'; // fallback empty script
            updateAutoDetectText(null);
        }
    } else {
        state.selectedLanguage = lang;
        state.detectedLanguage = null;
        updateAutoDetectText(null);
    }

    if (state.recognition) {
        state.recognition.lang = state.selectedLanguage;
    }
}

// Language Selector
els.languageSelect.addEventListener('change', (e) => {
    handleLanguageChange((e.target as HTMLSelectElement).value);
});
els.languageSelectSettings.addEventListener('change', (e) => {
    handleLanguageChange((e.target as HTMLSelectElement).value);
});

// Preserve Formatting Toggle
els.preserveFormattingToggle.addEventListener('change', (e) => {
    state.config.preserveFormatting = (e.target as HTMLInputElement).checked;

    // Instant update if we have text
    const text = els.inputScript.value.trim();
    if (text) {
        // Save current index to try and restore position
        const currentIndex = state.currentIndex;

        loadScript(text);

        // Restore position (approximate)
        if (currentIndex < state.scriptWords.length) {
            state.currentIndex = currentIndex;
            updateHighlight();
            scrollToCurrent();
        }
    }
});

// Voice Command Toggle
els.voiceCommandToggle.addEventListener('change', (e) => {
    state.config.voiceCommandsEnabled = (e.target as HTMLInputElement).checked;
});

// Screen Rotation Toggle
els.screenRotationToggle.addEventListener('change', (e) => {
    state.isScreenRotated = (e.target as HTMLInputElement).checked;

    if (state.isScreenRotated) {
        document.body.classList.add('screen-rotated');
    } else {
        document.body.classList.remove('screen-rotated');
    }
});

// Smooth Animations Toggle
els.smoothAnimationsToggle.addEventListener('change', (e) => {
    state.config.smoothAnimations = (e.target as HTMLInputElement).checked;
    applySettings();
});

// Highlight Active Word Toggle
els.highlightActiveWordToggle.addEventListener('change', (e) => {
    state.config.highlightActiveWord = (e.target as HTMLInputElement).checked;
    applySettings();
    updateHighlight();
});

// Clear History Button
els.clearHistoryBtn.addEventListener('click', clearHistory);

// Dismiss Browser Warning
els.dismissWarningBtn.addEventListener('click', () => {
    els.browserWarning.classList.add('hidden');
});

// --- Video Mode Event Listeners ---

// Toggle Video Mode
els.videoModeBtn.addEventListener('click', () => {
    if (state.isVideoMode) {
        exitVideoMode();
    } else {
        enterVideoMode();
    }
});

// Toggle Video Layout
els.videoLayoutToggleBtn.addEventListener('click', toggleVideoLayout);

// Start Recording
els.videoRecordBtn.addEventListener('click', startRecording);

// Stop Recording
els.videoStopBtn.addEventListener('click', stopRecording);

// Exit Video Mode
els.videoExitBtn.addEventListener('click', exitVideoMode);

// --- Initialization ---
function initializeUI(): void {
    // Set UI values from state
    els.fontSizeVal.textContent = `${state.config.fontSize}px`;
    els.fontSizeInput.value = state.config.fontSize.toString();

    els.lineHeightVal.textContent = `${state.config.lineHeight}x`;
    els.lineHeightInput.value = state.config.lineHeight.toString();

    els.paragraphSpacingVal.textContent = `${state.config.paragraphSpacing}em`;
    els.paragraphSpacingInput.value = state.config.paragraphSpacing.toString();

    els.marginVal.textContent = `${state.config.margin}px`;
    els.marginInput.value = state.config.margin.toString();

    els.activeLinePositionVal.textContent = `${state.config.activeLinePosition}%`;
    els.activeLinePositionInput.value = state.config.activeLinePosition.toString();

    els.lookaheadWordsVal.textContent = `${state.config.lookaheadWords}`;
    els.lookaheadWordsInput.value = state.config.lookaheadWords.toString();

    // Update alignment buttons
    updateAlignmentButtons();

    els.smoothAnimationsToggle.checked = state.config.smoothAnimations;
    els.highlightActiveWordToggle.checked = state.config.highlightActiveWord;

    // Render history
    renderHistoryList(getHistory(), loadScript);

    els.languageSelect.value = state.languageSetting;
    els.languageSelectSettings.value = state.languageSetting;

    // Apply all settings to DOM
    applySettings();
}

function updateAlignmentButtons(): void {
    (['left', 'center', 'right'] as const).forEach(a => {
        const btn = els.alignBtns[a];
        const isActive = a === state.config.textAlign;
        btn.classList.toggle('bg-neutral-500', isActive);
        btn.classList.toggle('text-white', isActive);
        btn.classList.toggle('hover:bg-neutral-600', !isActive);
    });
}

initializeUI();
