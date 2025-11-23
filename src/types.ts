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
}

export interface AppState {
    isListening: boolean;
    scriptWords: ScriptWord[];
    currentIndex: number;
    recognition: any; // Using any for SpeechRecognition as it's experimental
    isMirrored: boolean;
    isScreenRotated: boolean;
    selectedLanguage: string;
    config: AppConfig;
}

export interface HistoryItem {
    id: number;
    text: string;
    preview: string;
    date: string;
}
