import { AppState } from './types';

export const state: AppState = {
    scriptWords: [],
    currentIndex: 0,
    recognition: null,
    isListening: false,
    isMirrored: false,
    isMirroredH: false,
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
        textDirection: 'ltr',
        showStopIcon: false,
        preserveFormatting: true,
        voiceCommandsEnabled: false,
        paragraphSpacing: 0.5,
        smoothAnimations: false,
        highlightActiveWord: true,
        activeLinePosition: 35, // Default to 35% from top
        lookaheadWords: 5, // Default lookahead
        dockOpacity: 50, // Default dock opacity (50%)
        fontFamily: 'mono', // Default font
        scrollingMode: 'voice',
        scrollSpeed: 3.5,
        soundSensitivity: 0.75
    },
    // Video recording state
    isVideoMode: false,
    videoLayoutMode: 'split',
    facingMode: 'user',
    isRecording: false,
    mediaRecorder: null,
    mediaStream: null,
    recordedChunks: [],
    googleDocUrl: null,
    selectedVideoDeviceId: null,
    selectedAudioDeviceId: null
};
