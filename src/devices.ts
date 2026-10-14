import { state } from './state';
import { els } from './elements';

/**
 * Enumerates all connected media devices (cameras and microphones) and populates
 * the respective select elements in the settings panel.
 * 
 * If requestPermissionIfNeeded is true and the browser does not expose device labels
 * (which happens when permissions are not yet granted), we request permission temporarily.
 */
export async function enumerateAndPopulateDevices(
    requestPermissionIfNeeded = false,
    permissionKind: 'video' | 'audio' | 'both' = 'both'
): Promise<void> {
    try {
        let devices = await navigator.mediaDevices.enumerateDevices();
        
        // If we have input devices but no labels, try requesting permissions to resolve labels.
        const hasInputsWithoutLabels = devices.some(
            d => (d.kind === 'videoinput' || d.kind === 'audioinput') && !d.label
        );

        if (hasInputsWithoutLabels && requestPermissionIfNeeded) {
            try {
                // Request stream for the specific requested device type
                const constraints: MediaStreamConstraints = {};
                if (permissionKind === 'video' || permissionKind === 'both') {
                    constraints.video = true;
                }
                if (permissionKind === 'audio' || permissionKind === 'both') {
                    constraints.audio = true;
                }

                const tempStream = await navigator.mediaDevices.getUserMedia(constraints);
                // Stop the tracks immediately so camera/mic usage indicators go away
                tempStream.getTracks().forEach(track => track.stop());
                // Re-enumerate to get labeled devices
                devices = await navigator.mediaDevices.enumerateDevices();
            } catch (err) {
                console.warn('Failed to obtain permissions for device enumeration:', err);
            }
        }

        const videoSelect = els.videoDeviceSelect;
        const audioSelect = els.audioDeviceSelect;

        if (!videoSelect || !audioSelect) return;

        // Remember user selections
        const prevVideoId = videoSelect.value || state.selectedVideoDeviceId;
        const prevAudioId = audioSelect.value || state.selectedAudioDeviceId;

        // Find default device labels (usually the first in the list, or deviceId === 'default')
        const firstCamera = devices.find(d => d.kind === 'videoinput' && d.deviceId && d.label);
        const defaultMic = devices.find(d => d.kind === 'audioinput' && d.deviceId === 'default' && d.label)
            || devices.find(d => d.kind === 'audioinput' && d.deviceId && d.label);

        const cameraDefaultText = firstCamera ? `Default Camera (${firstCamera.label})` : 'Default Camera';
        
        let micLabel = defaultMic ? defaultMic.label : '';
        if (micLabel.startsWith('Default - ')) {
            micLabel = micLabel.substring(10);
        }
        const micDefaultText = micLabel ? `Default Microphone (${micLabel})` : 'Default Microphone';

        // Reset dropdown contents with dynamic default labels. Device labels come
        // from the OS/hardware, so build the option with textContent rather than
        // interpolating them into markup.
        const defaultOption = (label: string): HTMLOptionElement => {
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = label;
            return opt;
        };
        videoSelect.replaceChildren(defaultOption(cameraDefaultText));
        audioSelect.replaceChildren(defaultOption(micDefaultText));

        devices.forEach(device => {
            if (device.kind === 'videoinput' && device.deviceId) {
                const opt = document.createElement('option');
                opt.value = device.deviceId;
                opt.textContent = device.label || `Camera (${device.deviceId.substring(0, 5)}...)`;
                videoSelect.appendChild(opt);
            } else if (device.kind === 'audioinput' && device.deviceId) {
                const opt = document.createElement('option');
                opt.value = device.deviceId;
                opt.textContent = device.label || `Microphone (${device.deviceId.substring(0, 5)}...)`;
                audioSelect.appendChild(opt);
            }
        });

        // Restore selections if still valid
        if (prevVideoId && Array.from(videoSelect.options).some(o => o.value === prevVideoId)) {
            videoSelect.value = prevVideoId;
        } else {
            videoSelect.value = '';
        }

        if (prevAudioId && Array.from(audioSelect.options).some(o => o.value === prevAudioId)) {
            audioSelect.value = prevAudioId;
        } else {
            audioSelect.value = '';
        }

        // Keep state in sync
        state.selectedVideoDeviceId = videoSelect.value || null;
        state.selectedAudioDeviceId = audioSelect.value || null;

    } catch (error) {
        console.error('Error enumerating input devices:', error);
    }
}
