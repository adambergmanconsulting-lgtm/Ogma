import { expect, test } from '@playwright/test';
import { createRoom, joinRoom, newMediaContext } from './helpers';

test.describe('Thread lobby', () => {
  test('shows create and join controls', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Ogma' })).toBeVisible();
    await expect(page.getByTestId('create-room')).toBeVisible();
    await expect(page.getByTestId('join-room')).toBeVisible();
    await expect(page.getByText(/Anyone with the room link can join/i)).toBeVisible();
  });

  test('create room enters the call shell', async ({ page }) => {
    await createRoom(page, 'Host');
    await expect(page.getByTestId('connection-label')).toContainText(/Waiting for others|Connected/);
    await expect(page).toHaveURL(/#room=/);
    await expect(page.getByTestId('chat-input')).toBeVisible();
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
    expect(roomUrl).toMatch(/#room=/);
    await expect(host.getByTestId('chat-input')).toBeVisible();

    await joinRoom(guest, 'Guest', roomUrl);
    await expect(guest.getByTestId('chat-input')).toBeVisible();

    // Tracker-assisted mesh: allow time for peer discovery on public relays.
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
