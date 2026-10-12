import { useState } from 'react';
import { Volume2, X } from 'lucide-react';
import { playTestTone } from '../domain/media/testTone';
import type { MediaDeviceOption } from '../domain/types';

interface SettingsDrawerProps {
  open: boolean;
  videoDevices: MediaDeviceOption[];
  audioDevices: MediaDeviceOption[];
  outputDevices: MediaDeviceOption[];
  videoDeviceId: string;
  audioDeviceId: string;
  audioOutputId: string;
  onClose: () => void;
  onVideoChange: (id: string) => void;
  onAudioChange: (id: string) => void;
  onOutputChange: (id: string) => void;
}

function DeviceSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: MediaDeviceOption[];
  onChange: (id: string) => void;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="field-label">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="field field--inset text-sm"
      >
        {options.length === 0 ? <option value="">No devices found</option> : null}
        {options.map((d) => (
          <option key={d.deviceId} value={d.deviceId}>
            {d.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SettingsDrawer(props: SettingsDrawerProps) {
  const [toneBusy, setToneBusy] = useState(false);
  const [toneHint, setToneHint] = useState<string | null>(null);

  if (!props.open) return null;

  const onTestSound = () => {
    setToneBusy(true);
    setToneHint(null);
    void playTestTone(props.audioOutputId || undefined)
      .then(() => {
        setToneHint('Playing');
      })
      .catch(() => {
        setToneHint('Could not play');
      })
      .finally(() => setToneBusy(false));
  };

  return (
    <aside className="drawer-sheet h-full min-h-0 overflow-y-auto overscroll-contain">
      <div className="flex shrink-0 items-center justify-between px-3 py-2">
        <h2 className="text-sm font-semibold">Devices</h2>
        <button
          type="button"
          aria-label="Close settings"
          onClick={props.onClose}
          className="rounded-lg p-2 text-[color:var(--color-muted)] hover:bg-[color:var(--color-panel-2)]"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-4 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
        <DeviceSelect
          label="Camera"
          value={props.videoDeviceId}
          options={props.videoDevices}
          onChange={props.onVideoChange}
        />
        <DeviceSelect
          label="Microphone"
          value={props.audioDeviceId}
          options={props.audioDevices}
          onChange={props.onAudioChange}
        />
        <DeviceSelect
          label="Speaker"
          value={props.audioOutputId}
          options={props.outputDevices}
          onChange={props.onOutputChange}
        />
        <div className="space-y-2">
          <button
            type="button"
            data-testid="test-sound"
            disabled={toneBusy}
            onClick={onTestSound}
            className="btn-secondary btn-secondary--sm inline-flex w-full items-center justify-center gap-2 bg-[color:var(--color-panel-2)]"
          >
            <Volume2 className="h-4 w-4" aria-hidden />
            {toneBusy ? 'Playing…' : 'Test sound'}
          </button>
          {toneHint ? (
            <p role="status" className="text-xs text-[color:var(--color-muted)]">
              {toneHint}
            </p>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
