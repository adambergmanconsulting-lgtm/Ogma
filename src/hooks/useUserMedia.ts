import { useCallback, useEffect, useRef, useState } from 'react';
import { buildUserMediaConstraints } from '../domain/media/constraints';
import {
  devicesByKind,
  listMediaDevices,
  replaceTrackOnStream,
  setAudioOutput,
} from '../domain/media/devices';
import type { MediaDeviceOption, MediaConstraintsConfig } from '../domain/types';
import { DEFAULT_MEDIA_CONSTRAINTS } from '../domain/types';

export interface UseUserMediaOptions {
  peerCount?: number;
  onTrackReplaced?: (track: MediaStreamTrack) => void;
}

export function useUserMedia(options: UseUserMediaOptions = {}) {
  const { peerCount = 1, onTrackReplaced } = options;
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceOption[]>([]);
  const [videoDeviceId, setVideoDeviceId] = useState<string>('');
  const [audioDeviceId, setAudioDeviceId] = useState<string>('');
  const [audioOutputId, setAudioOutputId] = useState<string>('');
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
        const constraints = buildUserMediaConstraints(
          {
            ...DEFAULT_MEDIA_CONSTRAINTS,
            videoDeviceId: config.videoDeviceId || videoDeviceId || undefined,
            audioDeviceId: config.audioDeviceId || audioDeviceId || undefined,
          },
          peerCount,
        );
        const next = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = next;
        setStream(next);
        const list = await refreshDevices();
        const videos = devicesByKind(list, 'videoinput');
        const audios = devicesByKind(list, 'audioinput');
        const outputs = devicesByKind(list, 'audiooutput');
        if (!videoDeviceId && videos[0]) setVideoDeviceId(videos[0].deviceId);
        if (!audioDeviceId && audios[0]) setAudioDeviceId(audios[0].deviceId);
        if (!audioOutputId && outputs[0]) setAudioOutputId(outputs[0].deviceId);
        return next;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not access camera/mic';
        setError(message);
        throw err;
      }
    },
    [audioDeviceId, audioOutputId, peerCount, refreshDevices, videoDeviceId],
  );

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
  }, []);

  const switchVideoDevice = useCallback(
    async (deviceId: string) => {
      setVideoDeviceId(deviceId);
      if (!streamRef.current) return;
      const temp = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: deviceId },
          width: { max: DEFAULT_MEDIA_CONSTRAINTS.widthMax },
          frameRate: { max: DEFAULT_MEDIA_CONSTRAINTS.frameRateMax },
        },
        audio: false,
      });
      const track = temp.getVideoTracks()[0];
      if (!track || !streamRef.current) return;
      replaceTrackOnStream(streamRef.current, track);
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
      const temp = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: deviceId },
          echoCancellation: true,
          noiseSuppression: true,
        },
        video: false,
      });
      const track = temp.getAudioTracks()[0];
      if (!track || !streamRef.current) return;
      track.enabled = micEnabled;
      replaceTrackOnStream(streamRef.current, track);
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
      if (!element || !audioOutputId) return;
      await setAudioOutput(element, audioOutputId);
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
