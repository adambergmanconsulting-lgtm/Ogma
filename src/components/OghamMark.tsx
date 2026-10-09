interface OghamMarkProps {
  className?: string;
  title?: string;
}

/** Secondary brand mark: Ogham stave geometry. Threads remain the primary myth signal. */
export function OghamMark({ className, title }: OghamMarkProps) {
  return (
    <svg
      viewBox="0 0 20 36"
      className={className}
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path
        d="M10 2v32"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
      />
      <path
        d="M10 6h8M10 10h8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10 15h6M10 19h6M10 23h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M4 28h12M4 32h12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  );
}
