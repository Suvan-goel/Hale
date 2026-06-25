import { expect, test } from '@playwright/test';

test('mobile visitor can understand beta and submit signup', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /keep off/i }).click();
  await expect(page.getByRole('heading', { name: /^hale$/i })).toBeVisible();
  await expect(page.getByText(/movement check-up and home plan/i).first()).toBeVisible();
  await expect(page.getByText(/hale is currently in beta/i).first()).toBeVisible();
  await expect(page.getByText(/substantial discount/i).first()).toBeVisible();
  await expect(page.getByText('Chair stands').first()).toBeVisible();
  await expect(page.getByText('Balance holds').first()).toBeVisible();
  await expect(page.getByText('Reach and bend checks').first()).toBeVisible();
  await expect(page.getByText('Example result').first()).toBeVisible();
  await expect(page.getByText(/price before payment is collected/i).first()).toBeVisible();

  await page.getByRole('link', { name: /join the hale beta/i }).first().click();
  await expect(page.locator('#beta-access')).toBeInViewport();
  await page.getByLabel(/email address/i).fill(`beta-${Date.now()}@example.com`);
  await page.getByLabel(/platform/i).selectOption('iphone');
  await page.getByLabel(/email address/i).press('Enter');
  await expect(page.getByText('You are on the Hale beta list.', { exact: true })).toBeVisible();
});

test('page has no horizontal overflow on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
