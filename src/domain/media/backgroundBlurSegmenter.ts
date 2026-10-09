import type { ImageSegmenter } from '@mediapipe/tasks-vision';

const WASM_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.0/wasm';
const SELFIE_MODEL =
  'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite';

let segmenterPromise: Promise<ImageSegmenter> | null = null;

/** Lazy singleton — model/WASM load only when blur is first turned on. */
export function loadSelfieSegmenter(): Promise<ImageSegmenter> {
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      const { FilesetResolver, ImageSegmenter } = await import('@mediapipe/tasks-vision');
      const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
      const options = {
        runningMode: 'VIDEO' as const,
        outputCategoryMask: false,
        outputConfidenceMasks: true,
      };
      try {
        return await ImageSegmenter.createFromOptions(vision, {
          ...options,
          baseOptions: { modelAssetPath: SELFIE_MODEL, delegate: 'GPU' },
        });
      } catch {
        return ImageSegmenter.createFromOptions(vision, {
          ...options,
          baseOptions: { modelAssetPath: SELFIE_MODEL, delegate: 'CPU' },
        });
      }
    })().catch((err) => {
      segmenterPromise = null;
      throw err;
    });
  }
  return segmenterPromise;
}

/** Test seam — reset cached loader between tests. */
export function resetSelfieSegmenterForTests(): void {
  segmenterPromise = null;
}
