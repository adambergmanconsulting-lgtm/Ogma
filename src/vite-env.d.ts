/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

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
