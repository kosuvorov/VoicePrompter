import './style.css';
import { registerSW } from 'virtual:pwa-register';
import { initElements, els } from './elements';
import { state } from './state';
import { renderScript, updateHighlight, scrollToCurrent, applySettings, renderHistoryList, restartScript } from './render';
import { initSpeech, startListening, stopListening } from './speech';
import { saveToHistory, getHistory, clearAllHistory } from './storage';
import { ScriptWord } from './types';
import { enterVideoMode, exitVideoMode, toggleVideoLayout, startRecording, stopRecording } from './video';
import { detectAll } from 'tinyld/light';

interface LangItem { id: string; name: string }

const AUTO_LANGS: LangItem[] = [
    { id: 'en-US', name: 'English' },
    { id: 'es-ES', name: 'Spanish' },
    { id: 'fr-FR', name: 'French' },
    { id: 'de-DE', name: 'German' },
    { id: 'it-IT', name: 'Italian' },
    { id: 'pt-PT', name: 'Portuguese' },
    { id: 'ru-RU', name: 'Russian' },
    { id: 'ja-JP', name: 'Japanese' },
    { id: 'zh-CN', name: 'Chinese' },
    { id: 'ko-KR', name: 'Korean' },
    { id: 'ar-SA', name: 'Arabic' },
    { id: 'nl-NL', name: 'Dutch' },
    { id: 'pl-PL', name: 'Polish' },
    { id: 'uk-UA', name: 'Ukrainian' },
    { id: 'hi-IN', name: 'Hindi' },
    { id: 'tr-TR', name: 'Turkish' },
    { id: 'sv-SE', name: 'Swedish' },
    { id: 'da-DK', name: 'Danish' },
    { id: 'fi-FI', name: 'Finnish' },
    { id: 'no-NO', name: 'Norwegian' }
].sort((a, b) => a.name.localeCompare(b.name));

const MANUAL_LANGS: LangItem[] = [
    { id: 'id-ID', name: 'Indonesian' },
    { id: 'ms-MY', name: 'Malay' },
    { id: 'ca-ES', name: 'Catalan' },
    { id: 'cs-CZ', name: 'Czech' },
    { id: 'el-GR', name: 'Greek' },
    { id: 'he-IL', name: 'Hebrew' },
    { id: 'hu-HU', name: 'Hungarian' },
    { id: 'ro-RO', name: 'Romanian' },
    { id: 'sk-SK', name: 'Slovak' },
    { id: 'th-TH', name: 'Thai' },
    { id: 'vi-VN', name: 'Vietnamese' },
    { id: 'bg-BG', name: 'Bulgarian' },
    { id: 'hr-HR', name: 'Croatian' },
    { id: 'sr-RS', name: 'Serbian' },
].sort((a, b) => a.name.localeCompare(b.name));

const LANG_MAP: Record<string, string> = {
    'en': 'en-US', 'es': 'es-ES', 'fr': 'fr-FR', 'de': 'de-DE',
    'it': 'it-IT', 'pt': 'pt-PT', 'ru': 'ru-RU', 'ja': 'ja-JP',
    'zh': 'zh-CN', 'ko': 'ko-KR', 'ar': 'ar-SA', 'nl': 'nl-NL',
    'pl': 'pl-PL', 'uk': 'uk-UA', 'hi': 'hi-IN', 'tr': 'tr-TR',
    'sv': 'sv-SE', 'da': 'da-DK', 'fi': 'fi-FI', 'no': 'no-NO'
};

function renderLanguageDropdowns() {
    [els.languageSelectContainer, els.languageSelectSettingsContainer].forEach(container => {
        container.innerHTML = `
            <button class="w-full flex items-center justify-between text-left bg-neutral-800 border border-neutral-700 rounded px-3 py-1.5 landscape:py-1 text-sm text-neutral-300 focus:ring-2 focus:ring-[#FFBB00] focus:border-transparent outline-none transition-colors hover:bg-neutral-700 min-w-[200px]" data-dropdown-toggle>
                <div class="flex flex-col flex-1 truncate">
                    <span class="font-medium dropdown-title">Auto-detect</span>
                    <span class="text-[10px] text-neutral-400 dropdown-subtitle truncate h-3 mt-0.5" style="display: none;"></span>
                </div>
                <svg class="w-4 h-4 ml-2 flex-shrink-0 text-neutral-400 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div class="absolute z-50 w-full mt-1 bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl opacity-0 scale-95 pointer-events-none transition-all duration-200 origin-top dropdown-menu overflow-hidden flex flex-col max-h-[60vh] sm:max-h-[300px]">
                <div class="overflow-y-auto no-scrollbar py-2">
                    <button class="w-full text-left px-3 py-2 hover:bg-neutral-800 transition-colors flex flex-col lang-option" data-value="auto">
                        <div class="flex items-center justify-between w-full">
                            <span class="font-medium text-white">Automatic</span>
                            <span class="text-[10px] text-neutral-500 auto-detected-label ml-2 truncate"></span>
                        </div>
                    </button>
                    
                    <div class="px-3 py-1 mt-1 flex items-center justify-between">
                        <span class="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">With Auto-Detection</span>
                    </div>
                    
                    ${AUTO_LANGS.map(lang => `
                        <button class="w-full text-left px-3 py-1.5 hover:bg-neutral-800 transition-colors flex items-center justify-between lang-option" data-value="${lang.id}">
                            <span class="text-sm text-neutral-300">${lang.name}</span>
                            <span class="text-[9px] font-bold bg-[#FFBB00]/10 text-[#FFBB00] px-1.5 py-0.5 rounded-full tracking-wider">AUTO</span>
                        </button>
                    `).join('')}

                    <div class="px-3 py-1 mt-2 flex items-center justify-between border-t border-neutral-800 pt-2">
                        <span class="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Manual Selection</span>
                    </div>

                    ${MANUAL_LANGS.map(lang => `
                        <button class="w-full text-left px-3 py-1.5 hover:bg-neutral-800 transition-colors flex items-center justify-between lang-option" data-value="${lang.id}">
                            <span class="text-sm text-neutral-300">${lang.name}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        const toggle = container.querySelector('[data-dropdown-toggle]') as HTMLButtonElement;
        const menu = container.querySelector('.dropdown-menu') as HTMLDivElement;
        const svg = toggle.querySelector('svg') as SVGElement;

        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isOpen = !menu.classList.contains('opacity-0');

            // Close all
            document.querySelectorAll('.dropdown-menu').forEach(m => {
                m.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
                const btn = m.previousElementSibling as HTMLButtonElement;
                if (btn) btn.querySelector('svg')?.classList.remove('rotate-180');
            });

            if (!isOpen) {
                menu.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
                svg.classList.add('rotate-180');

                // Smart positioning
                const rect = menu.getBoundingClientRect();
                if (rect.bottom > window.innerHeight) {
                    menu.style.bottom = '100%';
                    menu.style.top = 'auto';
                    menu.style.marginBottom = '0.5rem';
                } else {
                    menu.style.bottom = 'auto';
                    menu.style.top = '100%';
                    menu.style.marginBottom = '0';
                }
            }
        });

        const options = menu.querySelectorAll('.lang-option');
        options.forEach(opt => {
            opt.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const val = (opt as HTMLButtonElement).dataset.value!;
                handleLanguageChange(val);
                menu.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
                svg.classList.remove('rotate-180');
            });
        });
    });

    window.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
            const btn = menu.previousElementSibling as HTMLButtonElement;
            if (btn) btn.querySelector('svg')?.classList.remove('rotate-180');
        });
    });
}

function updateAutoDetectText(detectedVal: string | null) {
    let detectedName = '';
    const allLangs = [...AUTO_LANGS, ...MANUAL_LANGS];

    if (detectedVal) {
        const found = allLangs.find(l => l.id === detectedVal);
        detectedName = found ? found.name : detectedVal;
    }

    [els.languageSelectContainer, els.languageSelectSettingsContainer].forEach(container => {
        const toggleTitle = container.querySelector('.dropdown-title') as HTMLElement;
        const toggleSub = container.querySelector('.dropdown-subtitle') as HTMLElement;
        const autoOptLabel = container.querySelector('.auto-detected-label') as HTMLElement;

        if (!toggleTitle) return;

        // Ensure subtitle is always hidden since we are using brackets in the title now
        if (toggleSub) toggleSub.style.display = 'none';

        if (state.languageSetting === 'auto') {
            if (detectedName) {
                toggleTitle.textContent = `Automatic (${detectedName})`;
                if (autoOptLabel) autoOptLabel.textContent = `${detectedName} detected`;
            } else {
                toggleTitle.textContent = 'Auto-detect';
                if (autoOptLabel) autoOptLabel.textContent = '';
            }
            toggleTitle.classList.add('text-white');
            toggleTitle.classList.remove('text-neutral-300');
        } else {
            const found = allLangs.find(l => l.id === state.languageSetting);
            toggleTitle.textContent = found ? found.name : state.languageSetting;
            toggleTitle.classList.remove('text-white');
            toggleTitle.classList.add('text-neutral-300');

            if (autoOptLabel) autoOptLabel.textContent = detectedName ? `${detectedName} detected` : '';
        }
    });
}

// --- PWA Update Handling ---
registerSW({ immediate: true });

// --- Initialization ---
initElements();
initSpeech();
renderLanguageDropdowns();

// --- Toast ---
let langWarningTimer: ReturnType<typeof setTimeout> | null = null;
function showLangDetectionWarning() {
    const toast = els.langDetectionWarning;
    toast.classList.remove('hidden');
    if (langWarningTimer) clearTimeout(langWarningTimer);
    langWarningTimer = setTimeout(() => toast.classList.add('hidden'), 6000);
}

// --- Main Logic ---

function loadScript(text: string): void {
    if (!text) return;
    const scriptText = text.trim();
    if (!scriptText) return;

    // Save to history (unless it's a reload of the same text, handled by storage)
    saveToHistory(scriptText);

    // Detect language and update Speech Recognition
    let targetLang = state.languageSetting;

    if (targetLang === 'auto') {
        const results = detectAll(scriptText);
        const top = results[0];
        const confidence = top?.accuracy ?? 0;
        const detection = top?.lang ?? '';
        let mappedLang = LANG_MAP[detection] || 'en-US';
        state.detectedLanguage = mappedLang;
        targetLang = mappedLang;
        updateAutoDetectText(mappedLang);
        if (confidence < 0.5) {
            showLangDetectionWarning();
        }
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
        if (word.includes('[')) inBracket = true;
        const shouldSkip = inBracket || /[\u{1F300}-\u{1F9FF}]/u.test(word); // Skip brackets and emojis
        if (word.includes(']')) inBracket = false;

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

    // if auto, re-detect if there is a script
    if (lang === 'auto') {
        if (els.inputScript.value.trim()) {
            const results = detectAll(els.inputScript.value.trim());
            const top = results[0];
            const confidence = top?.accuracy ?? 0;
            const detection = top?.lang ?? '';
            const mappedLang = LANG_MAP[detection] || 'en-US';
            state.detectedLanguage = mappedLang;
            state.selectedLanguage = mappedLang;
            updateAutoDetectText(mappedLang);
            if (confidence < 0.5) {
                showLangDetectionWarning();
            }
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

// Dismiss iPad PWA Warning
els.dismissIpadWarningBtn.addEventListener('click', () => {
    els.ipadPwaWarning.classList.add('hidden');
});

// Dismiss Language Detection Warning
els.dismissLangWarningBtn.addEventListener('click', () => {
    els.langDetectionWarning.classList.add('hidden');
    if (langWarningTimer) clearTimeout(langWarningTimer);
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

    // Seed demo script for first-time users
    const history = getHistory();
    if (history.length === 0) {
        const demoText = `Welcome to VoicePrompter - a completely free teleprompter that works right in the browser.\nThis text is scrolling automatically as you speak following your voice.\nSee the highlighted word? That's where you are in the script right now.\nIf you want to jump to a different part, just tap any word and it syncs instantly.\nYou can also use voice commands to restart the script or skip a few lines.\nThe app can also record video with the script overlaid, so you don't need any extra software.\nIn the settings you can adjust font size, margins, line and paragraph spacing, pick a color theme and more - I encourage you to explore the settings on your own and find the best ones for you.\nThe app supports 34 languages and detects them automatically.\nOne more thing - text in square brackets gets skipped automatically [like this]. Useful for notes or reminders to yourself.\nEverything runs on your device. Nothing is sent to any server. You can even save it to your home screen and use it completely offline.\n\nNow go make something great ;)`;

        // Save to localStorage with 'demo' tag
        const demoItem = {
            id: Date.now(),
            text: demoText,
            preview: demoText.substring(0, 40) + '...',
            date: new Date().toLocaleDateString(),
            tag: 'demo'
        };
        localStorage.setItem('teleprompter_history', JSON.stringify([demoItem]));

        // Prefill textarea
        els.inputScript.value = demoText;

        // Re-render history with the demo item
        renderHistoryList(getHistory(), loadScript);
    } else {
        renderHistoryList(history, loadScript);
    }

    updateAutoDetectText(null);

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
