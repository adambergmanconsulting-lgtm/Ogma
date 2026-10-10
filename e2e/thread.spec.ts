import { expect, test } from '@playwright/test';
import { createRoom, ensureVault, joinRoom, newMediaContext, openCallChat } from './helpers';

test.describe('Name + home', () => {
  test('name then spaces strip with Start new and idle workspace', async ({ page }) => {
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
    await expect(page.getByTestId('app-work-shell')).toBeVisible();
    await expect(page.getByTestId('app-home')).toBeVisible();
    await expect(page.getByTestId('home-start-new')).toBeVisible();
    await expect(page.getByTestId('home-start-new').getByText('Start new')).toBeVisible();
    await expect(page.getByTestId('home-chat')).toBeVisible();
    await expect(page.getByTestId('home-call')).toBeVisible();
    await expect(page.getByTestId('space-view')).toBeVisible();
    await expect(page.getByTestId('space-presence-idle')).toBeVisible();
    await expect(page.getByTestId('chat-pane-spaces')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('nav-home').getByText('Ogma')).toBeVisible();
    await expect(page.getByTestId('home-join')).toBeVisible();
    await expect(page.getByTestId('nav-home')).toBeVisible();
    await expect(page.getByTestId('nav-call')).toHaveCount(0);
    await expect(page.getByTestId('nav-settings')).toBeVisible();
  });
});

test.describe('Chat and Call entry', () => {
  test('strip Chat lands in space; list Call starts Thread; space Call upgrades', async ({
    page,
  }) => {
    await ensureVault(page, 'Host');
    await page.getByTestId('home-chat').click();
    await expect(page.getByTestId('space-join')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('space-people')).toContainText('Host');
    await expect(page.getByTestId('space-join')).toContainText(/Host joined/i);
    await expect(page.getByTestId('app-work-shell')).toBeVisible();
    await expect(page.getByTestId('app-home')).toBeVisible();
    await expect(page.getByTestId('space-presence')).toBeVisible();
    await expect(page.getByTestId('space-presence-idle')).toBeVisible();
    await expect(page.getByTestId('share-link')).toBeVisible();
    await expect(page.getByTestId('space-call')).toBeVisible();
    await expect(page.getByTestId('nav-call')).toHaveCount(0);
    await page.getByTestId('space-fold-video').click();
    await expect(page.getByTestId('space-presence-collapsed')).toBeVisible();
    await expect(page.getByTestId('space-fold-chat')).toBeDisabled();
    await page.getByTestId('space-expand-video').click();
    await expect(page.getByTestId('space-presence')).toBeVisible();
    await page.getByTestId('nav-home').click();
    await expect(page.getByTestId('app-home')).toBeVisible();
    await expect(page.getByTestId('space-view')).toBeVisible();
    await expect(page.getByTestId('chat-pane-spaces')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('previous-spaces')).toBeVisible();
    await expect(page.getByTestId('previous-spaces').getByText('Host joined')).toBeVisible();
    await expect(page.locator('[data-testid^="space-activity-"]').first()).toBeVisible();
    await page.locator('[data-testid^="space-call-"]').first().click();
    await expect(page.getByTestId('connection-label')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('toggle-screen-share')).toBeVisible();
    await expect(page.getByTestId('video-blur')).toBeVisible();
    await expect(page.getByTestId('toggle-background-blur')).toHaveText(/Blur background/);
    await expect(page.getByTestId('call-controls').getByTestId('toggle-background-blur')).toHaveCount(0);
    await page.getByTestId('call-settings').click();
    await expect(page.getByRole('heading', { name: 'Devices' })).toBeVisible();
    await expect(page.getByTestId('privacy-backdrop')).toHaveCount(0);
    await expect(page.getByTestId('mask-edge-cut')).toHaveCount(0);
    await page.getByTestId('call-settings').click();
    await expect(page.getByRole('heading', { name: 'Devices' })).toHaveCount(0);
    await expect(page.getByTestId('share-link')).toBeVisible();
    await expect(page.getByTestId('connection-label')).toContainText(/Waiting|Connected/);
    await expect(page).toHaveURL(/[?&]room=/);
    await expect(page.getByTestId('mic-level')).toBeVisible();
    await openCallChat(page);
  });

  test('home Call starts Thread immediately', async ({ page }) => {
    await ensureVault(page, 'Host');
    await page.getByTestId('home-call').click();
    await expect(page.getByTestId('connection-label')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('share-link')).toBeVisible();
    await expect(page).toHaveURL(/#space=/);
    await openCallChat(page);
  });

  test('brand soft-nav keeps Call live; Back to call restores', async ({ page }) => {
    await ensureVault(page, 'Host');
    await page.getByTestId('home-call').click();
    await expect(page.getByTestId('connection-label')).toBeVisible({ timeout: 30_000 });
    await expect(page).toHaveURL(/[?&]room=/);
    await page.getByTestId('nav-home').click();
    await expect(page.getByTestId('app-home')).toBeVisible();
    await expect(page.getByTestId('in-call-bar')).toBeVisible();
    await expect(page).toHaveURL(/[?&]room=/);
    await page.getByTestId('in-call-return').click();
    await expect(page.getByTestId('connection-label')).toBeVisible();
    await expect(page.getByTestId('in-call-bar')).toHaveCount(0);
    await expect(page.getByTestId('mic-level')).toBeVisible();
  });
});

test.describe('Home anchor', () => {
  test('install Moment after first chat; brand focuses strip; vault nudge after dismiss', async ({
    page,
  }) => {
    await ensureVault(page, 'Host');
    await expect(page.getByTestId('home-anchor-install')).toHaveCount(0);
    await page.getByTestId('home-chat').click();
    await expect(page.getByTestId('space-join')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('nav-home').click();
    await expect(page.getByTestId('app-home')).toBeVisible();
    await expect(page.getByTestId('home-anchor-install')).toBeVisible();
    await page.getByTestId('home-anchor-install-dismiss').click();
    await expect(page.getByTestId('home-anchor-vault')).toBeVisible();
    await page.getByTestId('nav-settings').click();
    await expect(page.getByTestId('settings-you')).toBeVisible();
    await page.getByTestId('nav-settings').click();
    await expect(page.getByTestId('settings-you')).toHaveCount(0);
    await page.getByTestId('nav-settings').click();
    await expect(page.getByTestId('settings-you')).toBeVisible();
    await expect(page.getByTestId('settings-install')).toBeVisible();
    await page.getByTestId('settings-privacy').locator('summary').click();
    await expect(page.getByTestId('settings-privacy-thread')).toContainText(/stay between peers/i);
    await expect(page.getByTestId('settings-privacy-loom')).toContainText(/no central copy/i);
    await expect(page.getByTestId('settings-turn')).toBeVisible();
    await page.getByTestId('vault-settings-close').click();
    await page.getByTestId('home-anchor-vault-dismiss').click();
    await expect(page.getByTestId('home-anchor-vault')).toHaveCount(0);
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
    await expect(host.getByTestId('space-compose')).toBeVisible();
    await expect(host.getByTestId('space-view')).toBeVisible();

    await joinRoom(guest, 'Guest', roomUrl);
    await expect(guest.getByTestId('space-compose')).toBeVisible();

    await expect
      .poll(async () => host.getByTestId('connection-label').innerText(), { timeout: 60_000 })
      .toMatch(/Connected/);
    await expect
      .poll(async () => guest.getByTestId('connection-label').innerText(), { timeout: 60_000 })
      .toMatch(/Connected/);

    await host.getByTestId('space-compose').fill('golden thread');
    await host.getByTestId('space-send').click();

    await expect(guest.getByText('golden thread')).toBeVisible({ timeout: 30_000 });

    await hostContext.close();
    await guestContext.close();
  });
});
