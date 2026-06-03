export type VideoLayoutMode = 'split' | 'overlay';

export interface ScriptWord {
    word: string;
    clean: string;
    element: HTMLElement | null;
    skip: boolean;
    isStop: boolean;
    isBreak?: boolean;
}

export interface AppConfig {
    fontSize: number;
    lineHeight: number;
    margin: number;
    textColor: string;
    bgColor: string;
    textAlign: 'left' | 'center' | 'right';
    textDirection: 'ltr' | 'rtl';
    showStopIcon: boolean;
    preserveFormatting: boolean;
    voiceCommandsEnabled: boolean;
    paragraphSpacing: number;
    smoothAnimations: boolean;
    highlightActiveWord: boolean;
    activeLinePosition: number; // 0 to 100 (percentage from top)
    lookaheadWords: number; // 1-10 words to look ahead
    matchGroupSize: number; // consecutive words required per match (bigrams=2, then 3, 4, ...)
    dockOpacity: number; // 0-100 opacity of dock while recording
    fontFamily: string; // Font family for the script
}

export interface AppState {
    isListening: boolean;
    scriptWords: ScriptWord[];
    currentIndex: number;
    recognition: any; // Using any for SpeechRecognition as it's experimental
    isMirrored: boolean;
    isScreenRotated: boolean;
    selectedLanguage: string;
    languageSetting: string;
    detectedLanguage: string | null;
    config: AppConfig;
    // Video recording state
    isVideoMode: boolean;
    videoLayoutMode: VideoLayoutMode;
    facingMode: 'user' | 'environment';
    isRecording: boolean;
    mediaRecorder: MediaRecorder | null;
    mediaStream: MediaStream | null;
    recordedChunks: Blob[];
    googleDocUrl: string | null;
    selectedVideoDeviceId: string | null;
    selectedAudioDeviceId: string | null;
}

export interface HistoryItem {
    id: number;
    text: string;
    preview: string;
    date: string;
    tag?: string;
    googleDocUrl?: string;
}
