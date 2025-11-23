import './style.css';
import { registerSW } from 'virtual:pwa-register';
import { initElements, els } from './elements';
import { state } from './state';
import { detectLanguage, getLanguageName } from './utils';
import { renderScript, updateHighlight, scrollToCurrent, applySettings, renderHistoryList, restartScript } from './render';
import { initSpeech, startListening, stopListening } from './speech';
import { saveToHistory, getHistory, clearAllHistory } from './storage';
import { ScriptWord } from './types';

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
    // If auto-detect was NOT explicitly requested (i.e. just loading script),
    // use the manually selected language from dropdown.
    // If user clicked "Auto-detect", that button's handler will update the dropdown,
    // and then call loadScript, so we just trust the dropdown.
    const selectedLang = els.languageSelect.value;
    state.selectedLanguage = selectedLang;
    if (state.recognition) {
        state.recognition.lang = selectedLang;
    }
    console.log(`Using language: ${selectedLang}`);

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
    els.scriptContent.style.paddingRight = `${val}px`;
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

        // Update button styles
        (['left', 'center', 'right'] as const).forEach(a => {
            const btn = els.alignBtns[a];
            if (a === align) {
                btn.classList.remove('hover:bg-neutral-600');
                btn.classList.add('bg-neutral-500', 'text-white');
            } else {
                btn.classList.add('hover:bg-neutral-600');
                btn.classList.remove('bg-neutral-500', 'text-white');
            }
        });
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

// Language Selector
els.languageSelect.addEventListener('change', (e) => {
    const lang = (e.target as HTMLSelectElement).value;
    (window as any).umami?.track('language-select', { language: lang });
    state.selectedLanguage = lang;
    if (state.recognition) {
        state.recognition.lang = lang;
    }
    console.log(`Language changed to: ${lang}`);
});

// Auto-Detect Button
els.autoDetectBtn.addEventListener('click', () => {
    const text = els.inputScript.value.trim();
    if (!text) return alert("Please enter some text to detect language.");

    const detectedLang = detectLanguage(text);
    (window as any).umami?.track('language-auto-detect', { language: detectedLang });
    state.selectedLanguage = detectedLang;
    els.languageSelect.value = detectedLang;

    if (state.recognition) {
        state.recognition.lang = detectedLang;
    }

    // Visual feedback
    const originalText = els.autoDetectBtn.textContent;
    els.autoDetectBtn.textContent = `Detected: ${getLanguageName(detectedLang)}`;
    els.autoDetectBtn.classList.add('bg-green-600', 'text-white');

    setTimeout(() => {
        els.autoDetectBtn.textContent = originalText;
        els.autoDetectBtn.classList.remove('bg-green-600', 'text-white');
    }, 2000);
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

// Clear History Button
els.clearHistoryBtn.addEventListener('click', clearHistory);

// Initial Render
renderHistoryList(getHistory(), loadScript);

// Initialize UI with defaults
els.fontSizeVal.textContent = `${state.config.fontSize}px`;
els.fontSizeInput.value = state.config.fontSize.toString();
els.scriptContent.style.fontSize = `${state.config.fontSize}px`;

els.lineHeightVal.textContent = `${state.config.lineHeight}x`;
els.lineHeightInput.value = state.config.lineHeight.toString();
els.scriptContent.style.lineHeight = `${state.config.lineHeight}`;

els.paragraphSpacingVal.textContent = `${state.config.paragraphSpacing}em`;
els.paragraphSpacingInput.value = state.config.paragraphSpacing.toString();

els.marginVal.textContent = `${state.config.margin}px`;
els.marginInput.value = state.config.margin.toString();
els.scriptContent.style.paddingLeft = `${state.config.margin}px`;
els.scriptContent.style.paddingRight = `${state.config.margin}px`;

els.scriptContent.style.textAlign = state.config.textAlign;
// Update alignment buttons
(['left', 'center', 'right'] as const).forEach(a => {
    const btn = els.alignBtns[a];
    if (a === state.config.textAlign) {
        btn.classList.remove('hover:bg-neutral-600');
        btn.classList.add('bg-neutral-500', 'text-white');
    } else {
        btn.classList.add('hover:bg-neutral-600');
        btn.classList.remove('bg-neutral-500', 'text-white');
    }
});

els.smoothAnimationsToggle.checked = state.config.smoothAnimations;

// Dismiss Browser Warning
els.dismissWarningBtn.addEventListener('click', () => {
    els.browserWarning.classList.add('hidden');
});

applySettings();
