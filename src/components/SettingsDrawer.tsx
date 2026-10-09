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
      <span className="text-sm text-[color:var(--color-muted)]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[color:var(--color-gold)]"
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
        setToneHint('Heard the chime? Call audio is unlocked on this tab.');
      })
      .catch(() => {
        setToneHint('Could not play test sound — check speaker permissions.');
      })
      .finally(() => setToneBusy(false));
  };

  return (
    <aside className="flex w-full max-w-md flex-col border-l border-[color:var(--color-line)] bg-[color:var(--color-panel)]/95 backdrop-blur md:w-96">
      <div className="flex items-center justify-between border-b border-[color:var(--color-line)] px-4 py-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg">Hardware</h2>
          <p className="text-xs text-[color:var(--color-muted)]">
            Hot-swap devices without leaving the call
          </p>
        </div>
        <button
          type="button"
          aria-label="Close settings"
          onClick={props.onClose}
          className="rounded-lg p-2 text-[color:var(--color-muted)] hover:bg-[color:var(--color-panel-2)]"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-4 px-4 py-4">
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
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[color:var(--color-gold)]/60 bg-[color:var(--color-panel-2)] px-3 py-2.5 text-sm font-semibold text-[color:var(--color-ink)] transition hover:bg-[color:var(--color-gold)] hover:text-[color:var(--color-on-gold)] disabled:opacity-60"
          >
            <Volume2 className="h-4 w-4" aria-hidden />
            {toneBusy ? 'Playing…' : 'Test sound'}
          </button>
          <p className="text-xs text-[color:var(--color-muted)]">
            Plays a short chime on the selected speaker and enables call audio in this tab.
          </p>
          {toneHint ? (
            <p role="status" className="text-xs text-[color:var(--color-ok)]">
              {toneHint}
            </p>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
