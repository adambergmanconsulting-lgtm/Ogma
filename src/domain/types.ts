export type DeviceKind = 'audioinput' | 'videoinput' | 'audiooutput';

export interface MediaDeviceOption {
  deviceId: string;
  label: string;
  kind: DeviceKind;
}

export interface MediaConstraintsConfig {
  widthMax: number;
  frameRateMax: number;
  videoDeviceId?: string;
  audioDeviceId?: string;
}

export interface ChatMessage {
  id: string;
  peerId: string;
  displayName: string;
  text: string;
  sentAt: number;
}

export type ConnectionState =
  | 'idle'
  | 'joining'
  | 'connected'
  | 'reconnecting'
  | 'left'
  | 'error';

export interface RemotePeer {
  peerId: string;
  displayName: string;
  stream: MediaStream | null;
  connectionState: 'connecting' | 'connected' | 'disconnected';
}

export const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export const MAX_PEERS = 6;

export const DEFAULT_MEDIA_CONSTRAINTS: MediaConstraintsConfig = {
  widthMax: 1280,
  frameRateMax: 30,
};
