import { useCallback, useEffect, useRef, useState } from 'react';
import type { SendQualityTier } from '../domain/media/constraints';
import { devicesByKind, listMediaDevices, setAudioOutput } from '../domain/media/devices';
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
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
        streamRef.current?.getTracks().forEach((t) => t.stop());
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
    if (!streamRef.current) return;
    applyLiveVideoQuality(
      streamRef.current,
      peerCount,
      qualityTier,
      congested,
      videoDeviceId,
      audioDeviceId,
    );
  }, [audioDeviceId, congested, peerCount, qualityTier, videoDeviceId]);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
  }, []);

  const switchVideoDevice = useCallback(
    async (deviceId: string) => {
      setVideoDeviceId(deviceId);
      if (!streamRef.current) return;
      const track = await switchVideoTrack(streamRef.current, deviceId);
      if (!track || !streamRef.current) return;
      setStream(new MediaStream(streamRef.current.getTracks()));
      onTrackReplaced?.(track);
      await refreshDevices();
    },
    [onTrackReplaced, refreshDevices],
  );

  const switchAudioDevice = useCallback(
    async (deviceId: string) => {
      setAudioDeviceId(deviceId);
      if (!streamRef.current) return;
      const track = await switchAudioTrack(streamRef.current, deviceId, micEnabled);
      if (!track || !streamRef.current) return;
      setStream(new MediaStream(streamRef.current.getTracks()));
      onTrackReplaced?.(track);
      await refreshDevices();
    },
    [micEnabled, onTrackReplaced, refreshDevices],
  );

  const toggleMic = useCallback(() => {
    setMicEnabled((prev) => {
      const next = !prev;
      streamRef.current?.getAudioTracks().forEach((t) => {
        t.enabled = next;
      });
      return next;
    });
  }, []);

  const toggleCamera = useCallback(() => {
    setCameraEnabled((prev) => {
      const next = !prev;
      streamRef.current?.getVideoTracks().forEach((t) => {
        t.enabled = next;
      });
      return next;
    });
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
      streamRef.current?.getTracks().forEach((t) => t.stop());
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
    error,
    start,
    stop,
    switchVideoDevice,
    switchAudioDevice,
    setAudioOutputId,
    toggleMic,
    toggleCamera,
    applyAudioOutput,
    videoDevices: devicesByKind(devices, 'videoinput'),
    audioDevices: devicesByKind(devices, 'audioinput'),
    outputDevices: devicesByKind(devices, 'audiooutput'),
  };
}
