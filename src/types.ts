export type VideoLayoutMode = 'split' | 'overlay';
export type ScrollingMode = 'voice' | 'sound' | 'constant';

// ── Web Speech API ────────────────────────────────────────────────────────
// SpeechRecognition is still non-standard and unevenly implemented, so it has
// no DOM lib types. These describe only the surface this app actually uses.
export interface SpeechRecognitionAlternative {
    readonly transcript: string;
}

export interface SpeechRecognitionResult {
    readonly length: number;
    readonly [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionEvent {
    readonly resultIndex: number;
    readonly results: {
        readonly length: number;
        readonly [index: number]: SpeechRecognitionResult;
    };
}

export interface SpeechRecognitionErrorEvent {
    readonly error: string;
    readonly message: string;
}

export interface SpeechRecognition {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    start(): void;
    stop(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
}

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
    dockOpacity: number; // 0-100 opacity of dock while recording
    fontFamily: string; // Font family for the script
    scrollingMode: ScrollingMode;
    scrollSpeed: number; // Words per second
    soundSensitivity: number; // 0 to 1
}

export interface AppState {
    isListening: boolean;
    scriptWords: ScriptWord[];
    currentIndex: number;
    recognition: SpeechRecognition | null;
    isMirrored: boolean;
    isMirroredH: boolean;
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
