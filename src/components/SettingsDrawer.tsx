import { useState } from 'react';
import { Volume2, X } from 'lucide-react';
import {
  PRIVACY_BACKDROPS,
  type PrivacyBackdropId,
} from '../domain/media/backgroundBlurBackdrop';
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
  /** Soft fill chooser when software blur is active. */
  privacyBackdropSelectable?: boolean;
  privacyBackdropId?: PrivacyBackdropId;
  onPrivacyBackdropChange?: (id: PrivacyBackdropId) => void;
  /** Edge cut 0–100 — real-time matte firmness while software blur is on. */
  maskEdgeCut?: number;
  onMaskEdgeCutChange?: (value: number) => void;
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
    <aside className="drawer-sheet">
      <div className="flex items-center justify-between px-3 py-2">
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

      <div className="space-y-4 px-3 py-3">
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
        {props.privacyBackdropSelectable && props.onPrivacyBackdropChange ? (
          <fieldset className="space-y-1.5" data-testid="privacy-backdrop">
            <legend className="text-sm text-[color:var(--color-muted)]">Backdrop</legend>
            <div className="flex flex-wrap gap-2">
              {PRIVACY_BACKDROPS.map((b) => {
                const active = (props.privacyBackdropId ?? 'soft') === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    data-testid={`privacy-backdrop-${b.id}`}
                    aria-pressed={active}
                    onClick={() => props.onPrivacyBackdropChange?.(b.id)}
                    className={
                      active
                        ? 'rounded-xl border border-[color:var(--color-gold)] bg-[color:var(--color-panel-2)] px-3 py-1.5 text-sm font-semibold text-[color:var(--color-ink)]'
                        : 'rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-bg)] px-3 py-1.5 text-sm text-[color:var(--color-muted)] hover:border-[color:var(--color-gold)]/60'
                    }
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ) : null}
        {props.privacyBackdropSelectable && props.onMaskEdgeCutChange ? (
          <label className="block space-y-1.5" data-testid="mask-edge-cut">
            <span className="flex items-baseline justify-between gap-2 text-sm text-[color:var(--color-muted)]">
              <span>Edge cut</span>
              <span className="tabular-nums text-[color:var(--color-ink)]">
                {props.maskEdgeCut ?? 15}
              </span>
            </span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={props.maskEdgeCut ?? 15}
              onChange={(e) => props.onMaskEdgeCutChange?.(Number(e.target.value))}
              className="w-full accent-[color:var(--color-gold)]"
            />
            <span className="flex justify-between text-[11px] text-[color:var(--color-muted)]">
              <span>Soft (original)</span>
              <span>Firm</span>
            </span>
          </label>
        ) : null}
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
