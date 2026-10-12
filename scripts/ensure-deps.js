/**
 * Ensure node_modules is present before local tool scripts (dev, etc.).
 * Skips install only when required markers are already on disk.
 * Vite alone is not enough — a pruned tree can still break dynamic imports
 * (e.g. @mediapipe/tasks-vision for background blur).
 */
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Packages that must exist before we skip npm install. */
const REQUIRED_MARKERS = [
  join('vite', 'package.json'),
  join('@mediapipe', 'tasks-vision', 'package.json'),
];

const missing = REQUIRED_MARKERS.some((rel) => !existsSync(join(root, 'node_modules', rel)));

if (!missing) {
  process.exit(0);
}

const result = spawnSync('npm', ['install'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});

process.exit(result.status ?? 1);
