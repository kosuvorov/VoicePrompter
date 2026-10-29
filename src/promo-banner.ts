import { els } from './elements';
import { detectVisitorPlatform, getNativePromo } from './platform-promo';

/**
 * The "try the native app" banner in the settings panel: platform-aware copy,
 * the rotating-word animation, and click-through tracking.
 */

const visitorPlatform = detectVisitorPlatform();
const nativePromo = getNativePromo(visitorPlatform);

let promoTimeout: number | null = null;
let currentPromoPairIndex = 0;
let currentPromoPairStatic = '';
let currentPromoWord = '';

export function startPromoAnimation(): void {
    if (promoTimeout) {
        window.clearTimeout(promoTimeout);
        promoTimeout = null;
    }

    const subtitleEl = els.nativePromoSubtitle;

    const pair = nativePromo.pairs[currentPromoPairIndex];
    currentPromoPairIndex = (currentPromoPairIndex + 1) % nativePromo.pairs.length;

    currentPromoPairStatic = pair.line1;

    if (pair.rotating.length === 0) {
        currentPromoWord = '';
        subtitleEl.innerHTML = `<div>${pair.line1}</div><div>${pair.line2}</div>`;
        return;
    }

    let currentIndex = 0;
    currentPromoWord = pair.rotating[currentIndex];

    subtitleEl.innerHTML = `<div>${pair.line1}</div><div class="flex items-center">${pair.line2}<span class="promo-rotating-word inline-block transition-all duration-500 opacity-100 translate-y-0 text-[#FFBB00] font-medium whitespace-nowrap ml-1">${pair.rotating[currentIndex]}</span></div>`;

    const rotatingEl = subtitleEl.querySelector('.promo-rotating-word') as HTMLElement;

    function animateNextWord() {
        promoTimeout = window.setTimeout(() => {
            if (!document.body.contains(rotatingEl)) return;

            rotatingEl.classList.remove('opacity-100', 'translate-y-0');
            rotatingEl.classList.add('opacity-0', '-translate-y-2');

            promoTimeout = window.setTimeout(() => {
                if (!document.body.contains(rotatingEl)) return;
                currentIndex = (currentIndex + 1) % pair.rotating.length;
                currentPromoWord = pair.rotating[currentIndex];
                rotatingEl.textContent = pair.rotating[currentIndex];

                rotatingEl.classList.remove('-translate-y-2', 'transition-all', 'duration-500');
                rotatingEl.classList.add('translate-y-2');

                void rotatingEl.offsetWidth;

                rotatingEl.classList.add('transition-all', 'duration-500');
                rotatingEl.classList.remove('opacity-0', 'translate-y-2');
                rotatingEl.classList.add('opacity-100', 'translate-y-0');

                animateNextWord();
            }, 500);
        }, 1500);
    }

    animateNextWord();
}

export function stopPromoAnimation(): void {
    if (promoTimeout) {
        window.clearTimeout(promoTimeout);
        promoTimeout = null;
    }
}

/** Sets the platform-specific title and wires the banner click-through. */
export function initPromoBanner(): void {
    els.nativePromoTitle.textContent = nativePromo.title;

    els.settingsNativeAppBanner.addEventListener('click', () => {
        const promoData = currentPromoWord ? `${currentPromoPairStatic} - ${currentPromoWord}` : currentPromoPairStatic;
        (window as any).umami?.track(nativePromo.analyticsEvent, {
            destination: nativePromo.href,
            sourcePlatform: visitorPlatform,
            variant: promoData
        });
        window.location.href = nativePromo.href;
    });
}
