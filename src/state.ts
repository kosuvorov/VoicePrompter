import { AppState } from './types';

export const state: AppState = {
    isListening: false,
    scriptWords: [],
    currentIndex: 0,
    recognition: null,
    isMirrored: false,
    selectedLanguage: 'en-US', // User's selected language
    config: {
        fontSize: 40,
        lineHeight: 1.0,
        margin: 0,
        textColor: '#ffffff',
        bgColor: '#000000',
        textAlign: 'left',
        showStopIcon: false,
        preserveFormatting: false,
        voiceCommandsEnabled: true,
        paragraphSpacing: 0.5
    }
};
