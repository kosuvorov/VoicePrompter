import './style.css'
import { registerSW } from 'virtual:pwa-register'

// --- PWA Update Handling ---
registerSW({ immediate: true })

// --- Types ---
interface ScriptWord {
    word: string;
    clean: string;
    element: HTMLElement | null;
    skip: boolean;
    isStop: boolean;
}

interface AppConfig {
    fontSize: number;
    lineHeight: number;
    textColor: string;
    bgColor: string;
    textAlign: 'left' | 'center' | 'right';
    showStopIcon: boolean;
}

interface AppState {
    isListening: boolean;
    scriptWords: ScriptWord[];
    currentIndex: number;
    recognition: any; // Using any for SpeechRecognition as it's experimental
    isMirrored: boolean;
    config: AppConfig;
}

interface HistoryItem {
    id: number;
    text: string;
    preview: string;
    date: string;
}

// --- State Management ---
const state: AppState = {
    isListening: false,
    scriptWords: [],
    currentIndex: 0,
    recognition: null,
    isMirrored: false,
    config: {
        fontSize: 20,
        lineHeight: 1.5,
        textColor: '#ffffff',
        bgColor: '#000000',
        textAlign: 'center',
        showStopIcon: false
    }
};

// --- DOM Elements ---
const els = {
    setupScreen: document.getElementById('setupScreen')!,
    prompterContainer: document.getElementById('prompterContainer')!,
    inputScript: document.getElementById('inputScript') as HTMLTextAreaElement,
    scriptContent: document.getElementById('scriptContent')!,
    scrollContainer: document.getElementById('scrollContainer')!,
    topSpacer: document.getElementById('topSpacer')!,
    settingsPanel: document.getElementById('settingsPanel')!,
    fontSizeInput: document.getElementById('fontSizeInput') as HTMLInputElement,
    fontSizeVal: document.getElementById('fontSizeVal')!,
    lineHeightInput: document.getElementById('lineHeightInput') as HTMLInputElement,
    lineHeightVal: document.getElementById('lineHeightVal')!,
    textColorInput: document.getElementById('textColorInput') as HTMLInputElement,
    bgColorInput: document.getElementById('bgColorInput') as HTMLInputElement,
    appBody: document.getElementById('appBody')!,
    micButton: document.getElementById('micButton')!,
    micIcon: document.getElementById('micIcon')!,
    statusIndicator: document.getElementById('statusIndicator')!,
    mirrorBtn: document.getElementById('mirrorBtn')!,
    mirrorToggleKnob: document.getElementById('mirrorToggleKnob')!,
    browserWarning: document.getElementById('browserWarning')!,
    historyList: document.getElementById('historyList')!,
    historySection: document.getElementById('historySection')!,
    stopSignToggle: document.getElementById('stopSignToggle') as HTMLInputElement,
    alignBtns: {
        left: document.getElementById('alignLeftBtn')!,
        center: document.getElementById('alignCenterBtn')!,
        right: document.getElementById('alignRightBtn')!
    },
    // Buttons
    loadScriptBtn: document.getElementById('loadScriptBtn')!,
    clearHistoryBtn: document.getElementById('clearHistoryBtn')!,
    resetAppBtn: document.getElementById('resetAppBtn')!,
    restartScriptBtn: document.getElementById('restartScriptBtn')!,
    toggleSettingsBtn: document.getElementById('toggleSettingsBtn')!,
    themeDarkBtn: document.getElementById('themeDarkBtn')!,
    themeLightBtn: document.getElementById('themeLightBtn')!
};

// --- Initialization ---
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

if (!SpeechRecognition) {
    els.browserWarning.classList.remove('hidden');
} else {
    state.recognition = new SpeechRecognition();
    state.recognition.continuous = true;
    state.recognition.interimResults = true;
    state.recognition.lang = 'en-US';
}

renderHistory();
setupEventListeners();

// --- Core Functions ---

function loadScript(scriptText: string | null = null) {
    let text = scriptText || els.inputScript.value.trim();
    if (!text) return alert("Please enter some text.");

    if (!scriptText) saveToHistory(text);

    // Instant Update Logic:
    // Always substitute newlines with a special token to generate the 🛑 elements,
    // but control their visibility with CSS.
    // ' ||LB|| ' acts as a unique placeholder for the split
    text = text.replace(/\n+/g, ' ||LB|| ');

    const rawWords = text.split(/\s+/);

    let inBracket = false;
    state.scriptWords = rawWords.map(word => {
        // Check special stop sign token
        if (word === '||LB||') {
            return {
                word: '🛑',
                clean: '',
                element: null,
                skip: true,
                isStop: true // Flag to mark as stop marker
            };
        }

        // Check bracket state
        if (word.startsWith('[')) inBracket = true;

        const cleanWord = word.toLowerCase().replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ");

        // Logic for Skipping
        const isEmojiOrSymbol = cleanWord.length === 0;
        const shouldSkip = inBracket || isEmojiOrSymbol || word.includes('🛑');

        if (word.endsWith(']')) inBracket = false;

        return {
            word: word,
            clean: cleanWord,
            element: null,
            skip: shouldSkip,
            isStop: false
        };
    });

    els.scriptContent.innerHTML = '';
    state.scriptWords.forEach((obj, index) => {
        const span = document.createElement('span');
        span.textContent = obj.word;
        span.id = `word-${index}`;

        // Apply Classes
        let classList = "script-word transition-opacity duration-300 ";

        if (obj.isStop) {
            classList += "stop-marker ";
        } else if (obj.skip) {
            classList += "skipped-word ";
        } else {
            classList += "text-future hover:text-blue-400 ";
        }
        span.className = classList;

        // TAP TO ACTIVATE Logic
        span.onclick = () => {
            if (!obj.skip) {
                state.currentIndex = index;
                updateHighlight();
                scrollToCurrent();
            }
        };

        els.scriptContent.appendChild(span);
        obj.element = span;
    });

    // Apply current visibility setting
    if (state.config.showStopIcon) {
        els.scriptContent.classList.add('show-stops');
    } else {
        els.scriptContent.classList.remove('show-stops');
    }

    els.setupScreen.classList.add('hidden');
    els.prompterContainer.classList.remove('hidden');

    state.currentIndex = 0;
    advancePastSkipped();
    updateHighlight();
}

function advancePastSkipped() {
    while (state.currentIndex < state.scriptWords.length && state.scriptWords[state.currentIndex].skip) {
        state.currentIndex++;
    }
}

function resetApp() {
    stopListening();
    els.prompterContainer.classList.add('hidden');
    els.setupScreen.classList.remove('hidden');
    renderHistory();
}

function restartScript() {
    state.currentIndex = 0;
    advancePastSkipped();
    updateHighlight();
    scrollToCurrent();
    els.scrollContainer.scrollTop = 0;
}

// --- Local Storage History ---
function saveToHistory(text: string) {
    let history: HistoryItem[] = JSON.parse(localStorage.getItem('teleprompter_history') || '[]');
    if (history.length > 0 && history[0].text === text) return;
    const item: HistoryItem = {
        id: Date.now(),
        text: text,
        preview: text.substring(0, 40) + (text.length > 40 ? '...' : ''),
        date: new Date().toLocaleDateString()
    };
    history.unshift(item);
    if (history.length > 10) history.pop();
    localStorage.setItem('teleprompter_history', JSON.stringify(history));
}

function renderHistory() {
    let history: HistoryItem[] = JSON.parse(localStorage.getItem('teleprompter_history') || '[]');
    els.historyList.innerHTML = '';

    if (history.length === 0) {
        els.historyList.innerHTML = `
            <div class="text-center py-8 border border-dashed border-neutral-800 rounded-lg text-neutral-600 text-sm">
                No previous scripts found
            </div>
        `;
        els.clearHistoryBtn.classList.add('hidden');
        return;
    }

    els.clearHistoryBtn.classList.remove('hidden');
    history.forEach(item => {
        const div = document.createElement('div');
        div.className = "bg-neutral-800 p-3 rounded border border-neutral-700 hover:border-blue-500 cursor-pointer transition group flex justify-between items-center shadow-sm";
        div.onclick = () => {
            els.inputScript.value = item.text;
            loadScript(item.text);
        };
        div.innerHTML = `
            <div class="flex flex-col text-left overflow-hidden mr-2">
                <span class="text-gray-300 text-sm font-medium truncate font-mono">${item.preview}</span>
                <span class="text-gray-500 text-xs">${item.date}</span>
            </div>
            <div class="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            </div>
        `;
        els.historyList.appendChild(div);
    });
}

function clearHistory() {
    if (confirm('Clear all recent scripts?')) {
        localStorage.removeItem('teleprompter_history');
        renderHistory();
    }
}

// --- Speech Recognition ---
if (state.recognition) {
    state.recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        const spokenWords = transcript.trim().toLowerCase().split(/\s+/);

        const recentString = spokenWords.slice(-5).join(' ');
        if (recentString.includes('prompter restart')) {
            restartScript();
            return;
        }

        matchWords(spokenWords.slice(-5));
    };

    state.recognition.onend = () => {
        if (state.isListening) {
            try { state.recognition.start(); } catch (e: any) { }
        } else {
            updateMicUI(false);
        }
    };
}

function matchWords(spokenWords: string[]) {
    if (state.currentIndex >= state.scriptWords.length) return;
    const LOOKAHEAD = 5;

    for (let spokenWord of spokenWords) {
        const cleanSpoken = spokenWord.replace(/[^\w]|_/g, "");
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

function updateHighlight() {
    state.scriptWords.forEach((obj, idx) => {
        if (obj.skip) return;
        if (obj.isStop) return;
        if (!obj.element) return;

        if (idx < state.currentIndex) {
            obj.element.classList.remove('text-future', 'current-word', 'font-bold');
            obj.element.classList.add('text-past');
            obj.element.style.opacity = "";
        } else if (idx === state.currentIndex) {
            obj.element.classList.remove('text-future', 'text-past');
            obj.element.classList.add('current-word', 'font-bold');
            obj.element.style.opacity = "1";
        } else {
            obj.element.classList.remove('text-past', 'current-word', 'font-bold');
            obj.element.classList.add('text-future');
            obj.element.style.opacity = "";
        }
    });
}

function scrollToCurrent() {
    if (state.currentIndex > 0 && state.currentIndex < state.scriptWords.length) {
        const activeEl = state.scriptWords[state.currentIndex].element;
        if (activeEl) {
            activeEl.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'center'
            });
        }
    }
}

// --- Controls ---
function toggleListening() {
    if (!state.recognition) return alert("Speech recognition not supported.");
    if (state.isListening) stopListening();
    else startListening();
}
function startListening() {
    try {
        state.recognition.start();
        state.isListening = true;
        updateMicUI(true);
    } catch (e) { console.error(e); }
}
function stopListening() {
    state.isListening = false;
    state.recognition.stop();
    updateMicUI(false);
}
function updateMicUI(isLive: boolean) {
    const btn = els.micButton;
    const status = els.statusIndicator;
    if (isLive) {
        btn.classList.add('bg-red-600', 'border-red-400', 'recording-pulse');
        btn.classList.remove('bg-neutral-800', 'border-neutral-600');
        status.classList.remove('hidden');
    } else {
        btn.classList.remove('bg-red-600', 'border-red-400', 'recording-pulse');
        btn.classList.add('bg-neutral-800', 'border-neutral-600');
        status.classList.add('hidden');
    }
}

// --- Settings ---
function toggleSettings() {
    const panel = els.settingsPanel;
    if (panel.classList.contains('hidden')) {
        panel.classList.remove('hidden');
        setTimeout(() => {
            panel.classList.remove('scale-95', 'opacity-0');
            panel.classList.add('scale-100', 'opacity-100');
        }, 10);
    } else {
        panel.classList.remove('scale-100', 'opacity-100');
        panel.classList.add('scale-95', 'opacity-0');
        setTimeout(() => { panel.classList.add('hidden'); }, 200);
    }
}

// -- Theme Presets --
function setTheme(type: 'dark' | 'light') {
    if (type === 'dark') {
        state.config.bgColor = '#000000';
        state.config.textColor = '#ffffff';
    } else {
        state.config.bgColor = '#ffffff';
        state.config.textColor = '#000000';
    }
    els.bgColorInput.value = state.config.bgColor;
    els.textColorInput.value = state.config.textColor;
    applyColors();
}

// -- Text Alignment --
function setTextAlign(align: 'left' | 'center' | 'right') {
    state.config.textAlign = align;
    els.scriptContent.style.textAlign = align;

    // Update button styles
    ['left', 'center', 'right'].forEach(a => {
        const btn = els.alignBtns[a as 'left' | 'center' | 'right'];
        if (a === align) {
            btn.classList.remove('hover:bg-neutral-600');
            btn.classList.add('bg-neutral-500', 'text-white');
        } else {
            btn.classList.add('hover:bg-neutral-600');
            btn.classList.remove('bg-neutral-500', 'text-white');
        }
    });
}

function applyColors() {
    els.appBody.style.backgroundColor = state.config.bgColor;
    els.appBody.style.color = state.config.textColor;
}

function toggleMirror() {
    state.isMirrored = !state.isMirrored;
    const knob = els.mirrorToggleKnob;
    const btn = els.mirrorBtn;
    if (state.isMirrored) {
        els.scriptContent.classList.add('mirror-mode');
        knob.classList.add('translate-x-6');
        btn.classList.add('bg-blue-600');
        btn.classList.remove('bg-neutral-600');
    } else {
        els.scriptContent.classList.remove('mirror-mode');
        knob.classList.remove('translate-x-6');
        btn.classList.remove('bg-blue-600');
        btn.classList.add('bg-neutral-600');
    }
}

// --- Event Listeners ---
function setupEventListeners() {
    els.loadScriptBtn.addEventListener('click', () => loadScript());
    els.clearHistoryBtn.addEventListener('click', clearHistory);
    els.resetAppBtn.addEventListener('click', resetApp);
    els.restartScriptBtn.addEventListener('click', restartScript);
    els.micButton.addEventListener('click', toggleListening);
    els.toggleSettingsBtn.addEventListener('click', toggleSettings);
    els.themeDarkBtn.addEventListener('click', () => setTheme('dark'));
    els.themeLightBtn.addEventListener('click', () => setTheme('light'));

    els.alignBtns.left.addEventListener('click', () => setTextAlign('left'));
    els.alignBtns.center.addEventListener('click', () => setTextAlign('center'));
    els.alignBtns.right.addEventListener('click', () => setTextAlign('right'));

    els.stopSignToggle.addEventListener('change', (e) => {
        state.config.showStopIcon = (e.target as HTMLInputElement).checked;
        if (state.config.showStopIcon) {
            els.scriptContent.classList.add('show-stops');
        } else {
            els.scriptContent.classList.remove('show-stops');
        }
    });

    els.fontSizeInput.addEventListener('input', (e) => {
        const size = (e.target as HTMLInputElement).value;
        state.config.fontSize = parseInt(size);
        els.fontSizeVal.textContent = `${size}px`;
        els.scriptContent.style.fontSize = `${size}px`;
    });

    els.lineHeightInput.addEventListener('input', (e) => {
        const height = (e.target as HTMLInputElement).value;
        state.config.lineHeight = parseFloat(height);
        els.lineHeightVal.textContent = `${height}x`;
        els.scriptContent.style.lineHeight = height;
    });

    els.textColorInput.addEventListener('input', (e) => {
        state.config.textColor = (e.target as HTMLInputElement).value;
        applyColors();
    });

    els.bgColorInput.addEventListener('input', (e) => {
        state.config.bgColor = (e.target as HTMLInputElement).value;
        applyColors();
    });

    els.mirrorBtn.addEventListener('click', toggleMirror);

    document.addEventListener('click', (e) => {
        const panel = els.settingsPanel;
        const btn = els.toggleSettingsBtn;
        if (!panel.classList.contains('hidden') && !panel.contains(e.target as Node) && !btn.contains(e.target as Node)) {
            toggleSettings();
        }
    });
}
