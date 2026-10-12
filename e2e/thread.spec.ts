import { expect, test } from '@playwright/test';
import {
  createRoom,
  createSpace,
  dismissInstallIfShown,
  ensureVault,
  joinRoom,
  joinSpace,
  newMediaContext,
  openCallChat,
} from './helpers';

test.describe('Name + home', () => {
  test('name then vault key then spaces strip with Start new and idle workspace', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByTestId('name-continue')).toBeVisible();
    await expect(page.getByTestId('vault-splash-open')).toHaveCount(0);
    await page.getByTestId('vault-name').fill('Ada');
    await page.getByTestId('name-continue').click();
    await expect(page.getByTestId('secret-value')).toBeVisible();
    const vaultKey = (await page.getByTestId('secret-value').innerText()).trim();
    expect(vaultKey.length).toBeGreaterThan(8);
    await page.getByTestId('secret-continue').click();
    await expect(page.getByTestId('app-work-shell')).toBeVisible();
    await expect(page.getByTestId('app-home')).toBeVisible();
    await expect(page.getByTestId('space-chat').getByTestId('home-new-chat')).toBeVisible();
    await expect(page.getByTestId('home-new-chat')).toContainText('New');
    await expect(page.getByTestId('home-new-chat')).toHaveAttribute('aria-label', 'New chat');
    await expect(page.getByTestId('chat-pane-chat')).toHaveText(/This chat/);
    await expect(page.getByTestId('chat-pane-spaces')).toHaveText('All');
    await expect(page.getByTestId('app-nav').getByTestId('home-new-chat')).toHaveCount(0);
    await expect(page.getByTestId('space-view')).toBeVisible();
    // Wash waits 5s after mount before fading in.
    await expect(page.getByTestId('space-presence-idle')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByTestId('chat-pane-spaces')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('nav-home').getByText('Ogma')).toBeVisible();
    await expect(page.getByTestId('home-join')).toBeVisible();
    await expect(page.getByTestId('nav-home')).toBeVisible();
    await expect(page.getByTestId('nav-call')).toHaveCount(0);
    await expect(page.getByTestId('nav-settings')).toBeVisible();
    await expect(page.getByTestId('nav-appear-active')).toBeVisible();
  });
});

test.describe('Chat and Call entry', () => {
  test('strip Chat lands in space; list Call starts Thread; space Call upgrades', async ({
    page,
  }) => {
    await ensureVault(page, 'Host');
    await page.getByTestId('home-new-chat').click();
    await expect(page.getByTestId('space-join')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('space-people')).toHaveCount(0);
    await expect(page.getByTestId('space-join').getByTestId('person-id')).toBeVisible();
    await expect(page.getByTestId('nav-appear-active')).toBeVisible();
    await expect(page.getByTestId('person-invite')).toHaveCount(0);
    await expect(page.getByTestId('chat-invite')).toBeVisible();
    await expect(page.getByTestId('share-link')).toHaveText(/Copy link/);
    await expect(page.getByTestId('chat-invite-person')).toBeVisible();
    await expect(page.getByTestId('chat-invite-person')).toContainText(/0 Active/);
    await expect(page.getByTestId('chat-invite-person')).toBeDisabled();
    await expect(page.getByTestId('space-join')).toContainText(/Host/);
    await expect(page.getByTestId('space-join')).toContainText(/joined/i);
    await expect(page.getByTestId('app-work-shell')).toBeVisible();
    await expect(page.getByTestId('app-home')).toBeVisible();
    await expect(page.getByTestId('space-presence')).toBeVisible();
    // New chat seals a join line — wash re-arms for 5s after that activity.
    await expect(page.getByTestId('space-presence-idle')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByTestId('chat-invite')).toBeVisible();
    await expect(page.getByTestId('space-call')).toBeVisible();
    await expect(page.getByTestId('nav-call')).toHaveCount(0);
    await page.getByTestId('space-fold-video').click();
    await expect(page.getByTestId('space-presence-collapsed')).toBeVisible();
    // Only one pane open — hide the dead fold control instead of showing it disabled.
    await expect(page.getByTestId('space-fold-chat')).toHaveCount(0);
    await page.getByTestId('space-expand-video').click();
    await expect(page.getByTestId('space-presence')).toBeVisible();
    await page.getByTestId('nav-home').click();
    await expect(page.getByTestId('app-home')).toBeVisible();
    await expect(page.getByTestId('space-view')).toBeVisible();
    await expect(page.getByTestId('chat-pane-spaces')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('previous-spaces')).toBeVisible();
    await expect(
      page.getByTestId('previous-spaces').getByRole('button', { name: 'Chat', exact: true }),
    ).toBeVisible();
    await expect(page.getByTestId('chat-pane-chat')).toHaveText('This chat');
    // Join-only spaces have no activity stamp (sort ignores joins).
    await expect(page.locator('[data-testid^="space-activity-"]')).toHaveCount(0);
    await page.locator('[data-testid^="space-call-"]').first().click();
    await expect(page.getByTestId('connection-label')).toBeVisible({ timeout: 30_000 });
    await page.getByTestId('chat-pane-spaces').click();
    await expect(page.locator('[data-testid^="space-activity-"]').first()).toBeVisible();
    await page.getByTestId('chat-pane-chat').click();
    await expect(page.getByTestId('space-people')).toContainText('Host');
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
    await expect(page.getByTestId('chat-invite')).toBeVisible();
    await expect(page.getByTestId('connection-label')).toContainText(/Waiting|Connected/);
    await expect(page).toHaveURL(/[?&]room=/);
    await expect(page.getByTestId('mic-level')).toBeVisible();
    await openCallChat(page);
  });

  test('New then video Call starts Thread', async ({ page }) => {
    await ensureVault(page, 'Host');
    await page.getByTestId('home-new-chat').click();
    await expect(page.getByTestId('space-call')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('space-call').click();
    await expect(page.getByTestId('connection-label')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('chat-invite')).toBeVisible();
    await expect(page).toHaveURL(/#space=/);
    await openCallChat(page);
  });

  test('brand soft-nav keeps Call live; Back to call restores', async ({ page }) => {
    await ensureVault(page, 'Host');
    await page.getByTestId('home-new-chat').click();
    await expect(page.getByTestId('space-call')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('space-call').click();
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

test.describe('Home welcome', () => {
  test('welcome nudge after first chat; Settings opens; dismiss hides', async ({ page }) => {
    await ensureVault(page, 'Host');
    await expect(page.getByTestId('home-welcome')).toHaveCount(0);
    await page.getByTestId('home-new-chat').click();
    await expect(page.getByTestId('space-join')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('nav-home').click();
    await expect(page.getByTestId('app-home')).toBeVisible();
    await expect(page.getByTestId('home-welcome')).toBeVisible();
    await expect(page.getByTestId('home-welcome')).toContainText(/open them again/i);
    await page.getByTestId('home-welcome-settings').click();
    await expect(page.getByTestId('settings-setup')).toBeVisible();
    await expect(page.getByTestId('settings-setup')).toContainText(/Keep your chats handy/i);
    await page.getByTestId('settings-setup').locator('summary').click();
    await expect(page.getByTestId('enable-vault')).toHaveCount(0);
    await expect(page.getByTestId('settings-setup-install-how')).toBeVisible();
    await expect(page.getByTestId('settings-install')).toHaveCount(0);
    await expect(page.getByTestId('settings-you')).toBeVisible();
    await expect(page.getByTestId('person-id')).toBeVisible();
    await page.getByTestId('settings-privacy').locator('summary').click();
    await expect(page.getByTestId('settings-privacy-thread')).toContainText(/stay between peers/i);
    await expect(page.getByTestId('settings-privacy-loom')).toContainText(/no central copy/i);
    await expect(page.getByTestId('settings-turn')).toBeVisible();
    await expect(page.getByTestId('settings-build-stamp')).toContainText(/Last updated ·/);
    await page.getByTestId('vault-settings-close').click();
    await page.getByTestId('home-welcome-dismiss').click();
    await expect(page.getByTestId('home-welcome')).toHaveCount(0);
  });
});

test.describe('Thread two-peer', () => {
  test('guest joins host room: chat name, Loom text, and video', async ({ browser }) => {
    test.setTimeout(120_000);
    const hostContext = await newMediaContext(browser);
    const guestContext = await newMediaContext(browser);
    const host = await hostContext.newPage();
    const guest = await guestContext.newPage();

    await createRoom(host, 'Host');
    await openCallChat(host);
    const roomUrl = host.url();
    expect(roomUrl).toMatch(/[?&]room=/);
    expect(roomUrl).toMatch(/#space=/);
    await expect(host.getByTestId('space-compose')).toBeVisible();
    await expect(host.getByTestId('space-view')).toBeVisible();
    await expect(host.getByTestId('chat-pane-chat')).toHaveText('This chat');

    await joinRoom(guest, 'Guest', roomUrl);
    await openCallChat(guest);
    await expect(guest.getByTestId('space-compose')).toBeVisible({ timeout: 30_000 });
    await expect(guest.getByTestId('space-view')).toBeVisible();

    await expect
      .poll(async () => host.getByTestId('connection-label').innerText(), { timeout: 60_000 })
      .toMatch(/Connected/);
    await expect
      .poll(async () => guest.getByTestId('connection-label').innerText(), { timeout: 60_000 })
      .toMatch(/Connected/);

    await expect
      .poll(async () => host.getByTestId('chat-pane-chat').innerText(), { timeout: 45_000 })
      .toBe('Guest');
    await expect
      .poll(async () => guest.getByTestId('chat-pane-chat').innerText(), { timeout: 45_000 })
      .toBe('Host');
    await host.getByTestId('chat-pane-spaces').click();
    await expect(host.locator('[data-testid^="space-chat-"]').first()).toHaveText('Guest');
    await host.getByTestId('chat-pane-chat').click();
    const guestJoin = (page: typeof guest) =>
      page.getByTestId('space-join').filter({ hasText: /Guest/ }).filter({ hasText: /joined/i });
    await expect(guestJoin(guest)).toBeVisible({ timeout: 30_000 });
    await expect(guestJoin(host)).toBeVisible({ timeout: 30_000 });

    await host.getByTestId('space-compose').fill('golden thread');
    await host.getByTestId('space-send').click();
    await expect(guest.getByText('golden thread')).toBeVisible({ timeout: 30_000 });

    await guest.getByTestId('space-compose').fill('heard you');
    await guest.getByTestId('space-send').click();
    await expect(host.getByText('heard you')).toBeVisible({ timeout: 30_000 });

    await expect(host.getByTestId('space-people')).toContainText('Guest');
    await expect(guest.getByTestId('space-people')).toContainText('Host');
    // Desktop + mobile layouts both mount tiles; at least local + remote exist.
    await expect.poll(async () => host.locator('video').count()).toBeGreaterThanOrEqual(2);
    await expect.poll(async () => guest.locator('video').count()).toBeGreaterThanOrEqual(2);

    await hostContext.close();
    await guestContext.close();
  });
});

test.describe('Person id', () => {
  test('cold vault key adds an id beside Your name', async ({ page }) => {
    const vaultKey = await ensureVault(page, 'Ada');
    expect(vaultKey).toBeTruthy();
    await page.getByTestId('nav-settings').click();
    await expect(page.getByTestId('enable-vault')).toHaveCount(0);
    const mark = page.getByTestId('person-id');
    await expect(mark).toBeVisible();
    const personId = await mark.getAttribute('title');
    expect(personId).toBeTruthy();
    expect(personId).not.toBe(vaultKey);
    await expect(page.getByTestId('vault-rename')).toHaveValue('Ada');
    const appear = page.getByTestId('settings-appear-active');
    await expect(appear).toHaveAttribute('aria-pressed', 'true');
    await appear.click();
    await expect(appear).toHaveAttribute('aria-pressed', 'false');
    await appear.click();
    await expect(appear).toHaveAttribute('aria-pressed', 'true');
    await mark.hover();
    await expect(page.getByRole('tooltip')).toHaveText(personId!);
    await page.getByTestId('nav-settings').click();
    await page.getByTestId('home-new-chat').click();
    await expect(page.getByTestId('space-join')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('space-people')).toHaveCount(0);
    await expect(page.getByTestId('space-join').getByTestId('person-id')).toBeVisible();
    await expect(page.getByTestId('chat-invite')).toBeVisible();
    await expect(page.getByTestId('share-link')).toHaveText(/Copy link/);
    await expect(page.getByTestId('chat-invite-person')).toContainText(/Invite/);
    await expect(page.getByTestId('chat-invite-person')).toContainText(/0 Active/);
    await expect(page.getByTestId('chat-invite-person')).toBeDisabled();
    await expect(page.getByTestId('chat-invite-person')).toHaveAttribute(
      'title',
      'No one is Active',
    );
    await expect(page.getByTestId('chat-invite-panel')).toHaveCount(0);
    await page.getByTestId('chat-pane-spaces').click();
    await expect(page.getByTestId('known-people')).toBeVisible();
    await expect(page.getByTestId('known-people')).toContainText(/Invite starts a new chat/i);
    await expect(page.getByTestId('app-nav').getByTestId('nav-appear-active')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByTestId('space-chat').getByTestId('nav-appear-active')).toHaveCount(0);
    await page.getByTestId('chat-pane-chat').click();
    await expect(page.getByTestId('space-join')).toContainText('joined');
  });
});

test.describe('Loom chat-only two-peer', () => {
  test('guest opens space link: titles and text sync without Call', async ({ browser }) => {
    test.setTimeout(120_000);
    const hostContext = await newMediaContext(browser);
    const guestContext = await newMediaContext(browser);
    const host = await hostContext.newPage();
    const guest = await guestContext.newPage();

    const spaceUrl = await createSpace(host, 'Host');
    expect(spaceUrl).toMatch(/#space=/);
    expect(spaceUrl).not.toMatch(/[?&]room=/);

    await joinSpace(guest, 'Guest', spaceUrl);
    await expect
      .poll(async () => host.getByTestId('chat-pane-chat').innerText(), { timeout: 45_000 })
      .toBe('Guest');
    await expect
      .poll(async () => guest.getByTestId('chat-pane-chat').innerText(), { timeout: 45_000 })
      .toBe('Host');

    await host.getByTestId('space-compose').fill('loom only');
    await host.getByTestId('space-send').click();
    await expect(guest.getByText('loom only')).toBeVisible({ timeout: 30_000 });

    await host.getByTestId('chat-pane-spaces').click();
    await expect(host.locator('[data-testid^="space-activity-"]').first()).toBeVisible();
    await expect(host.locator('[data-testid^="space-chat-"]').first()).toHaveText('Guest');

    await hostContext.close();
    await guestContext.close();
  });

  test('text chat first, then both add video and audio', async ({ browser }) => {
    test.setTimeout(120_000);
    const hostContext = await newMediaContext(browser);
    const guestContext = await newMediaContext(browser);
    const host = await hostContext.newPage();
    const guest = await guestContext.newPage();

    const spaceUrl = await createSpace(host, 'Host');
    expect(spaceUrl).not.toMatch(/[?&]room=/);
    await joinSpace(guest, 'Guest', spaceUrl);

    await host.getByTestId('space-compose').fill('before call');
    await host.getByTestId('space-send').click();
    await expect(guest.getByText('before call')).toBeVisible({ timeout: 30_000 });
    await guest.getByTestId('space-compose').fill('still text');
    await guest.getByTestId('space-send').click();
    await expect(host.getByText('still text')).toBeVisible({ timeout: 30_000 });
    await expect(host.getByTestId('connection-label')).toHaveCount(0);
    await expect(guest.getByTestId('space-call')).toBeVisible();

    await host.getByTestId('space-call').click();
    await expect(host.getByTestId('connection-label')).toBeVisible({ timeout: 30_000 });
    await expect(host).toHaveURL(/[?&]room=/);
    await expect(guest.getByTestId('incoming-call')).toBeVisible({ timeout: 45_000 });
    await guest.getByTestId('incoming-call-accept').click({ force: true, noWaitAfter: true });

    await expect
      .poll(async () => host.getByTestId('connection-label').innerText(), { timeout: 60_000 })
      .toMatch(/Connected/);
    await expect
      .poll(async () => guest.getByTestId('connection-label').innerText(), { timeout: 60_000 })
      .toMatch(/Connected/);
    await expect(host.getByTestId('space-people')).toContainText('Guest');
    await expect(guest.getByTestId('space-people')).toContainText('Host');
    await expect.poll(async () => host.locator('video').count()).toBeGreaterThanOrEqual(2);
    await expect.poll(async () => guest.locator('video').count()).toBeGreaterThanOrEqual(2);

    await openCallChat(host);
    await host.getByTestId('space-compose').fill('during call');
    await host.getByTestId('space-send').click();
    await expect(guest.getByText('during call')).toBeVisible({ timeout: 30_000 });
    await expect(guest.getByText('before call')).toBeVisible();

    await hostContext.close();
    await guestContext.close();
  });
});

test.describe('Accept Call', () => {
  test('warm peer gets Accept; Leave clears the ring', async ({ browser }) => {
    test.setTimeout(120_000);
    const hostContext = await newMediaContext(browser);
    const guestContext = await newMediaContext(browser);
    const host = await hostContext.newPage();
    const guest = await guestContext.newPage();

    const spaceUrl = await createSpace(host, 'Host');
    await joinSpace(guest, 'Guest', spaceUrl);
    await expect
      .poll(async () => host.getByTestId('chat-pane-chat').innerText(), { timeout: 45_000 })
      .toBe('Guest');

    await host.getByTestId('space-call').click();
    await expect(host.getByTestId('connection-label')).toBeVisible({ timeout: 30_000 });
    await expect(guest.getByTestId('incoming-call')).toBeVisible({ timeout: 45_000 });
    await expect(guest.getByTestId('incoming-call')).toContainText(/Host/);
    await expect(guest.getByTestId('incoming-call')).toContainText(/started a call/i);
    await expect(guest.getByTestId('space-call')).toHaveCount(0);
    await expect(host.getByTestId('space-call-start')).toContainText(/Host/);
    await expect(host.getByTestId('space-call-start')).toContainText(/started a call/i);
    await expect
      .poll(async () => guest.getByTestId('space-call-start').count(), { timeout: 45_000 })
      .toBeGreaterThanOrEqual(1);

    await guest.getByTestId('incoming-call-dismiss').click();
    await expect(guest.getByTestId('incoming-call')).toHaveCount(0);
    await expect(guest.getByTestId('space-call')).toBeVisible();

    await host.getByRole('button', { name: 'Leave call' }).click();
    await expect(host.getByTestId('connection-label')).toHaveCount(0);

    await host.getByTestId('space-call').click();
    await expect(guest.getByTestId('incoming-call')).toBeVisible({ timeout: 45_000 });
    await guest.getByTestId('incoming-call-accept').click({ force: true, noWaitAfter: true });
    await expect
      .poll(async () => host.getByTestId('connection-label').innerText(), { timeout: 60_000 })
      .toMatch(/Connected/);
    await expect
      .poll(async () => guest.getByTestId('connection-label').innerText(), { timeout: 60_000 })
      .toMatch(/Connected/);

    await host.getByRole('button', { name: 'Leave call' }).click();
    await expect(guest.getByTestId('incoming-call')).toHaveCount(0);
    await expect(guest.getByTestId('connection-label')).toHaveCount(0);
    await expect(guest.getByTestId('space-call')).toBeVisible({ timeout: 15_000 });
    await expect(host.getByTestId('space-call-end')).toContainText(/Host/);
    await expect(host.getByTestId('space-call-end')).toContainText(/ended the call/i);
    await expect
      .poll(async () => guest.getByTestId('space-call-end').count(), { timeout: 45_000 })
      .toBeGreaterThanOrEqual(1);

    await hostContext.close();
    await guestContext.close();
  });
});

test.describe('Mobile Call layout', () => {
  test('narrow viewport folds chat and shows local PiP when peer joins', async ({ browser }) => {
    test.setTimeout(120_000);
    const hostContext = await newMediaContext(browser, {
      viewport: { width: 390, height: 844 },
    });
    const guestContext = await newMediaContext(browser, {
      viewport: { width: 390, height: 844 },
    });
    const host = await hostContext.newPage();
    const guest = await guestContext.newPage();

    await createRoom(host, 'Host');
    await expect(host.getByTestId('space-chat-collapsed')).toBeVisible();
    await expect(host.getByTestId('space-expand-chat')).toBeVisible();

    await joinRoom(guest, 'Guest', host.url());
    await expect
      .poll(async () => host.getByTestId('connection-label').innerText(), { timeout: 60_000 })
      .toMatch(/Connected/);
    await expect(host.getByTestId('local-pip')).toBeVisible();
    await expect(guest.getByTestId('local-pip')).toBeVisible();

    await hostContext.close();
    await guestContext.close();
  });
});

test.describe('Resume and move', () => {
  test('reload resumes the open space and keeps text', async ({ page }) => {
    await createSpace(page, 'Host');
    await page.getByTestId('space-compose').fill('still here');
    await page.getByTestId('space-send').click();
    await expect(page.getByText('still here')).toBeVisible();
    await page.reload();
    await expect(page.getByTestId('app-home')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('still here')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('space-compose')).toBeVisible();
  });

  test('export then import brings chats into another profile', async ({ browser }) => {
    const srcContext = await newMediaContext(browser);
    const src = await srcContext.newPage();
    await createSpace(src, 'Ada');
    await src.getByTestId('space-compose').fill('packed bags');
    await src.getByTestId('space-send').click();
    await expect(src.getByText('packed bags')).toBeVisible();
    await src.getByTestId('nav-settings').click();
    const [download] = await Promise.all([
      src.waitForEvent('download'),
      src.getByTestId('export-vault').click(),
    ]);
    const filePath = test.info().outputPath(download.suggestedFilename());
    await download.saveAs(filePath);
    await src.getByTestId('vault-settings-close').click();
    await srcContext.close();

    const dstContext = await newMediaContext(browser);
    const dst = await dstContext.newPage();
    await ensureVault(dst, 'Bo');
    await dst.getByTestId('nav-settings').click();
    await dst.getByTestId('import-vault').setInputFiles(filePath);
    await dst.getByTestId('vault-settings-close').click();
    await dst.getByTestId('chat-pane-spaces').click();
    await expect(dst.locator('[data-testid^="space-chat-"]').first()).toBeVisible({
      timeout: 15_000,
    });
    await dst.locator('[data-testid^="space-chat-"]').first().click();
    await expect(dst.getByText('packed bags')).toBeVisible({ timeout: 15_000 });

    await dstContext.close();
  });
});

test.describe('All search and blur', () => {
  test('All Search finds a chat by the other person; blur toggles on Call', async ({
    browser,
  }) => {
    test.setTimeout(120_000);
    const hostContext = await newMediaContext(browser);
    const guestContext = await newMediaContext(browser);
    const host = await hostContext.newPage();
    const guest = await guestContext.newPage();

    const spaceUrl = await createSpace(host, 'Host');
    await joinSpace(guest, 'Guest', spaceUrl);
    await expect
      .poll(async () => host.getByTestId('chat-pane-chat').innerText(), { timeout: 45_000 })
      .toBe('Guest');

    await host.getByTestId('chat-pane-spaces').click();
    await host.getByTestId('spaces-search').fill('Guest');
    await expect(host.locator('[data-testid^="space-chat-"]').first()).toHaveText('Guest');
    await host.locator('[data-testid^="space-chat-"]').first().click();
    await expect(host.getByTestId('chat-pane-chat')).toHaveAttribute('aria-selected', 'true');
    await expect(host.getByTestId('space-compose')).toBeVisible();

    await host.getByTestId('space-call').click();
    await expect(host.getByTestId('connection-label')).toBeVisible({ timeout: 30_000 });
    await expect(host.getByTestId('video-blur').first()).toBeVisible();
    await host.getByTestId('toggle-background-blur').filter({ visible: true }).click();
    await expect(
      host.getByTestId('toggle-background-blur').filter({ visible: true }),
    ).toHaveText(/Clear background/);
    await host.getByTestId('toggle-background-blur').filter({ visible: true }).click();
    await expect(
      host.getByTestId('toggle-background-blur').filter({ visible: true }),
    ).toHaveText(/Blur background/);

    await hostContext.close();
    await guestContext.close();
  });

  test('blur settings open backdrop and edge cut while blur is on', async ({ page }) => {
    await ensureVault(page, 'Host');
    await page.getByTestId('home-new-chat').click();
    await expect(page.getByTestId('space-call')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('space-call').click();
    await expect(page.getByTestId('connection-label')).toBeVisible({ timeout: 30_000 });
    await dismissInstallIfShown(page);

    const blurToggle = page.getByTestId('toggle-background-blur').filter({ visible: true });
    await expect(blurToggle).toBeVisible();
    await blurToggle.click();
    await expect(blurToggle).toHaveText(/Clear background/);

    // Software blur exposes tune controls after the effect is on.
    const blurSettings = page.getByTestId('blur-settings').filter({ visible: true });
    await expect(blurSettings).toBeVisible({ timeout: 30_000 });
    await blurSettings.click();
    await expect(page.getByTestId('privacy-backdrop').filter({ visible: true })).toBeVisible();
    await page.getByTestId('privacy-backdrop-cool').filter({ visible: true }).click();
    await expect(page.getByTestId('privacy-backdrop-cool').filter({ visible: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const edge = page.getByTestId('mask-edge-cut').filter({ visible: true });
    await expect(edge).toBeVisible();
    await edge.locator('input[type="range"]').fill('40');
    await expect(edge).toContainText('40');
  });
});

test.describe('In-call media', () => {
  test('Share screen replaces camera; Stop restores; blur hidden while sharing', async ({
    browser,
  }) => {
    test.setTimeout(120_000);
    const hostContext = await newMediaContext(browser);
    const guestContext = await newMediaContext(browser);
    const host = await hostContext.newPage();
    const guest = await guestContext.newPage();

    await createRoom(host, 'Host');
    await dismissInstallIfShown(host);
    await joinRoom(guest, 'Guest', host.url());
    await dismissInstallIfShown(guest);
    await expect
      .poll(async () => host.getByTestId('connection-label').innerText(), { timeout: 60_000 })
      .toMatch(/Connected/);
    await expect
      .poll(async () => guest.getByTestId('connection-label').innerText(), { timeout: 60_000 })
      .toMatch(/Connected/);

    // Desktop grid + mobile PiP both mount local blur chrome.
    await expect(host.getByTestId('video-blur').first()).toBeVisible();
    await expect(host.getByTestId('toggle-screen-share')).toHaveAttribute(
      'aria-label',
      'Share screen',
    );

    await host.getByTestId('toggle-screen-share').click();
    await expect(host.getByTestId('toggle-screen-share')).toHaveAttribute(
      'aria-label',
      'Stop sharing',
      { timeout: 15_000 },
    );
    await expect(host.getByTestId('video-blur')).toHaveCount(0);
    await expect(host.getByTestId('screen-spotlight')).toBeVisible();
    await expect(host.locator('video[data-fit="contain"]').first()).toBeVisible();
    await expect(host.getByTestId('space-screen-share')).toContainText(/Host/);
    await expect(host.getByTestId('space-screen-share')).toContainText(/shared a screen/i);
    await expect
      .poll(async () => guest.getByTestId('screen-spotlight').count(), { timeout: 30_000 })
      .toBe(1);
    await expect
      .poll(async () => guest.locator('video[data-fit="contain"]').count(), { timeout: 30_000 })
      .toBeGreaterThanOrEqual(1);
    await expect
      .poll(async () => guest.getByTestId('space-screen-share').count(), { timeout: 45_000 })
      .toBeGreaterThanOrEqual(1);

    await host.getByTestId('toggle-screen-share').click();
    await expect(host.getByTestId('toggle-screen-share')).toHaveAttribute(
      'aria-label',
      'Share screen',
      { timeout: 15_000 },
    );
    await expect(host.getByTestId('screen-spotlight')).toHaveCount(0);
    await expect(guest.getByTestId('screen-spotlight')).toHaveCount(0);
    await expect(host.getByTestId('video-blur').first()).toBeVisible();
    await expect(host.getByTestId('space-screen-share-end')).toContainText(/Host/);
    await expect(host.getByTestId('space-screen-share-end')).toContainText(/stopped sharing/i);
    await expect
      .poll(async () => guest.locator('video[data-fit="contain"]').count(), { timeout: 30_000 })
      .toBe(0);

    await hostContext.close();
    await guestContext.close();
  });

  test('mute shows peer mic-off; camera toggles off and on', async ({ browser }) => {
    test.setTimeout(120_000);
    const hostContext = await newMediaContext(browser);
    const guestContext = await newMediaContext(browser);
    const host = await hostContext.newPage();
    const guest = await guestContext.newPage();

    await createRoom(host, 'Host');
    await dismissInstallIfShown(host);
    await joinRoom(guest, 'Guest', host.url());
    await dismissInstallIfShown(guest);
    await expect
      .poll(async () => host.getByTestId('connection-label').innerText(), { timeout: 60_000 })
      .toMatch(/Connected/);
    await expect
      .poll(async () => guest.getByTestId('connection-label').innerText(), { timeout: 60_000 })
      .toMatch(/Connected/);

    await expect(host.getByTestId('toggle-mic')).toHaveAttribute('aria-label', 'Mute microphone');
    await host.getByTestId('toggle-mic').click();
    await expect(host.getByTestId('toggle-mic')).toHaveAttribute('aria-label', 'Unmute microphone');
    // Local tile uses micEnabled; remote tile uses peer meta (desktop + mobile grids both mount).
    await expect(host.getByTestId('mic-off').filter({ visible: true })).toBeVisible({
      timeout: 15_000,
    });
    if (await guest.getByTestId('enable-sound').filter({ visible: true }).isVisible().catch(() => false)) {
      await guest.getByTestId('enable-sound').filter({ visible: true }).click();
    }
    await expect(guest.getByTestId('mic-off').filter({ visible: true })).toBeVisible({
      timeout: 20_000,
    });

    await host.getByTestId('toggle-mic').click();
    await expect(host.getByTestId('toggle-mic')).toHaveAttribute('aria-label', 'Mute microphone');
    await expect(host.getByTestId('mic-off').filter({ visible: true })).toHaveCount(0);
    await expect(guest.getByTestId('mic-off').filter({ visible: true })).toHaveCount(0);

    await expect(host.getByTestId('toggle-camera')).toHaveAttribute(
      'aria-label',
      'Turn camera off',
    );
    await host.getByTestId('toggle-camera').click();
    await expect(host.getByTestId('toggle-camera')).toHaveAttribute(
      'aria-label',
      'Turn camera on',
    );
    await host.getByTestId('toggle-camera').click();
    await expect(host.getByTestId('toggle-camera')).toHaveAttribute(
      'aria-label',
      'Turn camera off',
    );

    await hostContext.close();
    await guestContext.close();
  });
});

test.describe('Vault session', () => {
  test('logout then unlock with key resumes chats', async ({ page }) => {
    const vaultKey = await ensureVault(page, 'Ada');
    expect(vaultKey).toBeTruthy();
    await page.getByTestId('home-new-chat').click();
    await expect(page.getByTestId('space-compose')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('space-compose').fill('vault keeps this');
    await page.getByTestId('space-send').click();
    await expect(page.getByText('vault keeps this')).toBeVisible();

    await page.getByTestId('nav-settings').click();
    await page.getByTestId('vault-logout').click();
    await expect(page.getByTestId('vault-unlock-key')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('switch-vault')).toHaveText(/Create a new vault/);

    await page.getByTestId('vault-unlock-key').fill(vaultKey!);
    await page.getByTestId('vault-unlock').click();
    await expect(page.getByTestId('app-home')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('vault keeps this')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('space-compose')).toBeVisible();
  });

  test('Create a new vault erases chats on this browser', async ({ page }) => {
    await ensureVault(page, 'Ada');
    await page.getByTestId('home-new-chat').click();
    await expect(page.getByTestId('space-compose')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('space-compose').fill('do not keep');
    await page.getByTestId('space-send').click();
    await expect(page.getByText('do not keep')).toBeVisible();

    await page.getByTestId('nav-settings').click();
    await page.getByTestId('vault-logout').click();
    await expect(page.getByTestId('switch-vault')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('switch-vault').click();
    await expect(page.getByTestId('vault-name')).toBeVisible();
    await page.getByTestId('vault-name').fill('Bo');
    await page.getByTestId('name-continue').click();
    await expect(page.getByTestId('secret-value')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('secret-continue').click();
    await expect(page.getByTestId('app-home')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('do not keep')).toHaveCount(0);
    await page.getByTestId('chat-pane-spaces').click();
    await expect(page.locator('[data-testid^="space-chat-"]')).toHaveCount(0);
  });
});

test.describe('Leave call', () => {
  test('one Leave ends the Call on both sides', async ({ browser }) => {
    test.setTimeout(120_000);
    const hostContext = await newMediaContext(browser);
    const guestContext = await newMediaContext(browser);
    const host = await hostContext.newPage();
    const guest = await guestContext.newPage();

    await createRoom(host, 'Host');
    await dismissInstallIfShown(host);
    await joinRoom(guest, 'Guest', host.url());
    await dismissInstallIfShown(guest);
    await expect
      .poll(async () => host.getByTestId('connection-label').innerText(), { timeout: 60_000 })
      .toMatch(/Connected/);
    await expect
      .poll(async () => guest.getByTestId('connection-label').innerText(), { timeout: 60_000 })
      .toMatch(/Connected/);

    await guest.getByRole('button', { name: 'Leave call' }).click();
    await expect(guest.getByTestId('connection-label')).toHaveCount(0);
    await expect(guest.getByTestId('space-call')).toBeVisible();
    await expect(host.getByTestId('connection-label')).toHaveCount(0);
    await expect(host.getByTestId('space-call')).toBeVisible({ timeout: 15_000 });

    await hostContext.close();
    await guestContext.close();
  });
});

test.describe('Settings rename and TURN', () => {
  test('rename save persists; TURN save and clear', async ({ page }) => {
    await ensureVault(page, 'Ada');
    await page.getByTestId('nav-settings').click();
    await page.getByTestId('vault-rename').fill('Ada Renamed');
    // Save name closes Settings (drawer dismisses on rename).
    await page.getByTestId('vault-rename-save').click();
    await expect(page.getByTestId('vault-settings')).toHaveCount(0);
    await page.getByTestId('nav-settings').click();
    await expect(page.getByTestId('vault-rename')).toHaveValue('Ada Renamed');

    await page.getByTestId('settings-turn').locator('summary').click();
    await page.getByTestId('settings-turn-uri').fill('turn:relay.example:3478');
    await page.getByTestId('settings-turn-save').click();
    await expect(page.getByTestId('settings-turn-error')).toHaveCount(0);
    await expect(page.getByTestId('settings-turn-uri')).toHaveValue('turn:relay.example:3478');
    await expect(page.getByTestId('settings-turn-clear')).toBeVisible();

    await page.getByTestId('settings-turn-uri').fill('not-a-turn-uri');
    await page.getByTestId('settings-turn-save').click();
    await expect(page.getByTestId('settings-turn-error')).toBeVisible();

    await page.getByTestId('settings-turn-clear').click();
    await expect(page.getByTestId('settings-turn-uri')).toHaveValue('');
    await expect(page.getByTestId('settings-turn-error')).toHaveCount(0);
  });
});

test.describe('Active invite', () => {
  test('Active peer Invite starts a new chat for both', async ({ browser }) => {
    test.setTimeout(180_000);
    const hostContext = await newMediaContext(browser);
    const guestContext = await newMediaContext(browser);
    const host = await hostContext.newPage();
    const guest = await guestContext.newPage();

    await ensureVault(host, 'Host');
    await ensureVault(guest, 'Guest');

    const spaceUrl = await createSpace(host, 'Host');
    await joinSpace(guest, 'Guest', spaceUrl);
    await dismissInstallIfShown(host);
    await dismissInstallIfShown(guest);

    // Loom card exchange while both stay on the space.
    await expect
      .poll(async () => host.getByTestId('chat-pane-chat').innerText(), { timeout: 60_000 })
      .toBe('Guest');

    await host.getByTestId('chat-pane-spaces').click();
    await expect
      .poll(async () => host.getByTestId('known-people').innerText(), { timeout: 90_000 })
      .toMatch(/Guest/);
    await expect
      .poll(
        async () =>
          host
            .getByTestId('known-people')
            .locator('li')
            .filter({ hasText: 'Guest' })
            .getByTestId('person-invite')
            .isVisible()
            .catch(() => false),
        { timeout: 90_000 },
      )
      .toBe(true);

    const guestRow = host
      .getByTestId('known-people')
      .locator('li')
      .filter({ hasText: 'Guest' });
    await expect(guestRow).toContainText(/Active/);
    await guestRow.getByTestId('person-invite').click();

    await expect(host.getByTestId('space-compose')).toBeVisible({ timeout: 30_000 });
    await expect(host).toHaveURL(/#space=/);
    // Invite opens a new space (not the meet-cute one).
    expect(host.url()).not.toBe(spaceUrl);

    await expect(guest.getByTestId('space-compose')).toBeVisible({ timeout: 60_000 });
    await expect
      .poll(async () => guest.getByTestId('chat-pane-chat').innerText(), { timeout: 60_000 })
      .toBe('Host');
    await expect
      .poll(async () => host.getByTestId('chat-pane-chat').innerText(), { timeout: 60_000 })
      .toBe('Guest');

    await host.getByTestId('space-compose').fill('invited you here');
    await host.getByTestId('space-send').click();
    await expect(guest.getByText('invited you here')).toBeVisible({ timeout: 30_000 });

    await hostContext.close();
    await guestContext.close();
  });
});

test.describe('Home Join paste', () => {
  test('guest pastes space invite into All Join', async ({ browser }) => {
    test.setTimeout(120_000);
    const hostContext = await newMediaContext(browser);
    const guestContext = await newMediaContext(browser);
    const host = await hostContext.newPage();
    const guest = await guestContext.newPage();

    const spaceUrl = await createSpace(host, 'Host');
    expect(spaceUrl).toMatch(/#space=/);
    const hash = new URL(spaceUrl).hash;
    expect(hash).toMatch(/^#space=/);

    await ensureVault(guest, 'Guest');
    await guest.getByTestId('chat-pane-spaces').click();
    await expect(guest.getByTestId('home-join')).toBeVisible();
    await guest.getByTestId('home-join').locator('summary').click();
    await expect(guest.getByTestId('space-input')).toBeVisible();
    // Paste the invite fragment (same as a copied link's #space= part).
    await guest.getByTestId('space-input').fill(spaceUrl);
    await expect(guest.getByTestId('join-space')).toBeEnabled();
    await guest.getByTestId('join-space').click();
    await dismissInstallIfShown(guest);
    if (await guest.getByTestId('chat-pane-chat').isVisible().catch(() => false)) {
      await guest.getByTestId('chat-pane-chat').click();
    }
    await expect(guest.getByTestId('space-compose')).toBeVisible({ timeout: 30_000 });
    await expect(guest.getByTestId('space-join').first()).toBeVisible({ timeout: 20_000 });
    await expect(guest).toHaveURL(/#space=/);

    await expect
      .poll(async () => host.getByTestId('chat-pane-chat').innerText(), { timeout: 45_000 })
      .toBe('Guest');
    await expect
      .poll(async () => guest.getByTestId('chat-pane-chat').innerText(), { timeout: 45_000 })
      .toBe('Host');

    await host.getByTestId('space-compose').fill('joined by paste');
    await host.getByTestId('space-send').click();
    await expect(guest.getByText('joined by paste')).toBeVisible({ timeout: 30_000 });

    await hostContext.close();
    await guestContext.close();
  });

  test('guest pastes Call invite into All Join', async ({ browser }) => {
    test.setTimeout(120_000);
    const hostContext = await newMediaContext(browser);
    const guestContext = await newMediaContext(browser);
    const host = await hostContext.newPage();
    const guest = await guestContext.newPage();

    await createRoom(host, 'Host');
    const roomUrl = host.url();
    expect(roomUrl).toMatch(/[?&]room=/);

    await ensureVault(guest, 'Guest');
    await guest.getByTestId('chat-pane-spaces').click();
    await expect(guest.getByTestId('home-join')).toBeVisible();
    await guest.getByTestId('home-join').locator('summary').click();
    await guest.getByTestId('space-input').fill(roomUrl);
    await expect(guest.getByTestId('join-space')).toBeEnabled();
    await guest.getByTestId('join-space').click();

    await expect(guest.getByTestId('join-room')).toBeVisible({ timeout: 15_000 });
    await guest.getByTestId('join-room').click();
    await expect(guest.getByTestId('connection-label')).toBeVisible({ timeout: 30_000 });

    await hostContext.close();
    await guestContext.close();
  });
});
