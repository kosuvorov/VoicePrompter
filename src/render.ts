import { els } from './elements';
import { state } from './state';
import { HistoryItem } from './types';

export function renderScript(): void {
    els.scriptContent.innerHTML = '';
    state.scriptWords.forEach((obj, index) => {
        const span = document.createElement('span');
        span.textContent = obj.word;
        span.id = `word-${index}`;

        // Apply Classes
        let classList = "script-word transition-opacity duration-300 ";

        if (obj.isStop) {
            classList += "stop-marker ";
        } else if (obj.isBreak) {
            classList += "line-break ";
            span.style.display = 'block';
            span.style.width = '100%';
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

export function updateHighlight(): void {
    state.scriptWords.forEach((obj, idx) => {
        if (obj.skip) return;

        if (idx < state.currentIndex) {
            // Past words
            if (obj.element) {
                obj.element.classList.remove('current-word', 'text-future');
                obj.element.classList.add('text-neutral-500'); // Dimmed
            }
        } else if (idx === state.currentIndex) {
            // Current word
            if (obj.element) {
                obj.element.classList.remove('text-neutral-500', 'text-future');
                obj.element.classList.add('current-word');
            }
        } else {
            // Future words
            if (obj.element) {
                obj.element.classList.remove('current-word', 'text-neutral-500');
                obj.element.classList.add('text-future');
            }
        }
    });
}

export function scrollToCurrent(): void {
    if (state.currentIndex < state.scriptWords.length) {
        const currentWordObj = state.scriptWords[state.currentIndex];
        if (currentWordObj && currentWordObj.element) {
            const containerHeight = els.scrollContainer.clientHeight;
            // Position at 1/3 from top
            const targetPosition = currentWordObj.element.offsetTop - (containerHeight / 3);

            els.scrollContainer.scrollTo({
                top: targetPosition,
                behavior: state.config.smoothAnimations ? 'smooth' : 'auto'
            });
        }
    }
}

export function advancePastSkipped(): void {
    while (state.currentIndex < state.scriptWords.length && state.scriptWords[state.currentIndex].skip) {
        state.currentIndex++;
    }
}

export function restartScript(): void {
    state.currentIndex = 0;
    advancePastSkipped();
    updateHighlight();
    scrollToCurrent();
    els.scrollContainer.scrollTop = 0;
}

export function applySettings(): void {
    els.appBody.style.backgroundColor = state.config.bgColor;
    els.appBody.style.color = state.config.textColor;
    els.appBody.style.setProperty('--base-color', state.config.textColor);
    els.scriptContent.style.setProperty('--paragraph-spacing', `${state.config.paragraphSpacing}em`);

    if (state.config.smoothAnimations) {
        els.scriptContent.classList.add('smooth-animations');
    } else {
        els.scriptContent.classList.remove('smooth-animations');
    }
}

export function updateMicUI(isListening: boolean): void {
    if (isListening) {
        els.micButton.classList.remove('bg-neutral-800', 'hover:bg-neutral-700');
        els.micButton.classList.add('bg-red-600', 'hover:bg-red-700', 'animate-pulse');
        els.micIcon.classList.add('text-white');
        els.statusIndicator.textContent = "Listening...";
        els.statusIndicator.classList.remove('text-neutral-500');
        els.statusIndicator.classList.add('text-red-500');
    } else {
        els.micButton.classList.add('bg-neutral-800', 'hover:bg-neutral-700');
        els.micButton.classList.remove('bg-red-600', 'hover:bg-red-700', 'animate-pulse');
        els.micIcon.classList.remove('text-white');
        els.statusIndicator.textContent = "Tap mic to start";
        els.statusIndicator.classList.add('text-neutral-500');
        els.statusIndicator.classList.remove('text-red-500');
    }
}

export function renderHistoryList(history: HistoryItem[], onLoad: (text: string) => void): void {
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
    // Re-attach clear listener here or in main? Better in main, but we need to show/hide button.
    // The button is static in HTML, so listener in main is fine. We just toggle visibility here.

    history.forEach(item => {
        const div = document.createElement('div');
        div.className = "bg-neutral-800 p-3 rounded border border-neutral-700 hover:border-blue-500 cursor-pointer transition group flex justify-between items-center shadow-sm";
        div.onclick = () => {
            els.inputScript.value = item.text;
            onLoad(item.text);
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
