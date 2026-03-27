import { AppState } from './types';

export const state: AppState = {
    scriptWords: [],
    currentIndex: 0,
    recognition: null,
    isListening: false,
    isMirrored: false,
    isScreenRotated: false,
    selectedLanguage: 'en-US', // Target language for SpeechRecognition
    languageSetting: 'auto', // User's dropdown preference
    detectedLanguage: null,
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
        highlightActiveWord: true,
        activeLinePosition: 35, // Default to 35% from top
        lookaheadWords: 5 // Default lookahead
    },
    // Video recording state
    isVideoMode: false,
    videoLayoutMode: 'split',
    isRecording: false,
    mediaRecorder: null,
    mediaStream: null,
    recordedChunks: []
};
