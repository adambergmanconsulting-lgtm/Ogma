const FIREFLIES = 6;

/** Quiet stand-in for the video pane until a call is up. */
export function VideoIdle() {
  return (
    <div data-testid="space-presence-idle" className="video-idle">
      <div className="video-idle-glow" aria-hidden />
      {Array.from({ length: FIREFLIES }, (_, i) => (
        <span key={i} className={`video-idle-firefly video-idle-firefly--${i}`} aria-hidden />
      ))}
    </div>
  );
}
