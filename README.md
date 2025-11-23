# 🎬 Voice Teleprompter

**Access the app:** [https://voiceprompter.xyz/](https://voiceprompter.xyz/)

A modern, privacy-focused voice-controlled teleprompter that works completely offline. Uses your browser's built-in speech recognition (Web Speech API) and native iOS WebKit — no external APIs, completely private, and blazing fast on-device processing.

## ✨ Key Features

- 🎙️ **Voice-Controlled Scrolling** - Navigate your script hands-free using voice commands
- 🔒 **100% Private** - All processing happens on your device using native browser APIs
- 📱 **Works Offline** - Install as a PWA (Progressive Web App) for offline access
- 🌐 **Multi-Language Support** - Auto-detect or manually select from 20+ languages
- 🪞 **Mirror Mode** - Perfect for teleprompter glass setups (horizontal flip + 180° rotation)
- 📱 **Screen Rotation** - 90° clockwise rotation for iOS devices in landscape mode
- ⚙️ **Highly Customizable** - Font size, spacing, colors, themes, and more
- 📜 **Script History** - Automatically saves your recent scripts locally
- 🎨 **Modern UI** - Beautiful dark/light themes with smooth animations

## 🌍 Browser Support

### ✅ Fully Supported
- **Chrome/Edge** (Desktop & Mobile) - Best experience
- **Safari** (Desktop & iOS) - Full support including PWA
- **Chrome for iOS** - Full functionality

### ⚠️ Speech Recognition Availability
Voice control requires the Web Speech API, which is available in:
- Chrome, Edge, Safari (desktop and mobile)
- **Not available in Firefox** (manual scrolling still works)

## 📥 Installing as a PWA (Progressive Web App)

### On iOS (iPhone/iPad)
1. Open the app in **Safari**
2. Tap the **Share** button (square with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **"Add"**
5. The app will appear on your home screen like a native app

### On Android
1. Open the app in **Chrome**
2. Tap the menu (three dots)
3. Tap **"Add to Home Screen"** or **"Install App"**
4. Tap **"Install"**

### On Desktop (Chrome/Edge)
1. Open the app
2. Look for the install icon (➕) in the address bar
3. Click **"Install"**

Once installed, the app works completely offline and launches like a native application!

## 🎯 How to Use

### Getting Started
1. **Paste Your Script** - Copy and paste your text into the input field
2. **Choose Language** - Auto-detect or manually select your language
3. **Start Teleprompter** - Click the "Start Teleprompter" button
4. **Enable Voice Control** - Click the microphone button to start voice recognition

### Voice Commands
The app listens to your speech and automatically scrolls as you read. Simply speak your script naturally!

**Special Voice Commands:**
- Say **"prompter restart"** - Jumps back to the beginning of your script

### Manual Navigation
- **Click any word** - Jump to that position in the script
- **Restart button** (↻) - Reset to the beginning
- **Back button** (←) - Return to the editor

## ⚙️ Features Explained

### Alignment
Choose how your text is aligned:
- **Left** - Text aligned to the left
- **Center** - Centered text (traditional teleprompter style)
- **Right** - Text aligned to the right

### Toggles

#### Mirror Mode 🪞
Enables horizontal flip + 180° rotation — perfect for use with teleprompter glass. The reflected text reads correctly when bounced off a mirror/glass placed in front of the camera.

#### Show Stop Signs 🛑
Displays visual markers (dots) at punctuation marks (periods, exclamation points, question marks) to help you pace your reading.

#### Voice Commands 🎤
Enable/disable voice command recognition (e.g., "prompter restart").

#### Rotate Screen 📱
Rotates the entire app 90° clockwise — useful for iOS devices where screen orientation is locked to portrait but you want to use the teleprompter in landscape mode.

#### Preserve Formatting 📝
When enabled, preserves line breaks and paragraph spacing from your original text. When disabled, reformats text as continuous flow.

### Sliders

#### Font Size
Adjust text size (20px - 100px) for comfortable reading at various distances.

#### Line Spacing
Control the vertical space between lines (0.6x - 1.4x) for better readability.

#### Paragraph Spacing
Adjust the space between paragraphs (0 - 1em) when using line breaks.

#### Side Margins
Add horizontal margins (0 - 200px) to narrow the text column for easier reading.

### Themes & Colors

#### Theme Presets
- **Dark Theme** - White text on black background (default, reduces eye strain)
- **Light Theme** - Black text on white background

#### Custom Colors
- **Text Color** - Choose any text color using the color picker
- **Background Color** - Choose any background color using the color picker

## 🗣️ Language Support

The app supports automatic language detection and manual selection for:

English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Chinese, Korean, Arabic, Dutch, Polish, Ukrainian, Hindi, Turkish, Swedish, Danish, Finnish, Norwegian, and more.

**Auto-Detect** automatically identifies the language of your script and selects the appropriate speech recognition model.

## 💾 Script History

Your scripts are automatically saved to your browser's local storage:
- View recent scripts in the history section
- Click any saved script to reload it
- Clear history with one click
- Scripts persist even when offline

## 🔐 Privacy & Security

- **No External Services** - Everything runs locally in your browser
- **No Data Collection** - Your scripts never leave your device
- **Offline Capable** - Works without internet connection (after initial load)
- **Open Source** - Code available on GitHub for transparency

## 🎨 Tips for Best Experience

1. **Use Dark Theme** - Easier on the eyes during long sessions
2. **Large Font Size** - 40-60px works well for most setups
3. **Center Alignment** - Traditional teleprompter style
4. **Adjust Spacing** - Reduce line spacing for denser text, increase for easier reading
5. **Install as PWA** - Better performance and offline access
6. **Use Chrome/Safari** - Best speech recognition support
7. **Test Voice Control** - Practice reading a few lines to calibrate

## 🆘 Troubleshooting

### Voice recognition not working?
- Ensure you're using a supported browser (Chrome, Edge, Safari)
- Grant microphone permissions when prompted
- Check that "Voice Commands" toggle is enabled
- Try refreshing the page

### Buttons not visible in Safari landscape mode?
- Refresh the page
- Buttons should appear at the bottom with proper positioning

### App not working offline?
- Install the PWA using the instructions above
- Ensure you've opened the app at least once while online

## 🛠️ Technical Stack

- **Framework:** Vite + TypeScript
- **Styling:** Tailwind CSS
- **PWA:** Workbox (service worker for offline support)
- **APIs:** Web Speech API, Clipboard API, Local Storage
- **Language Detection:** franc-min library

## 📄 License

MIT License - Free to use and modify

---

Made with ❤️ for content creators, presenters, and anyone who needs a reliable teleprompter.
