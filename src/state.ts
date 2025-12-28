import { AppState } from './types';

export const state: AppState = {
    scriptWords: [],
    currentIndex: 0,
    recognition: null,
    isListening: false,
    isMirrored: false,
    isScreenRotated: false,
    selectedLanguage: 'en-US', // User's selected language
    config: {
        fontSize: 40,
        lineHeight: 1.0,
        margin: 0,
        textColor: '#ffffff',
        bgColor: '#000000',
        textAlign: 'left',
        showStopIcon: false,
        preserveFormatting: true,
        voiceCommandsEnabled: true,
        paragraphSpacing: 0.5,
        smoothAnimations: false,
        highlightActiveWord: false,
        activeLinePosition: 35 // Default to 35% from top
    }
};
