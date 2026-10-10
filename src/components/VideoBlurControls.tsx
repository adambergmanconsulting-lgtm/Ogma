import { useEffect, useState } from 'react';
import { SlidersHorizontal, Sparkles } from 'lucide-react';
import {
  PRIVACY_BACKDROPS,
  type PrivacyBackdropId,
} from '../domain/media/backgroundBlurBackdrop';

interface VideoBlurControlsProps {
  enabled: boolean;
  backdropSelectable?: boolean;
  backdropId?: PrivacyBackdropId;
  edgeCut?: number;
  onToggle: () => void;
  onBackdropChange?: (id: PrivacyBackdropId) => void;
  onEdgeCutChange?: (value: number) => void;
}

/** Blur lives on the local camera tile. It does not apply to a shared screen. */
export function VideoBlurControls(props: VideoBlurControlsProps) {
  const canTune = Boolean(
    props.enabled &&
      props.backdropSelectable &&
      (props.onBackdropChange || props.onEdgeCutChange),
  );
  const [tuneOpen, setTuneOpen] = useState(false);

  useEffect(() => {
    if (!canTune) setTuneOpen(false);
  }, [canTune]);

  return (
    <div
      data-testid="video-blur"
      className={[
        'pointer-events-auto rounded-lg bg-black/55 p-1 text-white backdrop-blur-sm',
        tuneOpen ? 'w-full max-w-[16rem]' : 'w-fit',
      ].join(' ')}
    >
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          data-testid="toggle-background-blur"
          aria-pressed={props.enabled}
          onClick={props.onToggle}
          className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-semibold hover:bg-white/10"
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          {props.enabled ? 'Clear background' : 'Blur background'}
        </button>
        {canTune ? (
          <button
            type="button"
            data-testid="blur-settings"
            aria-label="Blur settings"
            aria-expanded={tuneOpen}
            aria-pressed={tuneOpen}
            title="Blur settings"
            onClick={() => setTuneOpen((open) => !open)}
            className={
              tuneOpen
                ? 'rounded-md bg-white/20 p-1'
                : 'rounded-md p-1 text-white/80 hover:bg-white/10'
            }
          >
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
          </button>
        ) : null}
      </div>
      {canTune && tuneOpen ? (
        <div className="mt-1 space-y-1.5 px-1.5 pb-1">
          {props.onBackdropChange ? (
            <fieldset data-testid="privacy-backdrop">
              <legend className="text-[10px] text-white/70">Backdrop</legend>
              <div className="mt-1 flex gap-1">
                {PRIVACY_BACKDROPS.map((b) => {
                  const active = (props.backdropId ?? 'soft') === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      data-testid={`privacy-backdrop-${b.id}`}
                      aria-pressed={active}
                      onClick={() => props.onBackdropChange?.(b.id)}
                      className={
                        active
                          ? 'rounded-md bg-white/20 px-2 py-0.5 text-[11px] font-semibold'
                          : 'rounded-md px-2 py-0.5 text-[11px] text-white/70 hover:bg-white/10'
                      }
                    >
                      {b.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ) : null}
          {props.onEdgeCutChange ? (
            <label className="block" data-testid="mask-edge-cut">
              <span className="flex items-baseline justify-between text-[10px] text-white/70">
                <span>Edge cut</span>
                <span className="tabular-nums text-white">{props.edgeCut ?? 15}</span>
              </span>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={props.edgeCut ?? 15}
                aria-label="Edge cut"
                onChange={(e) => props.onEdgeCutChange?.(Number(e.target.value))}
                className="w-full accent-[color:var(--color-gold)]"
              />
              <span className="flex justify-between text-[10px] text-white/60">
                <span>Soft</span>
                <span>Firm</span>
              </span>
            </label>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
