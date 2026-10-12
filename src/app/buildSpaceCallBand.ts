import type { SpaceCallBand } from '../components/spaceCallBand';
import type { useCallController } from './useCallController';
import type { useLoomController } from './useLoomController';

type Call = ReturnType<typeof useCallController>;
type Loom = ReturnType<typeof useLoomController>;

/** Props for SpaceView in-call band — kept out of App.tsx for size. */
export function buildSpaceCallBand(
  call: Call,
  loom: Loom,
  onLeave: () => void,
): SpaceCallBand {
  return {
    connectionLabel: call.statusLabel,
    linkHint: call.linkHint,
    error: call.webrtc.error || call.media.error,
    localStream: call.media.stream,
    localMicOff: !call.media.micEnabled,
    remotePeers: call.webrtc.remotePeers,
    displayName: loom.displayName.trim() || 'Guest',
    micEnabled: call.media.micEnabled,
    cameraEnabled: call.media.cameraEnabled,
    screenSharing: call.media.screenSharing,
    screenShareSupported: call.media.screenShareSupported,
    backgroundBlur: call.media.backgroundBlur,
    backgroundBlurSupported: call.media.backgroundBlurSupported,
    privacyBackdropSelectable: call.media.privacyBackdropSelectable,
    privacyBackdropId: call.media.privacyBackdropId,
    maskEdgeCut: call.media.maskEdgeCut,
    pinnedPeerIds: call.webrtc.pins,
    showAllVideos: call.webrtc.showAllVideos,
    capacityWarning: call.webrtc.capacityWarning,
    linkQualityNotice: call.linkQualityNotice,
    devicesOpen: call.drawer === 'settings',
    videoDevices: call.media.videoDevices,
    audioDevices: call.media.audioDevices,
    outputDevices: call.media.outputDevices,
    videoDeviceId: call.media.videoDeviceId,
    audioDeviceId: call.media.audioDeviceId,
    audioOutputId: call.media.audioOutputId,
    onToggleMic: call.media.toggleMic,
    onToggleCamera: call.media.toggleCamera,
    onToggleScreenShare: () => void call.media.toggleScreenShare(),
    onToggleBackgroundBlur: () => void call.media.toggleBackgroundBlur(),
    onPrivacyBackdropChange: call.media.setPrivacyBackdrop,
    onMaskEdgeCutChange: call.media.setMaskEdgeCut,
    onTogglePin: call.webrtc.togglePin,
    onToggleShowAllVideos: () => call.webrtc.setShowAllVideos((v) => !v),
    onOpenDevices: () => call.setDrawer((d) => (d === 'settings' ? 'none' : 'settings')),
    onCloseDevices: () => call.setDrawer('none'),
    onLeave,
    onVideoChange: (id: string) => void call.media.switchVideoDevice(id),
    onAudioChange: (id: string) => void call.media.switchAudioDevice(id),
    onOutputChange: call.media.setAudioOutputId,
    applyAudioOutput: call.media.applyAudioOutput,
  };
}
