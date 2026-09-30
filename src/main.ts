import './style.css';
import { registerSW } from 'virtual:pwa-register';
import { initElements, els } from './elements';
import { state } from './state';
import { renderScript, updateHighlight, scrollToCurrent, applySettings, renderHistoryList, restartScript, stopChaseScroll } from './render';
import { initSpeech, startListening, stopListening } from './speech';
import { autoScrollManager } from './autoscroll';
import { saveToHistory, getHistory, clearAllHistory } from './storage';
import { ScriptWord, ScrollingMode } from './types';
import { enterVideoMode, exitVideoMode, toggleVideoLayout, startRecording, stopRecording, flipCamera, getMediaConstraints } from './video';
import { fetchGoogleDocText } from './gdoc';
import { enumerateAndPopulateDevices } from './devices';
import { initLanguageUI, updateAutoDetectText, applyLanguageForScript } from './language';
import { initPromoBanner, startPromoAnimation, stopPromoAnimation } from './promo-banner';

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// --- PWA Update Handling ---
registerSW({ immediate: true });

// --- Initialization ---
initElements();
initSpeech();
initLanguageUI();
initPromoBanner();

// --- Main Logic ---

function loadScript(text: string, googleDocUrl: string | null = null): void {
    if (!text) return;
    const scriptText = text.trim();
    if (!scriptText) return;

    state.googleDocUrl = googleDocUrl;

    // Save to history (unless it's a reload of the same text, handled by storage)
    saveToHistory(scriptText, googleDocUrl);

    // Detect language and update Speech Recognition
    applyLanguageForScript(scriptText);

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
    lockBodyScroll(); // Keep tap targets aligned in the full-screen prompter (see below)
}

function resetApp(): void {
    stopListening();
    autoScrollManager.stop();
    stopChaseScroll();
    isAutoScrollStarting = false;
    unlockBodyScroll();
    els.prompterContainer.classList.add('hidden');
    els.setupScreen.classList.remove('hidden');
    renderHistoryList(getHistory(), loadScript);
}

// ── Body scroll lock — iOS PWA landscape tap-offset fix ──────────────────
// On iOS 26 (esp. standalone/PWA, landscape) the page can get stuck in a
// negative scroll / visual-viewport offset — observed live as
// scrollY === visualViewport.offsetTop === -62. Touch coordinates are in
// visual-viewport space while element hit-testing is in layout space, so that
// offset makes every tap land ~62px from where the control is painted — both
// the dock buttons AND the script words ("I have to tap below the button").
// The teleprompter is a full-screen fixed overlay that never needs to scroll,
// so we pin the body at scroll 0 while it's open, which keeps the two
// coordinate systems aligned. Verified on-device: with this lock, scrollY and
// visualViewport.offsetTop stay 0 and taps register correctly.
let bodyScrollLocked = false;
function lockBodyScroll(): void {
    if (bodyScrollLocked) return;
    bodyScrollLocked = true;
    const b = document.body, h = document.documentElement;
    h.style.overflow = 'hidden';
    b.style.position = 'fixed';
    b.style.top = '0';
    b.style.left = '0';
    b.style.right = '0';
    b.style.bottom = '0';
    b.style.width = '100%';
    b.style.height = '100%';
    b.style.overflow = 'hidden';
    b.style.overscrollBehavior = 'none';
    window.scrollTo(0, 0);
}
function unlockBodyScroll(): void {
    if (!bodyScrollLocked) return;
    bodyScrollLocked = false;
    const b = document.body, h = document.documentElement;
    h.style.overflow = '';
    b.style.position = '';
    b.style.top = '';
    b.style.left = '';
    b.style.right = '';
    b.style.bottom = '';
    b.style.width = '';
    b.style.height = '';
    b.style.overflow = '';
    b.style.overscrollBehavior = '';
    window.scrollTo(0, 0);
}
// The stuck offset can reappear on orientation change or when iOS adjusts the
// visual viewport; re-zero the scroll whenever it drifts while locked.
function keepScrollZeroWhileLocked(): void {
    if (bodyScrollLocked && Math.round(window.scrollY) !== 0) window.scrollTo(0, 0);
}
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', keepScrollZeroWhileLocked);
    window.visualViewport.addEventListener('scroll', keepScrollZeroWhileLocked);
}
window.addEventListener('orientationchange', () => setTimeout(keepScrollZeroWhileLocked, 60));

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

// --- Google Doc Event Listeners ---

// Show Import Modal
els.importGoogleDocBtn.addEventListener('click', () => {
    (window as any).umami?.track('open-google-doc-modal');
    els.googleDocUrlInput.value = '';
    els.googleDocModal.classList.remove('hidden');
    els.googleDocUrlInput.focus();
});

// Close Import Modal
els.closeGoogleDocModalBtn.addEventListener('click', () => {
    els.googleDocModal.classList.add('hidden');
});

// Paste Google Doc Link Button
els.pasteGoogleDocUrlBtn.addEventListener('click', async () => {
    (window as any).umami?.track('paste-google-doc-url');
    try {
        const text = await navigator.clipboard.readText();
        els.googleDocUrlInput.value = text.trim();
        els.googleDocUrlInput.focus();
    } catch (err) {
        console.error('Failed to paste Google Doc URL!', err);
    }
});

// Confirm Import from Google Doc
els.confirmGoogleDocImportBtn.addEventListener('click', async () => {
    const url = els.googleDocUrlInput.value.trim();
    if (!url) {
        alert('Please enter a Google Doc URL.');
        return;
    }

    const btn = els.confirmGoogleDocImportBtn as HTMLButtonElement;
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Importing...';

    try {
        const text = await fetchGoogleDocText(url);
        (window as any).umami?.track('import-google-doc-success');
        
        els.inputScript.value = text;
        els.googleDocModal.classList.add('hidden');
        
        // Load script and pass the URL to state/history
        loadScript(text, url);
    } catch (err: any) {
        (window as any).umami?.track('import-google-doc-error', { error: err.message });
        alert(err.message || 'Failed to import document.');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
});

// Refresh Google Doc from Settings
els.refreshGoogleDocBtn.addEventListener('click', async () => {
    const url = state.googleDocUrl;
    if (!url) return;

    (window as any).umami?.track('refresh-google-doc-click');
    const btn = els.refreshGoogleDocBtn as HTMLButtonElement;
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = 'Syncing...';

    try {
        const text = await fetchGoogleDocText(url);
        (window as any).umami?.track('refresh-google-doc-success');

        els.inputScript.value = text;

        // Preserve current index if applicable
        const prevIndex = state.currentIndex;
        
        loadScript(text, url);

        // Restore position as close as possible
        if (prevIndex < state.scriptWords.length) {
            state.currentIndex = prevIndex;
            updateHighlight();
            scrollToCurrent();
        }

        btn.textContent = 'Synced!';
        setTimeout(() => {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }, 1500);
    } catch (err: any) {
        (window as any).umami?.track('refresh-google-doc-error', { error: err.message });
        alert(err.message || 'Failed to refresh document.');
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
});

// Copy Google Doc URL from Settings
els.copyGoogleDocUrlBtn.addEventListener('click', async () => {
    const url = state.googleDocUrl;
    if (!url) return;

    (window as any).umami?.track('copy-google-doc-url-click');
    try {
        await navigator.clipboard.writeText(url);
        
        // Show brief visual checkmark on the icon, and show alert
        const originalHTML = els.copyGoogleDocUrlBtn.innerHTML;
        els.copyGoogleDocUrlBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>`;
        
        alert('Google Doc link copied to clipboard!');
        
        els.copyGoogleDocUrlBtn.innerHTML = originalHTML;
    } catch (err) {
        console.error('Failed to copy Google Doc link:', err);
        alert('Failed to copy link. Please manually copy it from the browser address bar.');
    }
});

// Play / Pause / Record Button
let isAutoScrollStarting = false;

els.micButton.addEventListener('click', async () => {
    if (isAutoScrollStarting) {
        autoScrollManager.stop();
        isAutoScrollStarting = false;
        return;
    }

    if (state.isListening) {
        if (state.config.scrollingMode === 'voice') {
            (window as any).umami?.track('mic-stop');
            stopListening();
        } else {
            autoScrollManager.stop();
            state.isListening = false;
            import('./render').then(({ updateMicUI }) => updateMicUI(false));
        }
        // Restore dock opacity
        const dock = document.getElementById('mainControlsDock');
        if (dock) dock.style.opacity = '';
    } else {
        if (state.config.scrollingMode === 'voice') {
            (window as any).umami?.track('mic-start');
            startListening();
        } else {
            isAutoScrollStarting = true;
            const started = await autoScrollManager.start();
            isAutoScrollStarting = false;
            if (!started) {
                if (state.config.scrollingMode === 'sound') {
                    alert('Sound Scrolling needs microphone access. Please allow microphone permission and try again.');
                }
                return;
            }
            state.isListening = true;
            const { updateMicUI } = await import('./render');
            updateMicUI(true);
        }
        // Fade dock while listening
        const dock = document.getElementById('mainControlsDock');
        if (dock) dock.style.opacity = (state.config.dockOpacity / 100).toString();
    }
});

// Reset App Button
els.resetAppBtn.addEventListener('click', resetApp);

// Restart Script Button
els.restartScriptBtn.addEventListener('click', restartScript);

// Toggle Settings
els.toggleSettingsBtn.addEventListener('click', () => {
    (window as any).umami?.track('settings-toggle');
    const isHidden = els.settingsPanel.classList.toggle('hidden');
    if (!isHidden) {
        startPromoAnimation();
        if (!isIOS) {
            enumerateAndPopulateDevices(false);
        }
    } else {
        stopPromoAnimation();
    }
});

// Close Settings
els.closeSettingsBtn.addEventListener('click', () => {
    els.settingsPanel.classList.add('hidden');
    stopPromoAnimation();
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
    els.marginVal.textContent = `${val}%`;
    els.scriptContent.style.paddingLeft = `${val}%`;
    els.scriptContent.style.paddingRight = `${val}%`;
});

// Dock Opacity Slider
els.dockOpacityInput.addEventListener('input', (e) => {
    const val = parseInt((e.target as HTMLInputElement).value);
    state.config.dockOpacity = val;
    els.dockOpacityVal.textContent = `${val}%`;
    // Apply live preview if the dock is currently faded (mic listening or recording)
    if (state.isListening || state.isRecording) {
        const dock = document.getElementById('mainControlsDock');
        if (dock) dock.style.opacity = (val / 100).toString();
    }
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

// Text Direction Buttons
(['ltr', 'rtl'] as const).forEach(dir => {
    els.dirBtns[dir].addEventListener('click', () => {
        state.config.textDirection = dir as 'ltr' | 'rtl';
        applySettings();
        updateDirectionButtons();
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

// Horizontal Mirror Toggle (beta, revealed via ?beta=hmirror)
els.hMirrorToggle.addEventListener('change', (e) => {
    state.isMirroredH = (e.target as HTMLInputElement).checked;

    if (state.isMirroredH) {
        els.scrollContainer.classList.add('mirror-mode-h');
    } else {
        els.scrollContainer.classList.remove('mirror-mode-h');
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
    // Re-evaluate the dock: in rotated mode it must drop the viewport-based
    // pin and use the CSS `bottom-8`; on un-rotate it must re-pin.
    pinDockToVisualViewport();
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

// Font Family Buttons
(['mono', 'sans', 'serif', 'comicSans', 'openDyslexic'] as const).forEach(font => {
    els.fontFamilyBtns[font].addEventListener('click', () => {
        state.config.fontFamily = font;
        applySettings();
        updateFontFamilyButtons();
    });
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

// (Language detection warning is wired in language.ts)

// Dismiss Android Video Warning
els.dismissAndroidVideoWarningBtn.addEventListener('click', () => {
    els.androidVideoWarning.classList.add('hidden');
});

// --- Video Mode Event Listeners ---

// Toggle Video Mode
els.videoModeBtn.addEventListener('click', async () => {
    if (state.isVideoMode) {
        exitVideoMode();
    } else {
        const originalContent = els.videoModeBtn.innerHTML;
        (els.videoModeBtn as HTMLButtonElement).disabled = true;
        els.videoModeBtn.innerHTML = `<svg class="animate-spin h-6 w-6 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>`;
        
        await enterVideoMode();
        
        (els.videoModeBtn as HTMLButtonElement).disabled = false;
        els.videoModeBtn.innerHTML = originalContent;
    }
});

// Toggle Video Layout
els.videoLayoutToggleBtn.addEventListener('click', toggleVideoLayout);

// Flip Camera (front <-> rear)
els.videoFlipCameraBtn.addEventListener('click', flipCamera);

// Start Recording
els.videoRecordBtn.addEventListener('click', startRecording);

// Stop Recording
els.videoStopBtn.addEventListener('click', stopRecording);

// --- Initialization ---
function initializeUI(): void {
    // Hidden beta flag: visiting with ?beta=hmirror persistently unlocks the
    // horizontal mirror toggle on this device (and relabels the vertical one).
    if (new URLSearchParams(window.location.search).get('beta') === 'hmirror') {
        localStorage.setItem('beta-hmirror', '1');
    }
    if (localStorage.getItem('beta-hmirror') === '1') {
        els.hMirrorRow.classList.remove('hidden');
        els.hMirrorRow.classList.add('flex');
        els.mirrorModeLabel.textContent = 'Mirror Mode (vertical)';
    }

    // Set UI values from state
    els.fontSizeVal.textContent = `${state.config.fontSize}px`;
    els.fontSizeInput.value = state.config.fontSize.toString();

    els.lineHeightVal.textContent = `${state.config.lineHeight}x`;
    els.lineHeightInput.value = state.config.lineHeight.toString();
    els.scriptContent.style.lineHeight = `${state.config.lineHeight}`;

    els.paragraphSpacingVal.textContent = `${state.config.paragraphSpacing}em`;
    els.paragraphSpacingInput.value = state.config.paragraphSpacing.toString();

    els.marginVal.textContent = `${state.config.margin}%`;
    els.marginInput.value = state.config.margin.toString();

    els.dockOpacityVal.textContent = `${state.config.dockOpacity}%`;
    els.dockOpacityInput.value = state.config.dockOpacity.toString();

    els.activeLinePositionVal.textContent = `${state.config.activeLinePosition}%`;
    els.activeLinePositionInput.value = state.config.activeLinePosition.toString();

    els.lookaheadWordsVal.textContent = `${state.config.lookaheadWords}`;
    els.lookaheadWordsInput.value = state.config.lookaheadWords.toString();

    // Update alignment and direction buttons
    updateAlignmentButtons();
    updateDirectionButtons();

    els.smoothAnimationsToggle.checked = state.config.smoothAnimations;
    els.highlightActiveWordToggle.checked = state.config.highlightActiveWord;

    // Seed demo script for first-time users
    const history = getHistory();
    if (history.length === 0) {
        const demoText = `Welcome to VoicePrompter - a completely free teleprompter that works right in the browser.\nThis text is scrolling automatically as you speak following your voice.\nSee the highlighted word? That's where you are in the script right now.\nIf you want to jump to a different part, just tap any word and it syncs instantly.\nYou can also use voice commands like go back, go next, go start, or go finish.\nThe app can also record video with the script overlaid, so you don't need any extra software.\nIn the settings you can adjust font size, margins, line and paragraph spacing, pick a color theme and more - I encourage you to explore the settings on your own and find the best ones for you.\nThe app supports 34 languages and detects them automatically.\nOne more thing - text in square brackets gets skipped automatically [like this]. Useful for notes or reminders to yourself.\nEverything runs on your device. Nothing is sent to any server. You can even save it to your home screen and use it completely offline.\n\nNow go make something great ;)`;

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
    updateFontFamilyButtons();
    if (isIOS) {
        if (els.devicesSelectionContainer) {
            els.devicesSelectionContainer.classList.add('hidden');
        }
    } else {
        enumerateAndPopulateDevices(false);
    }
}

/**
 * Marks one button in a segmented group as selected by toggling the `active`
 * classes on the chosen button and the `inactive` classes on the rest.
 */
function updateButtonGroup<K extends string>(
    btns: Record<K, HTMLElement>,
    activeKey: K,
    classes: { active: string[]; inactive: string[] }
): void {
    (Object.keys(btns) as K[]).forEach(key => {
        const btn = btns[key];
        const isActive = key === activeKey;
        classes.active.forEach(c => btn.classList.toggle(c, isActive));
        classes.inactive.forEach(c => btn.classList.toggle(c, !isActive));
    });
}

// The alignment row is a filled segmented control; direction and font are
// outlined cards that gain the brand border when selected.
const ALIGN_CLASSES = {
    active: ['bg-neutral-500', 'text-white'],
    inactive: ['hover:bg-neutral-600']
};
const OUTLINED_CLASSES = {
    active: ['bg-neutral-700', 'text-white', 'border-[#FFBB00]'],
    inactive: ['bg-neutral-800', 'text-neutral-300', 'border-neutral-700']
};

function updateAlignmentButtons(): void {
    updateButtonGroup(els.alignBtns, state.config.textAlign, ALIGN_CLASSES);
}

function updateDirectionButtons(): void {
    updateButtonGroup(els.dirBtns, state.config.textDirection, OUTLINED_CLASSES);
}

function updateFontFamilyButtons(): void {
    updateButtonGroup(els.fontFamilyBtns, state.config.fontFamily as keyof typeof els.fontFamilyBtns, OUTLINED_CLASSES);
}

async function handleDeviceChange(): Promise<void> {
    state.selectedVideoDeviceId = els.videoDeviceSelect.value || null;
    state.selectedAudioDeviceId = els.audioDeviceSelect.value || null;

    // If video mode is active and not recording, seamlessly switch devices
    if (state.isVideoMode && !state.isRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia(getMediaConstraints());
            if (state.mediaStream) {
                state.mediaStream.getTracks().forEach(track => track.stop());
            }
            state.mediaStream = stream;
            els.videoPreview.srcObject = stream;
            els.videoPreview.muted = true;
            
            // Use same mirroring rule (mirror front camera selfie mode)
            els.videoPreview.style.transform = state.selectedVideoDeviceId ? 'none' : (state.facingMode === 'user' ? 'scaleX(-1)' : 'none');
            await els.videoPreview.play();
        } catch (err) {
            console.error('Failed to switch media device sources:', err);
            alert('Failed to switch to the selected device.');
        }
    }

    // Apply microphone changes to whichever microphone-driven mode is active.
    if (state.isListening) {
        if (state.config.scrollingMode === 'sound') {
            autoScrollManager.stop();
            const started = await autoScrollManager.start();
            if (!started) {
                state.isListening = false;
                const { updateMicUI } = await import('./render');
                updateMicUI(false);
            }
        } else if (state.config.scrollingMode === 'voice') {
            stopListening();
            setTimeout(() => {
                startListening();
            }, 400);
        }
    }
}

if (!isIOS) {
    els.videoDeviceSelect.addEventListener('change', handleDeviceChange);
    els.audioDeviceSelect.addEventListener('change', handleDeviceChange);
}

const permissionRequested = { video: false, audio: false };

async function requestPermissionsOnSelectFocus(kind: 'video' | 'audio') {
    if (permissionRequested[kind]) return;
    
    // Check if we already have device labels for this kind
    const devices = await navigator.mediaDevices.enumerateDevices();
    const needsPermission = devices.some(d => {
        if (kind === 'video' && d.kind === 'videoinput' && !d.label) return true;
        if (kind === 'audio' && d.kind === 'audioinput' && !d.label) return true;
        return false;
    });
    
    if (needsPermission) {
        permissionRequested[kind] = true;
        // Trigger permissions dialog and re-populate for this device kind
        await enumerateAndPopulateDevices(true, kind);
    }
}

if (!isIOS) {
    els.videoDeviceSelect.addEventListener('focus', () => requestPermissionsOnSelectFocus('video'));
    els.audioDeviceSelect.addEventListener('focus', () => requestPermissionsOnSelectFocus('audio'));
    els.videoDeviceSelect.addEventListener('mousedown', () => requestPermissionsOnSelectFocus('video'));
    els.audioDeviceSelect.addEventListener('mousedown', () => requestPermissionsOnSelectFocus('audio'));

    // Listen for browser device changes
    navigator.mediaDevices.addEventListener('devicechange', () => {
        enumerateAndPopulateDevices(false);
    });
}

function updateScrollingUI() {
    els.scrollingModeSelect.value = state.config.scrollingMode;
    els.scrollSpeedInput.value = state.config.scrollSpeed.toString();
    els.scrollSpeedVal.textContent = `${state.config.scrollSpeed.toFixed(1)} w/s`;
    els.soundSensitivityInput.value = state.config.soundSensitivity.toString();
    els.soundSensitivityVal.textContent = `${Math.round(state.config.soundSensitivity * 100)}%`;

    els.scrollSpeedContainer.classList.toggle('hidden', state.config.scrollingMode === 'voice');
    els.soundSensitivityContainer.classList.toggle('hidden', state.config.scrollingMode !== 'sound');

    const descriptions: Record<ScrollingMode, string> = {
        voice: 'Follows the words you say and pauses when you pause.',
        sound: 'Scrolls while microphone sound is detected and pauses during silence.',
        constant: 'Scrolls continuously at the speed you choose.'
    };
    els.scrollingModeDescription.textContent = descriptions[state.config.scrollingMode];

    // Update Mic button icon based on mode
    const path = els.micButton.querySelector('path');
    if (path) {
        if (state.config.scrollingMode === 'voice') {
            path.setAttribute('d', 'M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z');
        } else {
            // Play icon
            path.setAttribute('d', 'M8 5v14l11-7z');
        }
    }
}

els.scrollingModeSelect.addEventListener('change', (e) => {
    state.config.scrollingMode = (e.target as HTMLSelectElement).value as ScrollingMode;
    autoScrollManager.stop();
    isAutoScrollStarting = false;
    updateScrollingUI();
    if (state.isListening) {
        // Stop current mode
        stopListening();
        autoScrollManager.stop();
        state.isListening = false;
        import('./render').then(({ updateMicUI }) => updateMicUI(false));
    }
});

els.scrollSpeedInput.addEventListener('input', (e) => {
    state.config.scrollSpeed = parseFloat((e.target as HTMLInputElement).value);
    els.scrollSpeedVal.textContent = `${state.config.scrollSpeed.toFixed(1)} w/s`;
});

els.soundSensitivityInput.addEventListener('input', (e) => {
    state.config.soundSensitivity = parseFloat((e.target as HTMLInputElement).value);
    els.soundSensitivityVal.textContent = `${Math.round(state.config.soundSensitivity * 100)}%`;
});

function boot(): void {
    updateScrollingUI();
    initializeUI();
    pinDockToVisualViewport();

    // Fallback for async localStorage injection (e.g. WKWebView)
    setTimeout(() => {
        renderHistoryList(getHistory(), loadScript);
    }, 500);
}

// Run boot as soon as the DOM is ready. We must NOT rely solely on the
// DOMContentLoaded event: this is an ES module (deferred), so by the time it
// evaluates the DOM is already parsed and the event may have *already fired*
// (or won't fire on a bfcache restore). When that happened, initializeUI never
// ran and the Recent Scripts list stayed empty until a later user action
// (e.g. returning from the prompter) re-rendered it.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
    boot();
}

// iOS Safari restores pages from the back-forward cache without firing
// DOMContentLoaded, so re-render history (and re-pin the dock) on show.
window.addEventListener('pageshow', () => {
    renderHistoryList(getHistory(), loadScript);
    pinDockToVisualViewport();
});

// Pin the floating controls dock to the visual viewport. iOS Safari (esp. in
// landscape) paints `position: fixed` elements near the visual viewport's
// bottom but hit-tests them at their layout-viewport position — so taps fall
// through to the script. Computing `top` from `visualViewport` keeps the hit
// rect under the rendered button.
//
// Idempotent: called from both module-eval and DOMContentLoaded so the dock is
// pinned regardless of which fires first (with async module loading either can
// win). A guard flag ensures listeners/observers are only wired once.
let dockPinned = false;
function pinDockToVisualViewport(): void {
    const dock = document.getElementById('mainControlsDock');
    const vv = window.visualViewport;
    if (!dock || !vv) return;
    const update = () => {
        // Manual rotation (the Screen Rotation toggle) puts a `transform` on
        // <body>, which makes `position: fixed` resolve against the rotated
        // body instead of the viewport. Our viewport-based `top` would then
        // shove the dock off-screen (buttons invisible AND untappable). Fall
        // back to the CSS `bottom-8`, which lays out correctly under rotation.
        if (document.body.classList.contains('screen-rotated')) {
            dock.style.top = '';
            dock.style.bottom = '';
            return;
        }
        // The dock starts hidden inside #prompterContainer, so offsetHeight is
        // 0 until the prompter is shown. Skip until it has a real height,
        // otherwise we'd pin it ~64px too low; the MutationObserver below
        // re-runs this once the prompter becomes visible.
        if (dock.offsetHeight === 0) return;
        const visualBottomInLayout = vv.offsetTop + vv.height;
        const margin = 32; // matches original `bottom-8`
        dock.style.bottom = 'auto';
        dock.style.top = `${visualBottomInLayout - dock.offsetHeight - margin}px`;
    };
    if (dockPinned) {
        // Already wired; just recompute (e.g. second call after DOM is ready).
        requestAnimationFrame(update);
        return;
    }
    dockPinned = true;
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    // After an orientation change iOS reports stale visualViewport dimensions
    // for a beat, so recompute on the next frame *and* after a short delay.
    window.addEventListener('orientationchange', () => {
        requestAnimationFrame(update);
        setTimeout(update, 300);
    });
    requestAnimationFrame(update);

    // Recalculate when the prompter container is shown (class 'hidden' is removed)
    const prompterContainer = document.getElementById('prompterContainer');
    if (prompterContainer) {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.attributeName === 'class') {
                    const target = mutation.target as HTMLElement;
                    if (!target.classList.contains('hidden')) {
                        // Let the DOM update first, then recalculate
                        requestAnimationFrame(update);
                    }
                }
            }
        });
        observer.observe(prompterContainer, { attributes: true, attributeFilter: ['class'] });
    }
}
pinDockToVisualViewport();
