/**
 * Ensure node_modules is present before local tool scripts (dev, etc.).
 * Skips install when vite is already on disk.
 */
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const marker = join(root, 'node_modules', 'vite', 'package.json');

if (existsSync(marker)) {
  process.exit(0);
}

const result = spawnSync('npm', ['install'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});

process.exit(result.status ?? 1);
