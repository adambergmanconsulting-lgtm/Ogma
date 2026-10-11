import { useCallback, useEffect, useRef, useState } from 'react';
import {
  loadPrivacyBackdropId,
  type PrivacyBackdropId,
} from '../domain/media/backgroundBlurBackdrop';
import {
  createBackgroundBlurController,
  type BackgroundBlurMode,
} from '../domain/media/backgroundBlurController';
import { loadMaskEdgeCut } from '../domain/media/backgroundBlurMask';
import { isSoftwareBackgroundBlurSupported } from '../domain/media/backgroundBlurSupport';
import type { SendQualityTier } from '../domain/media/constraints';
import { devicesByKind, listMediaDevices, setAudioOutput } from '../domain/media/devices';
import {
  buildPublishStream,
  setAudioTracksEnabled,
  setVideoTracksEnabled,
} from '../domain/media/publishStream';
import {
  canShareScreen,
  captureScreenTrack,
  screenShareFailure,
} from '../domain/media/screenShare';
import {
  applyLiveVideoQuality,
  pickDefaultDeviceIds,
  startUserMediaCapture,
} from '../domain/media/startUserMedia';
import { switchAudioTrack, switchVideoTrack } from '../domain/media/switchDevices';
import type { MediaDeviceOption, MediaConstraintsConfig } from '../domain/types';

export interface UseUserMediaOptions {
  peerCount?: number;
  qualityTier?: SendQualityTier;
  congested?: boolean;
  onTrackReplaced?: (track: MediaStreamTrack) => void;
  /** Fires when screen share starts or stops (not when the call tears down). */
  onScreenShareChange?: (sharing: boolean) => void;
}

export function useUserMedia(options: UseUserMediaOptions = {}) {
  const {
    peerCount = 1,
    qualityTier = 'high',
    congested = false,
    onTrackReplaced,
    onScreenShareChange,
  } = options;
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceOption[]>([]);
  const [videoDeviceId, setVideoDeviceId] = useState('');
  const [audioDeviceId, setAudioDeviceId] = useState('');
  const [audioOutputId, setAudioOutputId] = useState('');
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [screenShareSupported] = useState(() => canShareScreen());
  const [backgroundBlur, setBackgroundBlur] = useState(false);
  const [backgroundBlurMode, setBackgroundBlurMode] = useState<BackgroundBlurMode>('off');
  const [backgroundBlurSupported] = useState(() => isSoftwareBackgroundBlurSupported());
  const [privacyBackdropId, setPrivacyBackdropId] = useState<PrivacyBackdropId>(() =>
    loadPrivacyBackdropId(),
  );
  const [maskEdgeCut, setMaskEdgeCutState] = useState(() => loadMaskEdgeCut());
  const [error, setError] = useState<string | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const blurBusyRef = useRef(false);
  const screenBusyRef = useRef(false);
  const onTrackReplacedRef = useRef(onTrackReplaced);
  onTrackReplacedRef.current = onTrackReplaced;
  const onScreenShareChangeRef = useRef(onScreenShareChange);
  onScreenShareChangeRef.current = onScreenShareChange;

  const blurRef = useRef(
    createBackgroundBlurController({
      getCameraStream: () => cameraStreamRef.current,
      onPublishStream: (next) => {
        // Screen share owns the published picture — blur must not restore camera.
        if (screenTrackRef.current) return;
        streamRef.current = next;
        setStream(next);
      },
      onTrackReplaced: (track) => {
        if (screenTrackRef.current) return;
        onTrackReplacedRef.current?.(track);
      },
    }),
  );

  const restoreCameraPublish = useCallback(() => {
    const camera = cameraStreamRef.current;
    if (!camera) return;
    streamRef.current = camera;
    setStream(camera);
    const video = camera.getVideoTracks()[0];
    if (video) onTrackReplacedRef.current?.(video);
  }, []);

  const onScreenEndedRef = useRef<() => void>(() => undefined);
  onScreenEndedRef.current = () => {
    screenTrackRef.current = null;
    setScreenSharing(false);
    restoreCameraPublish();
    onScreenShareChangeRef.current?.(false);
  };
  const onScreenEnded = useCallback(() => {
    onScreenEndedRef.current();
  }, []);

  /** @param notify — false when tearing down the whole call (no “stopped sharing” line). */
  const releaseScreenTrack = useCallback(
    (notify = true) => {
      const track = screenTrackRef.current;
      if (!track) return;
      screenTrackRef.current = null;
      track.removeEventListener('ended', onScreenEnded);
      track.stop();
      setScreenSharing(false);
      if (notify) onScreenShareChangeRef.current?.(false);
    },
    [onScreenEnded],
  );

  const refreshDevices = useCallback(async () => {
    const list = await listMediaDevices();
    setDevices(list);
    return list;
  }, []);

  const start = useCallback(
    async (config: Partial<MediaConstraintsConfig> = {}) => {
      setError(null);
      try {
        const next = await startUserMediaCapture({
          peerCount,
          qualityTier,
          congested,
          videoDeviceId,
          audioDeviceId,
          config,
        });
        blurRef.current.stop();
        setBackgroundBlur(false);
        setBackgroundBlurMode('off');
        releaseScreenTrack();
        cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
        cameraStreamRef.current = next;
        streamRef.current = next;
        setStream(next);
        const list = await refreshDevices();
        const picked = pickDefaultDeviceIds(list, {
          video: videoDeviceId,
          audio: audioDeviceId,
          output: audioOutputId,
        });
        if (picked.video) setVideoDeviceId(picked.video);
        if (picked.audio) setAudioDeviceId(picked.audio);
        if (picked.output) setAudioOutputId(picked.output);
        return next;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not access camera/mic';
        setError(message);
        throw err;
      }
    },
    [
      audioDeviceId,
      audioOutputId,
      congested,
      peerCount,
      qualityTier,
      refreshDevices,
      releaseScreenTrack,
      videoDeviceId,
    ],
  );

  useEffect(() => {
    if (!cameraStreamRef.current) return;
    applyLiveVideoQuality(
      cameraStreamRef.current,
      peerCount,
      qualityTier,
      congested,
      videoDeviceId,
      audioDeviceId,
    );
  }, [audioDeviceId, congested, peerCount, qualityTier, videoDeviceId]);

  useEffect(() => {
    void blurRef.current
      .applyPressure({ peerCount, congested, qualityTier })
      .then((yielded) => {
        if (yielded) {
          setBackgroundBlur(false);
          setBackgroundBlurMode('off');
          setError('Background blur paused — call under load');
        }
      });
  }, [congested, peerCount, qualityTier]);

  const stop = useCallback(() => {
    blurRef.current.stop();
    setBackgroundBlur(false);
    setBackgroundBlurMode('off');
    releaseScreenTrack(false);
    cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    cameraStreamRef.current = null;
    streamRef.current = null;
    setStream(null);
  }, [releaseScreenTrack]);

  const switchVideoDevice = useCallback(
    async (deviceId: string) => {
      setVideoDeviceId(deviceId);
      if (!cameraStreamRef.current) return;
      const track = await switchVideoTrack(cameraStreamRef.current, deviceId);
      if (!track || !cameraStreamRef.current) return;
      cameraStreamRef.current = new MediaStream(cameraStreamRef.current.getTracks());
      await blurRef.current.onCameraTrackChanged();
      if (!blurRef.current.enabled && !screenTrackRef.current) {
        streamRef.current = cameraStreamRef.current;
        setStream(cameraStreamRef.current);
        onTrackReplacedRef.current?.(track);
      }
      await refreshDevices();
    },
    [refreshDevices],
  );

  const switchAudioDevice = useCallback(
    async (deviceId: string) => {
      setAudioDeviceId(deviceId);
      if (!cameraStreamRef.current) return;
      const track = await switchAudioTrack(cameraStreamRef.current, deviceId, micEnabled);
      if (!track || !cameraStreamRef.current) return;
      cameraStreamRef.current = new MediaStream(cameraStreamRef.current.getTracks());
      const screen = screenTrackRef.current;
      if (screen) {
        const next = buildPublishStream(cameraStreamRef.current, screen);
        streamRef.current = next;
        setStream(next);
        onTrackReplacedRef.current?.(track);
      } else if (blurRef.current.enabled && blurRef.current.mode === 'software') {
        await blurRef.current.onCameraTrackChanged();
      } else {
        streamRef.current = cameraStreamRef.current;
        setStream(cameraStreamRef.current);
        onTrackReplacedRef.current?.(track);
      }
      await refreshDevices();
    },
    [micEnabled, refreshDevices],
  );

  const toggleMic = useCallback(() => {
    setMicEnabled((prev) => {
      const next = !prev;
      setAudioTracksEnabled(cameraStreamRef.current, next);
      setAudioTracksEnabled(streamRef.current, next);
      return next;
    });
  }, []);

  const toggleCamera = useCallback(() => {
    setCameraEnabled((prev) => {
      const next = !prev;
      const streams = screenTrackRef.current
        ? [cameraStreamRef.current]
        : [cameraStreamRef.current, streamRef.current];
      setVideoTracksEnabled(streams, next);
      return next;
    });
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (screenBusyRef.current) return;
    if (screenTrackRef.current) {
      releaseScreenTrack();
      restoreCameraPublish();
      return;
    }
    if (!cameraStreamRef.current || !canShareScreen()) return;
    screenBusyRef.current = true;
    setError(null);
    let track: MediaStreamTrack;
    try {
      track = await captureScreenTrack();
    } catch (err) {
      const message = screenShareFailure(err);
      if (message) setError(message);
      screenBusyRef.current = false;
      return;
    }
    try {
      if (blurRef.current.enabled) {
        await blurRef.current.disable();
        setBackgroundBlur(false);
        setBackgroundBlurMode('off');
      }
      const camera = cameraStreamRef.current;
      if (track.readyState !== 'live' || !camera) {
        track.stop();
        return;
      }
      screenTrackRef.current = track;
      track.addEventListener('ended', onScreenEnded);
      setScreenSharing(true);
      onScreenShareChangeRef.current?.(true);
      const next = buildPublishStream(camera, track);
      streamRef.current = next;
      setStream(next);
      try {
        onTrackReplacedRef.current?.(track);
      } catch {
        // The local picture is already the screen.
      }
    } finally {
      screenBusyRef.current = false;
    }
  }, [onScreenEnded, releaseScreenTrack, restoreCameraPublish]);

  const toggleBackgroundBlur = useCallback(async () => {
    if (blurBusyRef.current || screenTrackRef.current) return;
    blurBusyRef.current = true;
    setError(null);
    try {
      if (blurRef.current.enabled) {
        await blurRef.current.disable();
        setBackgroundBlur(false);
        setBackgroundBlurMode('off');
        return;
      }
      const result = await blurRef.current.enable();
      setBackgroundBlur(result.ok);
      setBackgroundBlurMode(result.ok ? blurRef.current.mode : 'off');
      if (!result.ok && result.reason) setError(result.reason);
    } finally {
      blurBusyRef.current = false;
    }
  }, []);

  const setPrivacyBackdrop = useCallback((id: PrivacyBackdropId) => {
    blurRef.current.setBackdrop(id);
    setPrivacyBackdropId(blurRef.current.backdropId);
  }, []);

  const setMaskEdgeCut = useCallback((value: number) => {
    blurRef.current.setEdgeCut(value);
    setMaskEdgeCutState(blurRef.current.edgeCut);
  }, []);

  const applyAudioOutput = useCallback(
    async (element: HTMLMediaElement | null) => {
      if (element && audioOutputId) await setAudioOutput(element, audioOutputId);
    },
    [audioOutputId],
  );

  useEffect(() => {
    void refreshDevices();
    const onChange = () => void refreshDevices();
    navigator.mediaDevices?.addEventListener?.('devicechange', onChange);
    return () => {
      navigator.mediaDevices?.removeEventListener?.('devicechange', onChange);
      blurRef.current.stop();
      releaseScreenTrack(false);
      cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [refreshDevices, releaseScreenTrack]);

  return {
    stream,
    devices,
    videoDeviceId,
    audioDeviceId,
    audioOutputId,
    micEnabled,
    cameraEnabled,
    screenSharing,
    screenShareSupported,
    toggleScreenShare,
    backgroundBlur,
    backgroundBlurSupported:
      backgroundBlurSupported || blurRef.current.supported,
    /** Software blur only — native OS blur has no built-in fill chooser. */
    privacyBackdropSelectable: backgroundBlur && backgroundBlurMode === 'software',
    privacyBackdropId,
    setPrivacyBackdrop,
    maskEdgeCut,
    setMaskEdgeCut,
    error,
    start,
    stop,
    switchVideoDevice,
    switchAudioDevice,
    setAudioOutputId,
    toggleMic,
    toggleCamera,
    toggleBackgroundBlur,
    applyAudioOutput,
    videoDevices: devicesByKind(devices, 'videoinput'),
    audioDevices: devicesByKind(devices, 'audioinput'),
    outputDevices: devicesByKind(devices, 'audiooutput'),
  };
}
