import { state } from './state';
import { updateHighlight, scrollToCurrent, advancePastSkipped } from './render';

let transcriber: any = null;
let loadedModel: 'en' | 'multilingual' | null = null;
let isRunning = false;
let mediaStream: MediaStream | null = null;
let mediaRecorder: MediaRecorder | null = null;
let lastMatchedWord = '';

export type WhisperStatus =
    | { type: 'idle' }
    | { type: 'loading'; progress: number; message: string }
    | { type: 'ready' }
    | { type: 'listening' }
    | { type: 'error'; message: string };

let statusCallback: ((s: WhisperStatus) => void) | null = null;

export function setWhisperStatusCallback(cb: ((s: WhisperStatus) => void) | null): void {
    statusCallback = cb;
}

function emit(s: WhisperStatus) {
    statusCallback?.(s);
}

export async function loadWhisperModel(variant: 'en' | 'multilingual' = 'en'): Promise<boolean> {
    if (transcriber && loadedModel === variant) {
        emit({ type: 'ready' });
        return true;
    }

    // Discard cached model if switching variant
    if (transcriber && loadedModel !== variant) {
        transcriber = null;
        loadedModel = null;
    }

    const modelId = variant === 'multilingual' ? 'Xenova/whisper-tiny' : 'Xenova/whisper-tiny.en';
    emit({ type: 'loading', progress: 0, message: 'Preparing offline speech model...' });

    try {
        // Dynamic import so Vite doesn't bundle @xenova/transformers eagerly
        const { pipeline, env } = await import('@xenova/transformers');
        env.allowLocalModels = false;

        transcriber = await pipeline(
            'automatic-speech-recognition',
            modelId,
            {
                progress_callback: (p: any) => {
                    if (p.status === 'progress' && p.total) {
                        const pct = Math.round((p.loaded / p.total) * 100);
                        emit({ type: 'loading', progress: pct, message: `Downloading model… ${pct}%` });
                    } else if (p.status === 'done') {
                        emit({ type: 'loading', progress: 100, message: 'Finalising…' });
                    }
                }
            }
        );

        loadedModel = variant;
        emit({ type: 'ready' });
        return true;
    } catch (err) {
        console.error('Whisper load error:', err);
        emit({ type: 'error', message: 'Failed to load offline model. Check your connection and try again.' });
        transcriber = null;
        loadedModel = null;
        return false;
    }
}

export async function startWhisperListening(): Promise<void> {
    if (!transcriber || isRunning) return;
    isRunning = true;
    lastMatchedWord = '';

    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (err) {
        console.error('Whisper: mic access denied', err);
        isRunning = false;
        emit({ type: 'error', message: 'Microphone access denied.' });
        return;
    }

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : '';

    mediaRecorder = mimeType
        ? new MediaRecorder(mediaStream, { mimeType })
        : new MediaRecorder(mediaStream);

    emit({ type: 'listening' });

    // Collect 4-second chunks continuously
    mediaRecorder.addEventListener('dataavailable', async (e: BlobEvent) => {
        if (!isRunning || e.data.size < 1000) return; // skip silence/tiny blobs
        transcribeChunk(e.data);
    });

    mediaRecorder.addEventListener('stop', () => {
        if (mediaStream) {
            mediaStream.getTracks().forEach(t => t.stop());
            mediaStream = null;
        }
    });

    mediaRecorder.start(4000); // fire dataavailable every 4 seconds
}

export function stopWhisperListening(): void {
    isRunning = false;
    try {
        mediaRecorder?.stop();
    } catch (_) { /* ignore if already stopped */ }
    mediaRecorder = null;
    emit({ type: 'idle' });
}

async function transcribeChunk(blob: Blob): Promise<void> {
    if (!transcriber || !isRunning) return;

    try {
        const arrayBuffer = await blob.arrayBuffer();
        const ctx = new AudioContext();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        await ctx.close();

        // Mix down to mono Float32Array
        const samples = audioBuffer.getChannelData(0);

        const result = await transcriber(samples, {
            sampling_rate: audioBuffer.sampleRate,
            chunk_length_s: 30,
        });

        const text: string = result?.text?.trim() ?? '';
        if (!text || !isRunning) return;

        const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
        matchWords(words.slice(-8));
    } catch (err) {
        console.error('Whisper transcription error:', err);
    }
}

function matchWords(spokenWords: string[]) {
    if (state.currentIndex >= state.scriptWords.length) return;
    if (spokenWords.length === 0) return;

    const LOOKAHEAD = state.config.lookaheadWords;

    const spokenSet = new Set(
        spokenWords
            .map(w => w.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase())
            .filter(w => w.length > 0)
    );

    if (spokenSet.size === 0) return;

    let scriptPtr = state.currentIndex;
    let validWordsChecked = 0;

    while (scriptPtr < state.scriptWords.length && validWordsChecked < LOOKAHEAD) {
        const scriptWordObj = state.scriptWords[scriptPtr];

        if (scriptWordObj.skip) {
            scriptPtr++;
            continue;
        }

        if (spokenSet.has(scriptWordObj.clean)) {
            if (scriptWordObj.clean === lastMatchedWord && validWordsChecked > 0) {
                scriptPtr++;
                validWordsChecked++;
                continue;
            }

            lastMatchedWord = scriptWordObj.clean;
            state.currentIndex = scriptPtr + 1;
            advancePastSkipped();
            updateHighlight();
            scrollToCurrent();
            return;
        }

        scriptPtr++;
        validWordsChecked++;
    }
}
