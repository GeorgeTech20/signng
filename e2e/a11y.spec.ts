import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('signng Fase 0 — a11y + behavior gate (SSR + hydration + zoneless)', () => {
  test('no WCAG 2.0/2.1/2.2 A+AA axe violations', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-root"]');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    if (results.violations.length) {
      console.log(JSON.stringify(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.length })), null, 2));
    }
    expect(results.violations).toEqual([]);
  });

  test('slider: role=slider, aria wiring, keyboard (non-drag alternative)', async ({ page }) => {
    await page.goto('/');
    const thumb = page.getByRole('slider', { name: 'Volumen' });
    await expect(thumb).toHaveAttribute('aria-valuenow', '40');
    await expect(thumb).toHaveAttribute('aria-valuemin', '0');
    await expect(thumb).toHaveAttribute('aria-valuemax', '100');

    await thumb.focus();
    await page.keyboard.press('ArrowRight');
    await expect(thumb).toHaveAttribute('aria-valuenow', '41');
    await page.keyboard.press('PageUp');
    await expect(thumb).toHaveAttribute('aria-valuenow', '51');
    await page.keyboard.press('Home');
    await expect(thumb).toHaveAttribute('aria-valuenow', '0');
    await page.keyboard.press('End');
    await expect(thumb).toHaveAttribute('aria-valuenow', '100');
  });

  test('tabs: aria roles + selection (inherited from @angular/aria)', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('tablist')).toBeVisible();
    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveCount(2);
    await tabs.nth(1).click();
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'false');
  });
});
