export interface Elements {
    setupScreen: HTMLElement;
    prompterContainer: HTMLElement;
    inputScript: HTMLTextAreaElement;
    scriptContent: HTMLElement;
    scrollContainer: HTMLElement;
    topSpacer: HTMLElement;
    settingsPanel: HTMLElement;
    fontSizeInput: HTMLInputElement;
    fontSizeVal: HTMLElement;
    lineHeightInput: HTMLInputElement;
    lineHeightVal: HTMLElement;
    paragraphSpacingInput: HTMLInputElement;
    paragraphSpacingVal: HTMLElement;
    marginInput: HTMLInputElement;
    marginVal: HTMLElement;
    textColorInput: HTMLInputElement;
    bgColorInput: HTMLInputElement;
    appBody: HTMLElement;
    micButton: HTMLElement;
    micIcon: HTMLElement;
    statusIndicator: HTMLElement;
    mirrorToggle: HTMLInputElement;
    browserWarning: HTMLElement;
    historyList: HTMLElement;
    historySection: HTMLElement;
    stopSignToggle: HTMLInputElement;
    alignBtns: {
        left: HTMLElement;
        center: HTMLElement;
        right: HTMLElement;
    };
    // Buttons
    loadScriptBtn: HTMLElement;
    clearHistoryBtn: HTMLElement;
    resetAppBtn: HTMLElement;
    restartScriptBtn: HTMLElement;
    toggleSettingsBtn: HTMLElement;
    themeDarkBtn: HTMLElement;
    themeLightBtn: HTMLElement;
    // Quick Actions
    copyScriptBtn: HTMLElement;
    clearScriptBtn: HTMLElement;
    pasteScriptBtn: HTMLElement;
    // Language Selection
    languageSelect: HTMLSelectElement;
    autoDetectBtn: HTMLElement;
    // Toggles
    preserveFormattingToggle: HTMLInputElement;
    voiceCommandToggle: HTMLInputElement;
    screenRotationToggle: HTMLInputElement;
}

export let els: Elements;

export function initElements(): void {
    els = {
        setupScreen: document.getElementById('setupScreen')!,
        prompterContainer: document.getElementById('prompterContainer')!,
        inputScript: document.getElementById('inputScript') as HTMLTextAreaElement,
        scriptContent: document.getElementById('scriptContent')!,
        scrollContainer: document.getElementById('scrollContainer')!,
        topSpacer: document.getElementById('topSpacer')!,
        settingsPanel: document.getElementById('settingsPanel')!,
        fontSizeInput: document.getElementById('fontSizeInput') as HTMLInputElement,
        fontSizeVal: document.getElementById('fontSizeVal')!,
        lineHeightInput: document.getElementById('lineHeightInput') as HTMLInputElement,
        lineHeightVal: document.getElementById('lineHeightVal')!,
        paragraphSpacingInput: document.getElementById('paragraphSpacingInput') as HTMLInputElement,
        paragraphSpacingVal: document.getElementById('paragraphSpacingVal')!,
        marginInput: document.getElementById('marginInput') as HTMLInputElement,
        marginVal: document.getElementById('marginVal')!,
        textColorInput: document.getElementById('textColorInput') as HTMLInputElement,
        bgColorInput: document.getElementById('bgColorInput') as HTMLInputElement,
        appBody: document.getElementById('appBody')!,
        micButton: document.getElementById('micButton')!,
        micIcon: document.getElementById('micIcon')!,
        statusIndicator: document.getElementById('statusIndicator')!,
        mirrorToggle: document.getElementById('mirrorToggle') as HTMLInputElement,
        browserWarning: document.getElementById('browserWarning')!,
        historyList: document.getElementById('historyList')!,
        historySection: document.getElementById('historySection')!,
        stopSignToggle: document.getElementById('stopSignToggle') as HTMLInputElement,
        alignBtns: {
            left: document.getElementById('alignLeftBtn')!,
            center: document.getElementById('alignCenterBtn')!,
            right: document.getElementById('alignRightBtn')!
        },
        // Buttons
        loadScriptBtn: document.getElementById('loadScriptBtn')!,
        clearHistoryBtn: document.getElementById('clearHistoryBtn')!,
        resetAppBtn: document.getElementById('resetAppBtn')!,
        restartScriptBtn: document.getElementById('restartScriptBtn')!,
        toggleSettingsBtn: document.getElementById('toggleSettingsBtn')!,
        themeDarkBtn: document.getElementById('themeDarkBtn')!,
        themeLightBtn: document.getElementById('themeLightBtn')!,
        // Quick Actions
        copyScriptBtn: document.getElementById('copyScriptBtn')!,
        clearScriptBtn: document.getElementById('clearScriptBtn')!,
        pasteScriptBtn: document.getElementById('pasteScriptBtn')!,
        // Language Selection
        languageSelect: document.getElementById('languageSelect') as HTMLSelectElement,
        autoDetectBtn: document.getElementById('autoDetectBtn')!,
        // Toggles
        preserveFormattingToggle: document.getElementById('preserveFormattingToggle') as HTMLInputElement,
        voiceCommandToggle: document.getElementById('voiceCommandToggle') as HTMLInputElement,
        screenRotationToggle: document.getElementById('screenRotationToggle') as HTMLInputElement
    };
}
