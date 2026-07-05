# VoicePrompter Changelog

## Apple Native Apps (iOS, iPadOS, & macOS)
*Pushed directly to the App Store*

### Version 3.3
- **Improved Voice Commands** - Voice commands no longer trigger accidentally when your script contains the same exact words.
- **Smoother Scrolling** - Smoother, more reliable scrolling.
- **Enhanced Voice Control** - Navigate your script hands-free with voice commands (go next, go back, go to start, go to finish).
- **Smoother Animations** - Smoother scroll animation while reading and smoother word-highlight animation in Picture-in-Picture floating mode.

### Version 3.2
- **Hands-free Navigation** - Added voice commands: Say "go next", "go back", "go start", or "go finish" to navigate your script hands-free while you read.

### Version 3.1
- **iOS & iPadOS Release** - VoicePrompter introduces iOS and iPadOS apps!
- **Scrolling Algorithm Improvement** - Major improvements to scrolling algorithm and smoothness. The teleprompter now glides between lines instead of jumping, for both word-by-word and line-by-line scrolling.
- **Accurate Voice Tracking** - Better at staying on the right line when your script repeats a word or phrase, with fewer accidental jumps on short, common words.
- **Adjustable Active Line Position** - Choose where the active reading line sits on the screen using a settings slider or menu bar control. Updates live as you drag.
- **Script Management** - Improved recent scripts list. Displays more text to distinguish scripts and allows clicking anywhere on a card to launch.
- **Preset Recovery** - Default preset now restores all settings, including active line position and screen-sharing visibility.

### Version 3.0
- **Native Platform Features** - Introduces iOS and iPadOS apps along with major macOS improvements.
- **Settings Presets** - Save favorite fonts, colors, sizes, and scrolling configurations to switch with a single click.
- **Smarter Voice Tracking** - Listens to the entire script at all times to follow the voice accurately, keep up when skipping around, and prevent jumping on repeats.
- **Backward Scrolling** - Prompter moves back to earlier lines if a section is read again.
- **Over-Full-Screen App Support** - Open the prompter overlay on top of full-screen presentations, meetings, and apps.
- **Right-to-Left (RTL) Support** - Text direction options for languages read from right to left.

### Version 2.3
- **Color Customization** - Font color choices with quick black/white presets.
- **Solid Background Color** - Choose custom background colors (solid black, white, or custom) instead of default system colors.
- **Mirror Mode** - Flip the teleprompter vertically to read naturally in physical teleprompter glass or beam-splitter setups.

### Version 2.2
- **Hover to Pause** - Automatically pauses Sound or Constant scrolling when the mouse hovers over the window.
- **Quick Menu Controls** - Toggle hover-to-pause from the menu bar Scrolling Mode settings.
- **Stats & Word Milestones** - Added milestone tracking for speaking achievements (200,000 and 500,000 words).
- **Settings Enhancements** - Restore Default Settings correctly resets preferences. Redesigned menu bar settings list controls with descriptions.

### Version 2.1
- **Sound Scrolling Mode** - Advances when sound is detected and pauses when silent, compatible with any language. Works with macOS Voice Isolation to filter background noise.
- **Constant Scrolling Mode** - Set a fixed speed for a steady automatic scroll without microphone access.
- **Voice Scrolling** - Custom word-by-word speech tracking using on-device recognition.
- **On-the-fly Adjustment** - Adjust speed and microphone sensitivity instantly.
- **Pacing Assistance** - Scrolling slows on longer words to match natural speaking rhythms.
- **Quick Access Settings** - Settings tab and redesigned menu bar popover for scrolling modes, speed, and audio inputs.
- **Onboarding Experience** - Streamlined setup flow for microphone and speech permissions highlighting on-device privacy.

### Version 2.0
- **Gliding Motion** - Smooth word-by-word scrolling instead of line jumps.
- **Detached Control Bar** - Controls stay static while the overlay window follows the cursor.
- **Auto-Start Microphone** - Automatically starts listening upon loading a script.
- **Tabbed Settings UI** - Organized tabs for Scripts, Stats, Help, General, License, and Menu Bar.
- **Menu Bar Configurator** - Customize widgets (opacity slider, font size, audio toggle) in the menu bar.
- **Aesthetic Overhaul** - SF Rounded font, customized menu bar icon, and option to snap controls below the camera notch.
- **Bug Fixes** - Resolved Safari speech recognition conflicts and asset shadow rendering bugs.

### Version 1.3.2
- **Analytics Polish** - Tweaked internal usage data analytics.

### Version 1.3.1
- **Keyboard Shortcuts** - Shortcut to toggle follow-mouse cursor mode (⌥⌘F) and speech recognition (⌥⌘S).

### Version 1.3
- **Follow Mouse Cursor** - Window follows cursor positioning as you move.
- **Glass Transparency** - Switch between translucent glass background and solid color with adjustable opacity.
- **Audio Device Selection** - Quick dropdown to select external mics or iPhone microphones.
- **Rating Prompts** - Quick in-app review prompting.

### Version 1.2
- **Lifetime Purchase** - One-time payment option added alongside subscription plans.

### Version 1.1
- **Auto Language Detection** - Integrates NLLanguageRecognizer to identify script languages.
- **Live Edit Mode** - Directly edit scripts inside the presentation overlay window.
- **Enhanced Control Bar** - Reordered actions (Edit, Microphone, Restart, Close).
- **Recent Scripts Expansion** - Capacity expanded to 100 scrollable scripts with copy-to-clipboard options.
- **Onboarding Tools** - Added tutorial links and pre-loaded interactive demo scripts.

---

## Web App & Website Updates
*Compiled chronologically from web application commits*

### July 2026
- **iPad Landing Page** - Created a dedicated landing page for iPad users.
- **Vite Build System & Use Cases** - Rebuilt use-case template links and optimized cross-linking for pricing sections.
- **SEO & Layout Fixes** - Standardized Safari max-content width scaling, corrected Mac landing margins, and unified iOS/macOS CTA button widths.

### June 2026
- **Voice Suppression Updates** - Added look-back window logic to suppress false triggers for voice command words.
- **Settings Resiliency** - Prevented app initialization crashes when the user has an empty recent scripts history.
- **iOS PWA Responsiveness** - Corrected tap offset coordinates in landscape mode and fixed history panel loading alignment.
- **Rotated Landscape Dock** - Kept floating player controls visible and interactive when PWA is locked or rotated.
- **Semantic SEO** - Integrated structured JSON-LD schemas and LLM-friendly TL;DR parameters for blog indexing.

### May 2026
- **Google Docs Integration** - Direct integration allowing users to import scripts from Google Docs. Uses custom proxy failovers (Codetabs) to eliminate production fetching latencies and secure strict fetch timeouts.
- **Safari Zoom Fix** - Set Google Docs input font-size to 16px to prevent iOS Safari auto-zooming on focus.
- **Device Selector Bypass for iOS** - Hidden device selector on iOS to prevent WebRTC conflicts with DJI mics and default routing.
- **Video Swipe Fix** - Prevented default Safari bouncing behaviors when swiping video overlays.
- **Content Expansion** - Added dedicated video walkthroughs and how-to guides for integrations with Zoom and Google Meet.
- **Landing Page Redesign** - Moved primary CTA buttons into the hero section and overhauled responsiveness across mobile viewports.

### April 2026
- **Dyslexic Accessibility** - Added OpenDyslexic font-picker options alongside classic Mono, Sans, and Serif categories.
- **Video Dock Controls** - Added recording dock opacity slider (30% to 100%) and customizable margins.
- **Bug Fixes** - Resolved line-height default mismatches and false-positive Safari 'Voice Not Available' alerts when starting/stopping speech sessions.

### March 2026
- **Custom Language Picker** - Added a manual selector supporting 34 languages alongside automatic language detection powered by the tinyld library.
- **PWA Routing Stability** - Fixed a critical Service Worker bug that intercepted GitHub Pages HTML paths.
- **Static Blog System** - Swapped client-side JS rendering for statically compiled HTML generation from markdown, improving load-time performance.
- **Domain Migration** - Transferred main domain routing from voiceprompter.xyz to voiceprompter.app.
- **Video Recording & Voice Commands** - Initial release of video mode (saving local recordings) and basic voice triggers (back/forward commands).

### February 2026
- **Responsiveness Overhaul** - Consolidated container grid layouts, fixed horizontal device margins, and standardized vertical spacing on mobile views.
- **Gold Theme Customization** - Configured warm dark mode preset featuring a customized gold (#FFBB00) accent palette.
- **Menu Architecture** - Shifted application shell route to `/app/` and added dedicated minimal landing pages for Mac and Web clients.

### December 2025
- **Scrolling Algorithm Rebuild** - Resolved double-jump scrolling bugs. Matches spoken transcripts against a deduplicated script word set by scanning nearest-neighbor terms first.
- **Customization Settings** - Replaced default line highlighting with a slider to configure lookahead words (1-10) and toggle animations.
