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
  setAudioTracksEnabled,
  setVideoTracksEnabled,
} from '../domain/media/publishStream';
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
}

export function useUserMedia(options: UseUserMediaOptions = {}) {
  const {
    peerCount = 1,
    qualityTier = 'high',
    congested = false,
    onTrackReplaced,
  } = options;
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceOption[]>([]);
  const [videoDeviceId, setVideoDeviceId] = useState('');
  const [audioDeviceId, setAudioDeviceId] = useState('');
  const [audioOutputId, setAudioOutputId] = useState('');
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
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
  const blurBusyRef = useRef(false);
  const onTrackReplacedRef = useRef(onTrackReplaced);
  onTrackReplacedRef.current = onTrackReplaced;

  const blurRef = useRef(
    createBackgroundBlurController({
      getCameraStream: () => cameraStreamRef.current,
      onPublishStream: (next) => {
        streamRef.current = next;
        setStream(next);
      },
      onTrackReplaced: (track) => onTrackReplacedRef.current?.(track),
    }),
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
    cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    cameraStreamRef.current = null;
    streamRef.current = null;
    setStream(null);
  }, []);

  const switchVideoDevice = useCallback(
    async (deviceId: string) => {
      setVideoDeviceId(deviceId);
      if (!cameraStreamRef.current) return;
      const track = await switchVideoTrack(cameraStreamRef.current, deviceId);
      if (!track || !cameraStreamRef.current) return;
      cameraStreamRef.current = new MediaStream(cameraStreamRef.current.getTracks());
      await blurRef.current.onCameraTrackChanged();
      if (!blurRef.current.enabled) {
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
      if (blurRef.current.enabled && blurRef.current.mode === 'software') {
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
      setVideoTracksEnabled([cameraStreamRef.current, streamRef.current], next);
      return next;
    });
  }, []);

  const toggleBackgroundBlur = useCallback(async () => {
    if (blurBusyRef.current) return;
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
      cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [refreshDevices]);

  return {
    stream,
    devices,
    videoDeviceId,
    audioDeviceId,
    audioOutputId,
    micEnabled,
    cameraEnabled,
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
