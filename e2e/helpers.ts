import { type Browser, type BrowserContext, type Page, expect } from '@playwright/test';

const fakeMediaArgs = [
  '--use-fake-ui-for-media-stream',
  '--use-fake-device-for-media-stream',
];

export async function newMediaContext(browser: Browser): Promise<BrowserContext> {
  const context = await browser.newContext({
    permissions: ['camera', 'microphone'],
  });
  // launchOptions on project already set fake devices for the browser;
  // grantPermissions covers getUserMedia prompts if any remain.
  await context.grantPermissions(['camera', 'microphone']);
  return context;
}

export async function fillLobby(page: Page, name: string) {
  await page.goto('/');
  await expect(page.getByTestId('display-name')).toBeVisible();
  await page.getByTestId('display-name').fill(name);
}

export async function createRoom(page: Page, name: string) {
  await fillLobby(page, name);
  await page.getByTestId('create-room').click();
  await expect(page.getByTestId('connection-label')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('share-link')).toBeVisible();
}

export async function joinRoom(page: Page, name: string, roomUrl: string) {
  await page.goto(roomUrl);
  await expect(page.getByTestId('display-name')).toBeVisible();
  await page.getByTestId('display-name').fill(name);
  await page.getByTestId('join-room').click();
  await expect(page.getByTestId('connection-label')).toBeVisible({ timeout: 30_000 });
}

export { fakeMediaArgs };
