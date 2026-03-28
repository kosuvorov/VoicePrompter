---
title: "VoicePrompter Complete Guide: Everything You Need to Know"
description: "The definitive guide to VoicePrompter — covering both the free web app and the native Mac app, setup, voice scrolling, mirror mode, and advanced features."
date: "Mar 22, 2026"
image: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=800&q=80"
keywords: ["teleprompter", "video production"]
---

VoicePrompter is a voice-activated teleprompter available in two versions: a free open-source web app at [voiceprompter.app](https://voiceprompter.app), and a native macOS app on the [Mac App Store](https://apps.apple.com/pl/app/voiceprompter/id6758573080). This guide covers both.

## Why VoicePrompter Exists

I spent five years looking for a teleprompter app that actually worked for my use cases — recording videos, demos, presentations — and couldn't find one. The apps were either manual scroll (useless solo), had unreliable voice recognition, didn't support the languages I needed, or had some deal-breaker missing feature like no mirror mode or no mobile design.

So I built one. The web app is free and open source because the core functionality — voice-activated scrolling, offline capability, mirror mode — shouldn't cost anything. The Mac app is paid because building a native macOS app with custom voice recognition algorithms, an invisible overlay mode, and proper system integration is a different level of engineering.

You can see the web app source code on [GitHub](https://github.com/kosuvorov/VoicePrompter).

---

## Part 1: VoicePrompter Web App (Free)

### Who It's For

Solo creators filming on a phone or tablet, or anyone who needs a free, privacy-first, offline teleprompter on any device.

### Key Features

**Voice-activated scrolling.** The app uses your device's built-in speech recognition to scroll the text as you speak. No manual control needed. It pauses when you stop, resumes when you start. Supports 34+ languages.

**Works 100% offline.** Once loaded in a browser or installed as a PWA, the app works without internet. Speech recognition happens on your device — nothing is sent to a server.

**Installable as a PWA.** On iOS, tap Share → Add to Home Screen. On Android, tap the browser menu → Install App. On desktop Chrome, click the install icon in the address bar. It works and launches like a native app.

**Mirror mode.** Flips the text horizontally for use with teleprompter glass hardware.

**Forced landscape on iOS.** Locks the app to landscape orientation even though iOS normally prevents web apps from doing this.

**Active word highlighting.** The currently-recognized word is highlighted as you speak.

**Touch-to-jump.** Tap any word in the script and the prompter snaps to that position.

**"Prompter restart" voice command.** Say "prompter restart" to reset the script to the beginning, hands-free.

**Visual stop signs.** Add pause indicators to your script that show as visual markers during playback.

**Bracket handling.** Text in brackets like `[pause]` or `[smile]` is displayed for you but skipped by the voice recognition engine — so you can write stage directions into your script.

**Script history.** Recent scripts are saved in local storage on your device. No account, no cloud, just private local storage.

**Quick copy/paste/clear.** One-tap paste from clipboard, one-tap copy to clipboard, one-tap clear.

**Deep appearance customization.** Font size, line spacing, paragraph spacing, margins, alignment, dark/light/custom themes.

### How to Get Started

1. Go to [voiceprompter.app](https://voiceprompter.app) on your phone or browser.
2. Tap "Paste to Replace" and paste your script.
3. Adjust font size until the text is comfortably readable at your filming distance.
4. Select your language in settings if it's not English.
5. Tap the microphone button to start voice recognition.
6. Start talking. The text follows.

No sign-up. No account. No payment.

---

## Part 2: VoicePrompter for Mac (Paid)

### Who It's For

Professionals who record demos, webinars, tutorials, podcasts, product videos, or do live video calls (sales, presentations, online meetings) on a Mac.

### Key Features

**Invisible overlay mode.** The app window is a transparent overlay that floats on your screen. Through macOS screen capture exclusion APIs, it is completely hidden from Zoom, Teams, Google Meet, OBS, QuickTime screen recordings, and all screen sharing. You see it; your audience doesn't.

**Always-on-top.** Stays above all other apps and windows, including full-screen applications and full-screen presentations. You never lose the teleprompter by switching to a different app.

**60+ languages with auto-detection.** Uses Apple's native on-device speech recognition (same engine as Siri and macOS dictation). Language is automatically detected from your pasted text using `NLLanguageRecognizer` — no manual selection needed.

**Elite voice recognition algorithm.** Custom-built word matching algorithm specifically designed for teleprompter use. More reliable than most third-party solutions for handling natural speech patterns, pauses, mispronunciations, and partial words.

**In-window script editing.** Edit your script directly in the teleprompter window without closing the overlay. No need to paste from external editors for minor changes.

**Menu bar integration.** Lives in your menu bar. Launch scripts from clipboard, access recent scripts, adjust settings — all without a separate app window cluttering your workspace.

**macOS Services integration.** Launch your script directly from any text editor via macOS Services — right-click a selected text and send it to VoicePrompter instantly.

**Bracket handling.** Same as the web app — stage directions in brackets are shown to you but not matched by voice recognition.

**Script history (up to 100 scripts).** Recent scripts stored locally.

**Privacy-first.** All recognition is on-device. No internet required for voice recognition.

**Tiny.** The whole app is 2 megabytes. Launches instantly.

### Pricing

- $3.99/month or $39.99/year
- Free tier: 3 custom scripts + unlimited demo script
- Available in 175 countries via the [Mac App Store](https://apps.apple.com/pl/app/voiceprompter/id6758573080)

### How to Get Started

1. Install from the [Mac App Store](https://apps.apple.com/pl/app/voiceprompter/id6758573080).
2. The app appears in your menu bar on first launch.
3. Copy a script to your clipboard.
4. Click the menu bar icon → "Paste from Clipboard."
5. Resize and reposition the overlay window — place it below your camera.
6. Click the microphone button to start voice recognition.
7. Start talking.

---

## Choosing Between the Two

| | Web App | Mac App |
|---|---|---|
| Price | Free | $3.99/mo |
| Platform | Any device, any browser | macOS only |
| Languages | 34+ | 60+ |
| Auto language detection | Yes | Yes |
| Invisible in screen share | No | Yes |
| Always-on-top | No | Yes |
| Offline | Yes | Yes |
| On-device recognition | Yes | Yes |
| Mirror mode | Yes | No (not needed) |

If you're filming on a phone or need a free tool: web app.

If you're on a Mac and record professionally, do demos, webinars, presentations, or sales calls: Mac app.

---

## More Resources

- [Why All Teleprompter Apps Are Terrible (And What I Did About It)](./why-all-teleprompter-apps-suck.md)
- [How to Use a Teleprompter Naturally](./how-to-use-teleprompter-naturally.md)
- [How to Read a Script Without Looking Like You're Reading](./how-to-read-script-without-looking-like-reading.md)
- [Teleprompter for Zoom — Completely Invisible](./teleprompter-for-zoom-invisible.md)
- [Teleprompter in 60+ Languages](./multilingual-teleprompter-60-languages.md)
- [Free Voice-Activated Teleprompter for Solo Creators](./free-voice-activated-teleprompter.md)

---

**Related articles:**
- [Best Teleprompter App for Mac](./best-teleprompter-app-for-mac.md)
- [Free Voice-Activated Teleprompter for Solo Creators](./free-voice-activated-teleprompter.md)
- [How to Use a Teleprompter Naturally](./how-to-use-teleprompter-naturally.md)
- [Teleprompter in 60+ Languages](./multilingual-teleprompter-60-languages.md)