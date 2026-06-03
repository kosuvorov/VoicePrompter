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
    dockOpacityInput: HTMLInputElement;
    dockOpacityVal: HTMLElement;
    activeLinePositionInput: HTMLInputElement;
    activeLinePositionVal: HTMLElement;
    lookaheadWordsInput: HTMLInputElement;
    lookaheadWordsVal: HTMLElement;
    matchGroupSizeInput: HTMLInputElement;
    matchGroupSizeVal: HTMLElement;
    lookBackToggle: HTMLInputElement;
    textColorInput: HTMLInputElement;
    bgColorInput: HTMLInputElement;
    appBody: HTMLElement;
    micButton: HTMLElement;
    micIcon: HTMLElement;
    statusIndicator: HTMLElement;
    mirrorToggle: HTMLInputElement;
    browserWarning: HTMLElement;
    dismissWarningBtn: HTMLElement;
    ipadPwaWarning: HTMLElement;
    dismissIpadWarningBtn: HTMLElement;
    langDetectionWarning: HTMLElement;
    dismissLangWarningBtn: HTMLElement;
    androidVideoWarning: HTMLElement;
    dismissAndroidVideoWarningBtn: HTMLElement;
    historyList: HTMLElement;
    historySection: HTMLElement;
    stopSignToggle: HTMLInputElement;
    alignBtns: {
        left: HTMLElement;
        center: HTMLElement;
        right: HTMLElement;
    };
    dirBtns: {
        ltr: HTMLElement;
        rtl: HTMLElement;
    };
    // Buttons
    loadScriptBtn: HTMLElement;
    clearHistoryBtn: HTMLElement;
    resetAppBtn: HTMLElement;
    restartScriptBtn: HTMLElement;
    toggleSettingsBtn: HTMLElement;
    closeSettingsBtn: HTMLElement;
    themeDarkBtn: HTMLElement;
    themeLightBtn: HTMLElement;
    // Quick Actions
    copyScriptBtn: HTMLElement;
    clearScriptBtn: HTMLElement;
    pasteScriptBtn: HTMLElement;
    // Language Selection
    languageSelectContainer: HTMLElement;
    languageSelectSettingsContainer: HTMLElement;
    // Mac Promo Card
    settingsMacBanner: HTMLElement;
    // Toggles
    preserveFormattingToggle: HTMLInputElement;
    voiceCommandToggle: HTMLInputElement;
    screenRotationToggle: HTMLInputElement;
    smoothAnimationsToggle: HTMLInputElement;
    highlightActiveWordToggle: HTMLInputElement;
    // Font Family
    fontFamilyBtns: {
        mono: HTMLElement;
        sans: HTMLElement;
        serif: HTMLElement;
        comicSans: HTMLElement;
        openDyslexic: HTMLElement;
    };
    // Video Recording
    videoModeBtn: HTMLElement;
    videoPreview: HTMLVideoElement;
    videoContainer: HTMLElement;
    videoLayoutToggleBtn: HTMLElement;
    videoFlipCameraBtn: HTMLElement;
    videoRecordBtn: HTMLElement;
    videoStopBtn: HTMLElement;
    videoControls: HTMLElement;
    videoRecordingIndicator: HTMLElement;
    // Google Doc Integration
    importGoogleDocBtn: HTMLElement;
    googleDocModal: HTMLElement;
    googleDocUrlInput: HTMLInputElement;
    confirmGoogleDocImportBtn: HTMLElement;
    closeGoogleDocModalBtn: HTMLElement;
    pasteGoogleDocUrlBtn: HTMLElement;
    refreshGoogleDocBtn: HTMLElement;
    refreshGoogleDocContainer: HTMLElement;
    copyGoogleDocUrlBtn: HTMLElement;
    videoDeviceSelect: HTMLSelectElement;
    audioDeviceSelect: HTMLSelectElement;
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
        dockOpacityInput: document.getElementById('dockOpacityInput') as HTMLInputElement,
        dockOpacityVal: document.getElementById('dockOpacityVal')!,
        activeLinePositionInput: document.getElementById('activeLinePositionInput') as HTMLInputElement,
        activeLinePositionVal: document.getElementById('activeLinePositionVal')!,
        lookaheadWordsInput: document.getElementById('lookaheadWordsInput') as HTMLInputElement,
        lookaheadWordsVal: document.getElementById('lookaheadWordsVal')!,
        matchGroupSizeInput: document.getElementById('matchGroupSizeInput') as HTMLInputElement,
        matchGroupSizeVal: document.getElementById('matchGroupSizeVal')!,
        lookBackToggle: document.getElementById('lookBackToggle') as HTMLInputElement,
        textColorInput: document.getElementById('textColorInput') as HTMLInputElement,
        bgColorInput: document.getElementById('bgColorInput') as HTMLInputElement,
        appBody: document.getElementById('appBody')!,
        micButton: document.getElementById('micButton')!,
        micIcon: document.getElementById('micIcon')!,
        statusIndicator: document.getElementById('statusIndicator')!,
        mirrorToggle: document.getElementById('mirrorToggle') as HTMLInputElement,
        browserWarning: document.getElementById('browserWarning')!,
        dismissWarningBtn: document.getElementById('dismissWarningBtn')!,
        ipadPwaWarning: document.getElementById('ipadPwaWarning')!,
        dismissIpadWarningBtn: document.getElementById('dismissIpadWarningBtn')!,
        langDetectionWarning: document.getElementById('langDetectionWarning')!,
        dismissLangWarningBtn: document.getElementById('dismissLangWarningBtn')!,
        androidVideoWarning: document.getElementById('androidVideoWarning')!,
        dismissAndroidVideoWarningBtn: document.getElementById('dismissAndroidVideoWarningBtn')!,
        historyList: document.getElementById('historyList')!,
        historySection: document.getElementById('historySection')!,
        stopSignToggle: document.getElementById('stopSignToggle') as HTMLInputElement,
        alignBtns: {
            left: document.getElementById('alignLeftBtn')!,
            center: document.getElementById('alignCenterBtn')!,
            right: document.getElementById('alignRightBtn')!
        },
        dirBtns: {
            ltr: document.getElementById('dirLtrBtn')!,
            rtl: document.getElementById('dirRtlBtn')!
        },
        // Buttons
        loadScriptBtn: document.getElementById('loadScriptBtn')!,
        clearHistoryBtn: document.getElementById('clearHistoryBtn')!,
        resetAppBtn: document.getElementById('resetAppBtn')!,
        restartScriptBtn: document.getElementById('restartScriptBtn')!,
        toggleSettingsBtn: document.getElementById('toggleSettingsBtn')!,
        closeSettingsBtn: document.getElementById('closeSettingsBtn')!,
        themeDarkBtn: document.getElementById('themeDarkBtn')!,
        themeLightBtn: document.getElementById('themeLightBtn')!,
        // Quick Actions
        copyScriptBtn: document.getElementById('copyScriptBtn')!,
        clearScriptBtn: document.getElementById('clearScriptBtn')!,
        pasteScriptBtn: document.getElementById('pasteScriptBtn')!,
        // Language Selection
        languageSelectContainer: document.getElementById('languageSelectContainer')!,
        languageSelectSettingsContainer: document.getElementById('languageSelectSettingsContainer')!,
        // Mac Promo Card
        settingsMacBanner: document.getElementById('settings-mac-banner')!,
        // Toggles
        preserveFormattingToggle: document.getElementById('preserveFormattingToggle') as HTMLInputElement,
        voiceCommandToggle: document.getElementById('voiceCommandToggle') as HTMLInputElement,
        screenRotationToggle: document.getElementById('screenRotationToggle') as HTMLInputElement,
        smoothAnimationsToggle: document.getElementById('smoothAnimationsToggle') as HTMLInputElement,
        highlightActiveWordToggle: document.getElementById('highlightActiveWordToggle') as HTMLInputElement,
        // Font Family
        fontFamilyBtns: {
            mono: document.getElementById('fontFamilyMonoBtn')!,
            sans: document.getElementById('fontFamilySansBtn')!,
            serif: document.getElementById('fontFamilySerifBtn')!,
            comicSans: document.getElementById('fontFamilyComicSansBtn')!,
            openDyslexic: document.getElementById('fontFamilyOpenDyslexicBtn')!
        },
        // Video Recording
        videoModeBtn: document.getElementById('videoModeBtn')!,
        videoPreview: document.getElementById('videoPreview') as HTMLVideoElement,
        videoContainer: document.getElementById('videoContainer')!,
        videoLayoutToggleBtn: document.getElementById('videoLayoutToggleBtn')!,
        videoFlipCameraBtn: document.getElementById('videoFlipCameraBtn')!,
        videoRecordBtn: document.getElementById('videoRecordBtn')!,
        videoStopBtn: document.getElementById('videoStopBtn')!,
        videoControls: document.getElementById('videoControls')!,
        videoRecordingIndicator: document.getElementById('videoRecordingIndicator')!,
        // Google Doc Integration
        importGoogleDocBtn: document.getElementById('importGoogleDocBtn')!,
        googleDocModal: document.getElementById('googleDocModal')!,
        googleDocUrlInput: document.getElementById('googleDocUrlInput') as HTMLInputElement,
        confirmGoogleDocImportBtn: document.getElementById('confirmGoogleDocImportBtn')!,
        closeGoogleDocModalBtn: document.getElementById('closeGoogleDocModalBtn')!,
        pasteGoogleDocUrlBtn: document.getElementById('pasteGoogleDocUrlBtn')!,
        refreshGoogleDocBtn: document.getElementById('refreshGoogleDocBtn')!,
        refreshGoogleDocContainer: document.getElementById('refreshGoogleDocContainer')!,
        copyGoogleDocUrlBtn: document.getElementById('copyGoogleDocUrlBtn')!,
        videoDeviceSelect: document.getElementById('videoDeviceSelect') as HTMLSelectElement,
        audioDeviceSelect: document.getElementById('audioDeviceSelect') as HTMLSelectElement
    };
}
