import { type Browser, type BrowserContext, type Page, expect } from '@playwright/test';

const fakeMediaArgs = [
  '--use-fake-ui-for-media-stream',
  '--use-fake-device-for-media-stream',
  '--auto-select-desktop-capture-source=Entire screen',
];

export async function newMediaContext(
  browser: Browser,
  opts?: { viewport?: { width: number; height: number } },
): Promise<BrowserContext> {
  const context = await browser.newContext({
    permissions: ['camera', 'microphone'],
    viewport: opts?.viewport,
  });
  await context.grantPermissions(['camera', 'microphone']);
  return context;
}

/** Dismiss the one-time vault key reveal when it is showing. */
export async function dismissVaultRevealIfShown(page: Page) {
  const cont = page.getByTestId('secret-continue');
  if (await cont.isVisible().catch(() => false)) {
    await cont.click();
  }
}

/**
 * Name → Continue → vault key reveal → home.
 * When already unlocked, lands on home. When locked, creates a new vault.
 * Returns the vault key when a new one was revealed; otherwise null.
 */
export async function ensureVault(page: Page, name: string): Promise<string | null> {
  await page.goto('/');
  let vaultKey: string | null = null;

  if (await page.getByTestId('vault-unlock-key').isVisible().catch(() => false)) {
    await page.getByTestId('switch-vault').click();
    await expect(page.getByTestId('vault-name')).toBeVisible();
  }

  const vaultName = page.getByTestId('vault-name');
  if (await vaultName.isVisible().catch(() => false)) {
    await vaultName.fill(name);
    await page.getByTestId('name-continue').click();
    await expect(page.getByTestId('secret-value')).toBeVisible({ timeout: 15_000 });
    vaultKey = (await page.getByTestId('secret-value').innerText()).trim();
    await page.getByTestId('secret-continue').click();
  } else {
    await dismissVaultRevealIfShown(page);
  }

  await expect(page.getByTestId('app-home')).toBeVisible({ timeout: 15_000 });
  return vaultKey;
}

/** Dismiss the welcome nudge when it covers the work shell. */
export async function dismissInstallIfShown(page: Page) {
  const dismiss = page.getByTestId('home-welcome-dismiss');
  if (await dismiss.isVisible().catch(() => false)) {
    await dismiss.click();
  }
}

/** Compose on the space shell (chat always visible; Call is a band). */
export async function openCallChat(page: Page) {
  if (await page.getByTestId('space-expand-chat').isVisible().catch(() => false)) {
    await page.getByTestId('space-expand-chat').click();
  }
  const spaceCompose = page.getByTestId('space-compose');
  if (await spaceCompose.isVisible().catch(() => false)) return;
  if (await page.getByTestId('chat-input').isVisible().catch(() => false)) return;
  await page.getByTestId('toggle-chat').click();
  await expect(page.getByTestId('chat-input')).toBeVisible();
}

/** New, then video-pane Call — Thread on the same chat shell. */
export async function createRoom(page: Page, name: string) {
  await ensureVault(page, name);
  await page.getByTestId('home-new-chat').click();
  await expect(page.getByTestId('space-call')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('space-call').click();
  await expect(page.getByTestId('connection-label')).toBeVisible({ timeout: 30_000 });
}

export async function joinRoom(page: Page, name: string, roomUrl: string) {
  await ensureVault(page, name);
  await page.goto(roomUrl);
  await dismissVaultRevealIfShown(page);
  // Room+space links may show Join lobby, or open the space with Accept while host is calling.
  const join = page.getByTestId('join-room');
  const accept = page.getByTestId('incoming-call-accept');
  const inCall = page.getByTestId('connection-label');
  await expect(join.or(accept).or(inCall)).toBeVisible({ timeout: 30_000 });
  if (await join.isVisible().catch(() => false)) {
    await expect(page.getByTestId('thread-honest-copy')).toContainText(/stay between peers/i);
    await join.click();
  } else if (await accept.isVisible().catch(() => false)) {
    await accept.click();
  }
  await expect(page.getByTestId('connection-label')).toBeVisible({ timeout: 30_000 });
  await openCallChat(page);
}

export async function createSpace(page: Page, name: string): Promise<string> {
  await ensureVault(page, name);
  await page.getByTestId('home-new-chat').click();
  await expect(page.getByTestId('space-compose')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('share-link')).toBeVisible();
  return page.url();
}

export async function joinSpace(page: Page, name: string, spaceUrl: string) {
  await ensureVault(page, name);
  await page.goto(spaceUrl);
  await dismissVaultRevealIfShown(page);
  await expect(page.getByTestId('space-compose')).toBeVisible({ timeout: 30_000 });
}

export { fakeMediaArgs };
