import { state } from './state';
import { updateHighlight, scrollToCurrent, updateMicUI } from './render';

class AutoScrollManager {
    private timer: number | null = null;
    private audioContext: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private source: MediaStreamAudioSourceNode | null = null;
    private dataArray: Uint8Array | null = null;

    private accumulator: number = 0;
    private lastSoundTime: number = 0;
    private readonly soundHoldDuration: number = 250; // ms
    private mediaStream: MediaStream | null = null;

    public start() {
        this.stop();
        this.accumulator = 0;
        this.lastSoundTime = 0;

        if (state.config.scrollingMode === 'sound') {
            this.startAudioMonitor();
        }

        // Timer runs every 100ms
        this.timer = window.setInterval(() => {
            this.tick();
        }, 100);
    }

    public stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.stopAudioMonitor();
        this.accumulator = 0;
    }

    private async startAudioMonitor() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: state.selectedAudioDeviceId ? { deviceId: { exact: state.selectedAudioDeviceId } } : true 
            });
            this.mediaStream = stream;
            
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            this.audioContext = new AudioContextClass();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

            this.source = this.audioContext.createMediaStreamSource(stream);
            this.source.connect(this.analyser);
            
            this.pollAudio();
        } catch (err) {
            console.error('Failed to start audio monitor for sound activation:', err);
            // Optionally revert to constant scrolling or show an error
        }
    }

    private stopAudioMonitor() {
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(t => t.stop());
            this.mediaStream = null;
        }
        this.analyser = null;
        this.dataArray = null;
        this.source = null;
    }

    private pollAudio = () => {
        if (!this.analyser || !this.dataArray || state.config.scrollingMode !== 'sound') return;

        this.analyser.getByteTimeDomainData(this.dataArray as any);
        
        // Calculate RMS
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            const val = (this.dataArray[i] - 128) / 128.0;
            sum += val * val;
        }
        const rms = Math.sqrt(sum / this.dataArray.length);

        // Calculate threshold based on sensitivity (0.0 to 1.0)
        // Native formula: 0.002 + (1.0 - sensitivity) * 0.048
        const sensitivity = state.config.soundSensitivity;
        const threshold = 0.002 + (1.0 - sensitivity) * 0.048;

        if (rms > threshold) {
            this.lastSoundTime = performance.now();
        }

        requestAnimationFrame(this.pollAudio);
    };

    private tick() {
        if (state.currentIndex >= state.scriptWords.length) {
            this.stop();
            state.isListening = false;
            updateMicUI(false);
            return;
        }

        if (state.config.scrollingMode === 'sound') {
            const timeSinceSound = performance.now() - this.lastSoundTime;
            if (timeSinceSound > this.soundHoldDuration) {
                return; // Paused waiting for sound
            }
        }

        const charsPerSecond = state.config.scrollSpeed * 5.0;
        this.accumulator += 0.1 * charsPerSecond; // 100ms interval

        let advanced = false;
        while (true) {
            if (state.currentIndex >= state.scriptWords.length) break;
            
            const currentWord = state.scriptWords[state.currentIndex];
            const wordChars = Math.max(3, currentWord.clean.length || 5);

            if (this.accumulator >= wordChars) {
                this.accumulator -= wordChars;
                state.currentIndex++;
                advanced = true;
            } else {
                break;
            }
        }

        if (advanced) {
            updateHighlight();
            scrollToCurrent();
        }
    }
}

export const autoScrollManager = new AutoScrollManager();
