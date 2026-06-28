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
            classList += "text-future ";
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

    // Toggle Google Docs Sync panel
    if (state.googleDocUrl) {
        els.refreshGoogleDocContainer.classList.remove('hidden');
    } else {
        els.refreshGoogleDocContainer.classList.add('hidden');
    }

    state.currentIndex = 0;
    advancePastSkipped();
    updateHighlight();
    
    setTimeout(() => {
        scrollToCurrent();
    }, 50);
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
            // Position based on user setting (percentage from top)
            const positionRatio = state.config.activeLinePosition / 100;
            const targetPosition = currentWordObj.element.offsetTop - (containerHeight * positionRatio);

            if (state.config.smoothAnimations) {
                smoothScrollTo(els.scrollContainer, targetPosition, 600);
            } else {
                els.scrollContainer.scrollTo({
                    top: targetPosition,
                    behavior: 'auto'
                });
            }
        }
    }
}

function smoothScrollTo(element: HTMLElement, target: number, duration: number): void {
    const start = element.scrollTop;
    const change = target - start;
    const startTime = performance.now();

    function animateScroll(currentTime: number) {
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);

        // EaseInOutQuad
        const ease = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        element.scrollTop = start + change * ease;

        if (timeElapsed < duration) {
            requestAnimationFrame(animateScroll);
        }
    }

    requestAnimationFrame(animateScroll);
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
}

export function navigateParagraphs(direction: 'back' | 'forward', paragraphCount: number): void {
    if (state.scriptWords.length === 0) return;

    // Find all paragraph boundary indices (words representing line breaks/stops)
    // Merge consecutive breaks into a single boundary
    const paragraphEnds: number[] = [];
    let lastWasBreak = false;
    state.scriptWords.forEach((w, i) => {
        if (w.isStop || w.isBreak) {
            if (!lastWasBreak) {
                paragraphEnds.push(i);
                lastWasBreak = true;
            } else {
                // Update to the last break in the sequence
                paragraphEnds[paragraphEnds.length - 1] = i;
            }
        } else if (!w.skip) {
            lastWasBreak = false;
        }
    });

    // If there are no explicit paragraph breaks, fallback to sentence boundaries
    if (paragraphEnds.length === 0) {
        state.scriptWords.forEach((w, i) => {
            if (!w.skip && /[.!?]$/.test(w.word)) {
                paragraphEnds.push(i);
            }
        });
    }

    if (direction === 'back') {
        // Find how many paragraph boundaries are before currentIndex
        let target = 0;
        let boundariesBefore = 0;
        for (let i = paragraphEnds.length - 1; i >= 0; i--) {
            if (paragraphEnds[i] < state.currentIndex) {
                boundariesBefore++;
                if (boundariesBefore >= paragraphCount) {
                    // Go to the word AFTER the previous paragraph end (start of that paragraph)
                    target = i > 0 ? paragraphEnds[i - 1] + 1 : 0;
                    break;
                }
            }
        }
        if (boundariesBefore < paragraphCount) {
            target = 0; // Go to the very beginning
        }
        state.currentIndex = target;
    } else {
        // Forward: skip ahead by paragraphCount paragraph endings
        let boundariesAfter = 0;
        let target = state.scriptWords.length - 1;
        for (let i = 0; i < paragraphEnds.length; i++) {
            if (paragraphEnds[i] >= state.currentIndex) {
                boundariesAfter++;
                if (boundariesAfter >= paragraphCount) {
                    target = paragraphEnds[i] + 1;
                    break;
                }
            }
        }
        state.currentIndex = Math.min(target, state.scriptWords.length - 1);
    }

    advancePastSkipped();
    updateHighlight();
    scrollToCurrent();
}

export function applySettings(): void {
    els.appBody.style.backgroundColor = state.config.bgColor;
    els.appBody.style.color = state.config.textColor;
    els.appBody.style.setProperty('--base-color', state.config.textColor);

    // Apply background to prompter container for theme support
    els.prompterContainer.style.backgroundColor = state.config.bgColor;
    if (!(state.isVideoMode && state.videoLayoutMode === 'overlay')) {
        els.scrollContainer.style.backgroundColor = state.config.bgColor;
    }

    els.scriptContent.style.setProperty('--paragraph-spacing', `${state.config.paragraphSpacing}em`);
    els.scriptContent.style.textAlign = state.config.textAlign;
    els.scriptContent.style.direction = state.config.textDirection;

    if (state.config.smoothAnimations) {
        els.scriptContent.classList.add('smooth-animations');
    } else {
        els.scriptContent.classList.remove('smooth-animations');
    }

    if (state.config.highlightActiveWord) {
        els.scriptContent.classList.add('highlight-active-word');
    } else {
        els.scriptContent.classList.remove('highlight-active-word');
    }

    // Apply font family to script content
    const fontMap: Record<string, string> = {
        mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Arial, sans-serif',
        serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
        comicSans: '"Comic Sans MS", "Chalkboard SE", "Trebuchet MS", cursive',
        openDyslexic: '"OpenDyslexic", cursive'
    };
    const fontStack = fontMap[state.config.fontFamily] ?? fontMap['mono'];
    els.scriptContent.style.fontFamily = fontStack;
}

export function updateMicUI(isListening: boolean): void {
    const isVoice = state.config.scrollingMode === 'voice';
    const pathEl = els.micButton.querySelector('path');
    
    if (isListening) {
        els.micButton.classList.remove('bg-neutral-800', 'hover:bg-neutral-700');
        els.micButton.classList.add('bg-red-600', 'hover:bg-red-700', 'animate-pulse');
        els.micIcon.classList.add('text-white');
        
        els.statusIndicator.textContent = isVoice ? "Listening..." : "Scrolling...";
        els.statusIndicator.classList.remove('text-neutral-500');
        els.statusIndicator.classList.add('text-red-500');
        
        if (pathEl) {
            if (isVoice) {
                pathEl.setAttribute('d', 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z');
            } else {
                // Pause icon
                pathEl.setAttribute('d', 'M6 19h4V5H6v14zm8-14v14h4V5h-4z');
            }
        }
    } else {
        els.micButton.classList.add('bg-neutral-800', 'hover:bg-neutral-700');
        els.micButton.classList.remove('bg-red-600', 'hover:bg-red-700', 'animate-pulse');
        els.micIcon.classList.remove('text-white');
        
        els.statusIndicator.textContent = isVoice ? "Tap mic to start" : "Tap play to start";
        els.statusIndicator.classList.add('text-neutral-500');
        els.statusIndicator.classList.remove('text-red-500');
        
        if (pathEl) {
            if (isVoice) {
                pathEl.setAttribute('d', 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z');
            } else {
                // Play icon
                pathEl.setAttribute('d', 'M8 5v14l11-7z');
            }
        }
    }
}

export function renderHistoryList(history: HistoryItem[], onLoad: (text: string, googleDocUrl?: string | null) => void): void {
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
        div.className = "bg-neutral-800 p-3 rounded border border-neutral-700 hover:border-blue-500 cursor-pointer transition group flex justify-between items-center shadow-sm min-w-[85%] md:min-w-0 snap-center";
        div.onclick = () => {
            els.inputScript.value = item.text;
            onLoad(item.text, item.googleDocUrl || null);
        };
        div.innerHTML = `
            <div class="flex flex-col text-left overflow-hidden mr-2">
                <span class="text-gray-300 text-sm font-medium truncate font-mono">${item.preview}</span>
                <div class="flex items-center gap-2">
                    <span class="text-gray-500 text-xs">${item.date}</span>
                    ${item.tag ? `<span class="text-[9px] font-bold bg-[#FFBB00]/10 text-[#FFBB00] px-1.5 py-0.5 rounded-full uppercase tracking-wider">${item.tag}</span>` : ''}
                    ${item.googleDocUrl ? `<span class="text-[9px] font-bold bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Google Doc</span>` : ''}
                </div>
            </div>
            <div class="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            </div>
        `;
        els.historyList.appendChild(div);
    });
}
