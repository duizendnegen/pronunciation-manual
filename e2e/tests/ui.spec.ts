import { test, expect } from '@playwright/test';

test.describe('Page load', () => {
  test('heading says Pronunciation Manual', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('Pronunciation Manual');
  });

  test('submit button is initially disabled', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#submit-btn')).toBeDisabled();
  });
});

test.describe('Input interaction', () => {
  test('submit button enables when input has text', async ({ page }) => {
    await page.goto('/');
    await page.fill('#word-input', 'hello');
    await expect(page.locator('#submit-btn')).toBeEnabled();
  });

  test('submit button disables when input is cleared', async ({ page }) => {
    await page.goto('/');
    await page.fill('#word-input', 'hello');
    await page.fill('#word-input', '');
    await expect(page.locator('#submit-btn')).toBeDisabled();
  });
});

test.describe('Submit', () => {
  test('submit button re-enables after generation resolves', async ({ page }) => {
    await page.goto('/');
    await page.fill('#word-input', 'hello');
    await page.click('#submit-btn');
    await expect(page.locator('#submit-btn')).toBeEnabled();
  });
});
