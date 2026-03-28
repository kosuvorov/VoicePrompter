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
    showStopIcon: boolean;
    preserveFormatting: boolean;
    voiceCommandsEnabled: boolean;
    paragraphSpacing: number;
    smoothAnimations: boolean;
    highlightActiveWord: boolean;
    activeLinePosition: number; // 0 to 100 (percentage from top)
    lookaheadWords: number; // 1-10 words to look ahead
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
    isRecording: boolean;
    mediaRecorder: MediaRecorder | null;
    mediaStream: MediaStream | null;
    recordedChunks: Blob[];
}

export interface HistoryItem {
    id: number;
    text: string;
    preview: string;
    date: string;
    tag?: string;
}
