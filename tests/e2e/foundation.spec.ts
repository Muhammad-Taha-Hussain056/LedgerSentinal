import { expect, test } from '@playwright/test';

for (const width of [1280, 390]) {
  test(`foundation is readable at ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    await expect(page).toHaveTitle('LedgerSentinel');
    await expect(page.getByRole('heading', { name: 'LedgerSentinel', level: 1 })).toBeVisible();
    await expect(page.getByText('Workspace in preparation')).toBeVisible();
    await expect(page.getByRole('button')).toHaveCount(0);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(errors).toEqual([]);
    await page.screenshot({ path: `test-results/foundation-${width}.png`, fullPage: true });
  });
}
