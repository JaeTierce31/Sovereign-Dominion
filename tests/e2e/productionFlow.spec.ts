import { test, expect } from '@playwright/test';

test.describe('Sovereign Dominion Production Flow', () => {
  test('loads the app without errors', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Sovereign Dominion/);
  });

  test('shows AR container', async ({ page }) => {
    await page.goto('/');
    const arContainer = page.locator('#ar-container');
    await expect(arContainer).toBeVisible();
  });

  test('branding footer visible', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('text=Sovereign Dominion — Your word, built.');
    await expect(footer).toBeVisible();
  });
});
