/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

/** ISO-8601 UTC stamp injected in vite.config.ts at build / dev start. */
declare const __BUILD_TIME__: string;

/** Chromium Media Capture Extensions — OS background blur when exposed. */
interface MediaTrackConstraintSet {
  backgroundBlur?: boolean;
}

interface MediaTrackCapabilities {
  backgroundBlur?: boolean[];
}

interface MediaTrackSettings {
  backgroundBlur?: boolean;
}
