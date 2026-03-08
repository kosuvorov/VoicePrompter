import { state } from './state';
import { els } from './elements';

export async function enterVideoMode(): Promise<void> {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true
        });
        state.mediaStream = stream;
        state.isVideoMode = true;
        state.videoLayoutMode = 'split';

        // Attach stream to video preview
        els.videoPreview.srcObject = stream;
        els.videoPreview.muted = true;
        await els.videoPreview.play();

        // Show video UI
        els.videoContainer.classList.remove('hidden');
        els.videoControls.classList.remove('hidden');

        // Apply split layout by default
        applyVideoLayout();

        (window as any).umami?.track('video-mode-enter');
    } catch (err) {
        console.error('Failed to access camera:', err);
        alert('Could not access your camera. Please allow camera and microphone permissions.');
    }
}

export function exitVideoMode(): void {
    // Stop recording if active
    if (state.isRecording) {
        stopRecording();
    }

    // Stop all media tracks
    if (state.mediaStream) {
        state.mediaStream.getTracks().forEach(track => track.stop());
        state.mediaStream = null;
    }

    // Reset video element
    els.videoPreview.srcObject = null;

    // Hide video UI
    els.videoContainer.classList.add('hidden');
    els.videoControls.classList.add('hidden');

    // Remove layout classes
    els.prompterContainer.classList.remove('video-mode-split', 'video-mode-overlay');

    state.isVideoMode = false;
    state.isRecording = false;
    state.mediaRecorder = null;
    state.recordedChunks = [];

    // Update button states
    els.videoRecordBtn.classList.remove('hidden');
    els.videoStopBtn.classList.add('hidden');
    els.videoRecordingIndicator.classList.add('hidden');

    (window as any).umami?.track('video-mode-exit');
}

export function toggleVideoLayout(): void {
    state.videoLayoutMode = state.videoLayoutMode === 'split' ? 'overlay' : 'split';
    applyVideoLayout();
    (window as any).umami?.track('video-layout-toggle', { layout: state.videoLayoutMode });
}

function applyVideoLayout(): void {
    els.prompterContainer.classList.remove('video-mode-split', 'video-mode-overlay');

    if (state.videoLayoutMode === 'split') {
        els.prompterContainer.classList.add('video-mode-split');
        els.videoLayoutToggleBtn.textContent = '⬜ Overlay';
        els.videoLayoutToggleBtn.title = 'Switch to overlay mode';
    } else {
        els.prompterContainer.classList.add('video-mode-overlay');
        els.videoLayoutToggleBtn.textContent = '⬜ Split';
        els.videoLayoutToggleBtn.title = 'Switch to split mode';
    }
}

export function startRecording(): void {
    if (!state.mediaStream) return;

    state.recordedChunks = [];

    // Prefer MP4 with H.264 (supported in Chrome 120+, Safari)
    // Fall back to WebM if MP4 is not available
    const mimeTypes = [
        'video/mp4;codecs=avc1,opus',
        'video/mp4;codecs=avc1',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm'
    ];

    let selectedMimeType = '';
    for (const mt of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mt)) {
            selectedMimeType = mt;
            break;
        }
    }

    try {
        state.mediaRecorder = selectedMimeType
            ? new MediaRecorder(state.mediaStream, { mimeType: selectedMimeType })
            : new MediaRecorder(state.mediaStream);
    } catch (e) {
        state.mediaRecorder = new MediaRecorder(state.mediaStream);
    }

    state.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
            state.recordedChunks.push(event.data);
        }
    };

    state.mediaRecorder.onstop = () => {
        downloadRecording();
    };

    state.mediaRecorder.start(1000); // Collect data every second
    state.isRecording = true;

    // Update UI
    els.videoRecordBtn.classList.add('hidden');
    els.videoStopBtn.classList.remove('hidden');
    els.videoRecordingIndicator.classList.remove('hidden');

    (window as any).umami?.track('video-record-start');
}

export function stopRecording(): void {
    if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
        state.mediaRecorder.stop();
    }
    state.isRecording = false;

    // Update UI
    els.videoRecordBtn.classList.remove('hidden');
    els.videoStopBtn.classList.add('hidden');
    els.videoRecordingIndicator.classList.add('hidden');

    (window as any).umami?.track('video-record-stop');
}

function downloadRecording(): void {
    if (state.recordedChunks.length === 0) return;

    // Determine file extension from the actual mimeType used
    const actualMime = state.mediaRecorder?.mimeType || '';
    const isMP4 = actualMime.includes('mp4');
    const extension = isMP4 ? 'mp4' : 'webm';
    const blobType = isMP4 ? 'video/mp4' : 'video/webm';

    const blob = new Blob(state.recordedChunks, { type: blobType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
    a.download = `voiceprompter-recording-${timestamp}.${extension}`;

    a.href = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Cleanup
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    state.recordedChunks = [];
}
