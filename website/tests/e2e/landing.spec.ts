import { expect, test } from '@playwright/test';

test('mobile visitor can understand beta and submit signup', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /stay stronger, steadier and more mobile/i })).toBeVisible();
  await expect(page.getByText(/currently in beta/i).first()).toBeVisible();
  await expect(page.getByText(/substantial discount/i).first()).toBeVisible();

  await page.getByRole('link', { name: /get beta access/i }).first().click();
  await expect(page.locator('#beta-access')).toBeInViewport();
  await page.getByLabel(/email address/i).fill(`beta-${Date.now()}@example.com`);
  await page.getByLabel(/platform/i).selectOption('iphone');
  await page.getByRole('button', { name: /get beta access/i }).click();
  await expect(page.getByText('You are on the Hale beta list.', { exact: true })).toBeVisible();
});

test('page has no horizontal overflow on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
