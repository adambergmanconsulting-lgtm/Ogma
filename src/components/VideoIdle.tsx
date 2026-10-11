const FIREFLIES = 6;

/**
 * Quiet wash behind the whole work canvas (video and chat).
 * `resting` pauses it once a call or a message is underway.
 */
export function VideoIdle(props: { resting?: boolean }) {
  return (
    <div
      data-testid="space-presence-idle"
      className={props.resting ? 'video-idle video-idle--rest' : 'video-idle'}
    >
      <div className="video-idle-glow" aria-hidden />
      {Array.from({ length: FIREFLIES }, (_, i) => (
        <span key={i} className={`video-idle-firefly video-idle-firefly--${i}`} aria-hidden />
      ))}
    </div>
  );
}
