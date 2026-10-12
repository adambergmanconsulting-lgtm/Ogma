interface PwaUpdateBannerProps {
  onReload: () => void;
}

/** Quiet chrome: waiting app update — Reload for update. */
export function PwaUpdateBanner(props: PwaUpdateBannerProps) {
  return (
    <div
      role="status"
      data-testid="pwa-update"
      className="space-pane-pad shrink-0 border-b border-[color:var(--color-line)]/50 bg-[color:var(--color-panel)]/80 py-2"
    >
      <button
        type="button"
        data-testid="pwa-update-reload"
        onClick={props.onReload}
        className="btn-quiet"
      >
        Reload for update
      </button>
    </div>
  );
}
