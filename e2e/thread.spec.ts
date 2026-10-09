import { expect, test } from '@playwright/test';
import { createRoom, ensureVault, joinRoom, newMediaContext, openCallChat } from './helpers';

test.describe('Name + Chats', () => {
  test('name then chats without vault key', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('name-continue')).toBeVisible();
    await expect(page.getByTestId('vault-splash-open')).toBeVisible();
    await page.getByTestId('vault-splash-open').click();
    await expect(page.getByTestId('vault-splash')).toBeVisible();
    await expect(page.getByTestId('vault-create')).toBeVisible();
    await expect(page.getByTestId('vault-open')).toBeVisible();
    await expect(page.getByTestId('vault-splash-empty')).toBeVisible();
    await expect(page.getByTestId('vault-open')).toBeDisabled();
    await page.getByTestId('vault-splash-name').fill('Ada');
    await expect(page.getByTestId('vault-create')).toBeEnabled();
    await page.getByTestId('vault-splash-close').click();
    await expect(page.getByTestId('vault-name')).toHaveValue('Ada');
    await page.getByTestId('name-continue').click();
    await expect(page.getByTestId('secret-value')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Chat' })).toBeVisible();
    await expect(page.getByText(/Call to start with video/i)).toBeVisible();
    await expect(page.getByTestId('create-space')).toBeVisible();
    await expect(page.getByTestId('app-nav')).toBeVisible();
    await expect(page.getByTestId('app-nav').getByText('Ogma')).toBeVisible();
    await expect(page.getByTestId('nav-chats')).toBeVisible();
    await expect(page.getByTestId('nav-call')).toBeVisible();
    await expect(page.getByTestId('nav-settings')).toBeVisible();
  });
});

test.describe('Call from list', () => {
  test('Call with no open chat creates a space and enters the call shell', async ({ page }) => {
    await ensureVault(page, 'Host');
    await page.getByTestId('nav-call').click();
    await expect(page.getByTestId('connection-label')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('share-link')).toBeVisible();
    await expect(page.getByTestId('connection-label')).toContainText(/Waiting|Connected/);
    await expect(page).toHaveURL(/[?&]room=/);
    await expect(page).toHaveURL(/#space=/);
    await expect(page.getByTestId('mic-level')).toBeVisible();
    await openCallChat(page);
  });
});

test.describe('Call from chat', () => {
  test('Call on a space enters the call shell', async ({ page }) => {
    await ensureVault(page, 'Host');
    await page.getByTestId('create-space').click();
    await expect(page.getByTestId('secret-continue')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('secret-continue').click();
    await expect(page.getByText(/Call when you're ready/)).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('nav-call').click();
    await expect(page.getByTestId('connection-label')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('share-link')).toBeVisible();
    await expect(page.getByTestId('connection-label')).toContainText(/Waiting|Connected/);
    await expect(page).toHaveURL(/[?&]room=/);
    await expect(page.getByTestId('mic-level')).toBeVisible();
    await openCallChat(page);
    const blur = page.getByTestId('toggle-background-blur');
    if (await blur.count()) {
      await expect(blur).toBeVisible();
      await blur.click();
    }
  });
});

test.describe('Thread two-peer', () => {
  test('guest joins host room and exchanges chat', async ({ browser }) => {
    const hostContext = await newMediaContext(browser);
    const guestContext = await newMediaContext(browser);
    const host = await hostContext.newPage();
    const guest = await guestContext.newPage();

    await createRoom(host, 'Host');
    const roomUrl = host.url();
    expect(roomUrl).toMatch(/[?&]room=/);
    await expect(host.getByTestId('chat-input')).toBeVisible();

    await joinRoom(guest, 'Guest', roomUrl);
    await expect(guest.getByTestId('chat-input')).toBeVisible();

    await expect
      .poll(async () => host.getByTestId('connection-label').innerText(), { timeout: 60_000 })
      .toMatch(/Connected/);
    await expect
      .poll(async () => guest.getByTestId('connection-label').innerText(), { timeout: 60_000 })
      .toMatch(/Connected/);

    await host.getByTestId('chat-input').fill('golden thread');
    await host.getByTestId('chat-send').click();

    await expect(guest.getByText('golden thread')).toBeVisible({ timeout: 30_000 });

    await hostContext.close();
    await guestContext.close();
  });
});
