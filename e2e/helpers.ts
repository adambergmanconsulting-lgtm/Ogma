import { type Browser, type BrowserContext, type Page, expect } from '@playwright/test';

const fakeMediaArgs = [
  '--use-fake-ui-for-media-stream',
  '--use-fake-device-for-media-stream',
];

export async function newMediaContext(browser: Browser): Promise<BrowserContext> {
  const context = await browser.newContext({
    permissions: ['camera', 'microphone'],
  });
  await context.grantPermissions(['camera', 'microphone']);
  return context;
}

/** Name → Continue → Chats (no vault key). */
export async function ensureVault(page: Page, name: string) {
  await page.goto('/');
  const vaultName = page.getByTestId('vault-name');
  if (await vaultName.isVisible().catch(() => false)) {
    await vaultName.fill(name);
    await page.getByTestId('name-continue').click();
  } else if (await page.getByTestId('vault-unlock-key').isVisible().catch(() => false)) {
    await page.getByTestId('switch-vault').click();
    await expect(page.getByTestId('vault-name')).toBeVisible();
    await page.getByTestId('vault-name').fill(name);
    await page.getByTestId('name-continue').click();
  }
  await expect(page.getByRole('heading', { name: 'Chat' })).toBeVisible({ timeout: 15_000 });
}

/** Open in-call Chat drawer when closed. */
export async function openCallChat(page: Page) {
  if (await page.getByTestId('chat-input').isVisible().catch(() => false)) return;
  await page.getByTestId('toggle-chat').click();
  await expect(page.getByTestId('chat-input')).toBeVisible();
}

/** Create a chat then Call — the only host path into a Thread. */
export async function createRoom(page: Page, name: string) {
  await ensureVault(page, name);
  await page.getByTestId('create-space').click();
  await expect(page.getByTestId('secret-continue')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('secret-continue').click();
  await expect(page.getByTestId('nav-call')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('nav-call').click();
  await expect(page.getByTestId('connection-label')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('share-link')).toBeVisible();
  await openCallChat(page);
}

export async function joinRoom(page: Page, name: string, roomUrl: string) {
  await ensureVault(page, name);
  await page.goto(roomUrl);
  await expect(page.getByTestId('join-room')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('thread-honest-copy')).toContainText(/stay between peers/i);
  await page.getByTestId('join-room').click();
  await expect(page.getByTestId('connection-label')).toBeVisible({ timeout: 30_000 });
  await openCallChat(page);
}

export { fakeMediaArgs };
