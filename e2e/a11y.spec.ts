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

  test('switch: role=switch, aria-checked, Space/Enter toggle', async ({ page }) => {
    await page.goto('/');
    const sw = page.getByRole('switch');
    await expect(sw).toHaveAttribute('aria-checked', 'true');
    await sw.focus();
    await page.keyboard.press('Space');
    await expect(sw).toHaveAttribute('aria-checked', 'false');
    await page.keyboard.press('Enter');
    await expect(sw).toHaveAttribute('aria-checked', 'true');
  });

  test('checkbox: role=checkbox, aria-checked, Space toggle', async ({ page }) => {
    await page.goto('/');
    const cb = page.getByRole('checkbox');
    await expect(cb).toHaveAttribute('aria-checked', 'false');
    await cb.focus();
    await page.keyboard.press('Space');
    await expect(cb).toHaveAttribute('aria-checked', 'true');
  });

  test('dialog: modal opens, focus trapped, Esc closes + restores focus, axe clean when open', async ({
    page,
  }) => {
    await page.goto('/');
    const trigger = page.getByRole('button', { name: 'Abrir dialog' });
    await trigger.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog).toContainText('Tab queda atrapado');

    // axe over the OPEN modal state
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(trigger).toBeFocused(); // focus restored to trigger
  });

  test('tooltip: role=tooltip on focus, aria-describedby association, Esc dismisses', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Hover / focus me' }).focus();
    const tip = page.getByRole('tooltip');
    await expect(tip).toBeVisible();
    await expect(tip).toContainText('Soy un tooltip');

    // H2: trigger references the tooltip via aria-describedby
    const tipId = await tip.getAttribute('id');
    expect(tipId).toBeTruthy();
    await expect(page.locator(`[aria-describedby="${tipId}"]`)).toBeVisible();

    // H3: Escape dismisses regardless of focus path
    await page.keyboard.press('Escape');
    await expect(page.getByRole('tooltip')).toHaveCount(0);

    // WCAG 1.4.13: tooltip is hoverable — stays open when the pointer moves onto the bubble
    await page.getByRole('button', { name: 'Hover / focus me' }).hover();
    await expect(page.getByRole('tooltip')).toBeVisible();
    await page.getByRole('tooltip').hover();
    await expect(page.getByRole('tooltip')).toBeVisible();
  });

  test('radiogroup: roving tabindex + arrow selection follows focus', async ({ page }) => {
    await page.goto('/');
    const radios = page.getByRole('radio');
    await expect(radios).toHaveCount(3);
    await expect(radios.nth(0)).toHaveAttribute('aria-checked', 'true'); // 'free' initial
    await expect(radios.nth(0)).toHaveAttribute('tabindex', '0');
    await expect(radios.nth(1)).toHaveAttribute('tabindex', '-1');

    await radios.nth(0).focus();
    await page.keyboard.press('ArrowDown');
    await expect(radios.nth(1)).toHaveAttribute('aria-checked', 'true');
    await expect(radios.nth(0)).toHaveAttribute('aria-checked', 'false');
    await page.keyboard.press('End');
    await expect(radios.nth(2)).toHaveAttribute('aria-checked', 'true');
  });

  test('dropdown-menu: role=menu/menuitem, select emits value + closes', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Acciones' }).click();
    await expect(page.getByRole('menu')).toBeVisible();
    await page.getByRole('menuitem', { name: 'Compartir' }).click();
    await expect(page.getByTestId('last-action')).toContainText('share');
    await expect(page.getByRole('menu')).toHaveCount(0);
  });

  test('toast: appears in a persistent polite live region, close removes it', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Mostrar toast' }).click();
    const polite = page.locator('[aria-live="polite"]');
    await expect(polite.getByText('Guardado', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Cerrar' }).click();
    await expect(page.getByText('Cambios guardados correctamente.')).toHaveCount(0);
  });

  test('dropdown-menu: keyboard (arrow + Enter) activates an item (B1 regression)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Acciones' }).click();
    await expect(page.getByRole('menu')).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('last-action')).toBeVisible(); // keyboard selection fired
    await expect(page.getByRole('menu')).toHaveCount(0);
  });

  test('alert-dialog: role=alertdialog modal, confirm emits + closes', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Eliminar' }).click();
    const dlg = page.getByRole('alertdialog');
    await expect(dlg).toBeVisible();
    await expect(dlg).toHaveAttribute('aria-modal', 'true');
    await page.getByRole('button', { name: 'Confirmar' }).click();
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
    await expect(page.getByTestId('last-action')).toContainText('deleted');
  });

  test('combobox: type filters, keyboard activedescendant, Enter selects', async ({ page }) => {
    await page.goto('/');
    const input = page.getByRole('combobox', { name: 'Framework' });
    await input.click();
    await expect(page.getByRole('listbox')).toBeVisible();
    await input.pressSequentially('vu');
    await expect(page.getByRole('option', { name: 'Vue' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Angular' })).toHaveCount(0);
    // keyboard: ArrowDown sets aria-activedescendant, Enter selects
    await page.keyboard.press('ArrowDown');
    await expect(input).toHaveAttribute('aria-activedescendant', /signng-combobox-/);
    await page.keyboard.press('Enter');
    await expect(input).toHaveValue('Vue');
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByText('Framework (vue)')).toBeVisible();

    // H1: Tab/blur while open closes the popup (no dead-first-click)
    await input.click();
    await expect(page.getByRole('listbox')).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('listbox')).toHaveCount(0);
  });

  test('calendar: grid keyboard (activedescendant) + Enter/click select', async ({ page }) => {
    await page.goto('/');
    const grid = page.getByRole('grid', { name: /Fecha/ });
    await expect(grid).toBeVisible();
    await expect(grid.getByRole('columnheader').first()).toHaveAttribute('aria-label', 'lunes'); // Monday-first
    await expect(page.getByRole('gridcell', { name: /15 de junio/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await grid.focus();
    await expect(grid).toHaveAttribute('aria-activedescendant', /2026-06-15$/);
    await page.keyboard.press('ArrowRight');
    await expect(grid).toHaveAttribute('aria-activedescendant', /2026-06-16$/);
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('cal-value')).toContainText('2026-06-16');
    await page.getByRole('gridcell', { name: /20 de junio/ }).click();
    await expect(page.getByTestId('cal-value')).toContainText('2026-06-20');
    // B1: nav hard-stops at max (27 > 2026-06-25) — activedescendant stays on 20
    await page.keyboard.press('ArrowDown');
    await expect(grid).toHaveAttribute('aria-activedescendant', /2026-06-20$/);
  });

  test('input-otp: sequential entry advances focus + builds value', async ({ page }) => {
    await page.goto('/');
    const boxes = page.getByRole('group', { name: 'Código 2FA' }).getByRole('textbox');
    await expect(boxes).toHaveCount(6);
    await boxes.nth(0).click();
    await page.keyboard.type('12');
    await expect(page.getByTestId('otp-value')).toContainText('12');
    await expect(boxes.nth(2)).toBeFocused();
  });

  test('carousel: region roledescription, next advances slide', async ({ page }) => {
    await page.goto('/');
    const carousel = page.getByRole('region', { name: 'Galería' });
    await expect(carousel).toHaveAttribute('aria-roledescription', 'carrusel');
    const prev = carousel.getByRole('button', { name: 'Diapositiva anterior' });
    await expect(prev).toBeDisabled();
    await carousel.getByRole('button', { name: 'Diapositiva siguiente' }).click();
    await expect(prev).toBeEnabled();
  });

  test('resizable: separator aria-valuenow changes with arrow key', async ({ page }) => {
    await page.goto('/');
    const sep = page.getByRole('separator', { name: 'Editor y vista previa' });
    await expect(sep).toHaveAttribute('aria-valuenow', '40');
    await sep.focus();
    await page.keyboard.press('ArrowRight');
    await expect(sep).toHaveAttribute('aria-valuenow', '45');
  });

  test('toggle-group: single-select roving — selecting one clears the other', async ({ page }) => {
    await page.goto('/');
    const group = page.getByRole('group', { name: 'Alineación de texto' });
    const left = group.getByRole('button', { name: 'Izq' });
    const center = group.getByRole('button', { name: 'Centro' });
    await expect(left).toHaveAttribute('aria-pressed', 'true'); // initial ['left']
    await center.click();
    await expect(center).toHaveAttribute('aria-pressed', 'true');
    await expect(left).toHaveAttribute('aria-pressed', 'false');
  });

  test('context-menu: right-click opens menu at pointer, select emits', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Click derecho aquí').click({ button: 'right' });
    await expect(page.getByRole('menu')).toBeVisible();
    await page.getByRole('menuitem', { name: 'Copiar' }).click();
    await expect(page.getByTestId('ctx-value')).toContainText('copy');
    await expect(page.getByRole('menu')).toHaveCount(0);
  });

  test('toggle: aria-pressed flips on click', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Negrita' });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });

  test('collapsible: aria-expanded + lazy region', async ({ page }) => {
    await page.goto('/');
    const trigger = page.getByRole('button', { name: 'Ver detalles del plan' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByText('usuarios ilimitados')).toHaveCount(0);
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText('usuarios ilimitados')).toBeVisible();
  });

  test('hover-card: card shows on focus, hides on Escape', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: '@georgetech' }).focus();
    await expect(page.getByRole('dialog', { name: 'Perfil de usuario' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Perfil de usuario' })).toHaveCount(0);
  });

  test('pagination: aria-current page, navigation updates page', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Paginación' });
    await expect(nav.getByRole('button', { name: 'Página 3' })).toHaveAttribute('aria-current', 'page');
    await nav.getByRole('button', { name: 'Página siguiente' }).click();
    await expect(nav.getByRole('button', { name: 'Página 4' })).toHaveAttribute('aria-current', 'page');
  });

  test('command: modal palette filters by query, Enter runs + closes', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Buscar comando/ }).click();
    const dialog = page.getByRole('dialog', { name: 'Paleta de comandos' });
    await expect(dialog).toBeVisible();
    const search = dialog.getByRole('combobox');
    await expect(search).toBeFocused();
    await search.pressSequentially('guar');
    await expect(dialog.getByRole('option', { name: 'Guardar' })).toBeVisible();
    await expect(dialog.getByRole('option', { name: 'Nuevo archivo' })).toHaveCount(0);
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('cmd-value')).toContainText('save');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('date-picker: opens calendar dialog, picking a day commits + closes + restores focus', async ({
    page,
  }) => {
    await page.goto('/');
    const trigger = page.getByRole('button', { name: 'Fecha de nacimiento' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Fecha de nacimiento' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('grid')).toBeFocused(); // focus lands on the grid (APG)
    await dialog.getByRole('gridcell', { name: /10 de/ }).first().click();
    await expect(page.getByTestId('dob-value')).not.toContainText('—');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toBeFocused();
  });

  test('progress: role=progressbar with aria-valuenow/min/max', async ({ page }) => {
    await page.goto('/');
    const bar = page.getByRole('progressbar', { name: 'Carga' });
    await expect(bar).toHaveAttribute('aria-valuenow', '66');
    await expect(bar).toHaveAttribute('aria-valuemin', '0');
    await expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  test('sheet: edge drawer opens modal, Esc closes + restores focus', async ({ page }) => {
    await page.goto('/');
    const trigger = page.getByRole('button', { name: 'Abrir sheet' });
    await trigger.click();
    const sheet = page.getByRole('dialog', { name: 'Panel lateral' });
    await expect(sheet).toBeVisible();
    await expect(sheet).toHaveAttribute('aria-modal', 'true');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Panel lateral' })).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('accordion: aria-expanded toggles + lazy content (inherited from @angular/aria)', async ({
    page,
  }) => {
    await page.goto('/');
    const trigger = page.getByRole('button', { name: '¿Qué es signng?' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText('Librería de componentes Angular signals-native')).toBeVisible();
  });

  test('select: combobox opens listbox, selecting an option updates + closes', async ({ page }) => {
    await page.goto('/');
    const trigger = page.getByRole('combobox', { name: 'País' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible();
    const listboxId = await listbox.getAttribute('id');
    expect(listboxId).toBeTruthy();
    await expect(trigger).toHaveAttribute('aria-controls', listboxId!); // combobox owns the listbox
    await page.getByRole('option', { name: 'México' }).click();
    await expect(trigger).toContainText('México');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('popover: opens, focus moves in, axe clean open, Esc closes + restores focus', async ({
    page,
  }) => {
    await page.goto('/');
    const trigger = page.getByRole('button', { name: 'Abrir popover' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    const panel = page.getByRole('dialog');
    await expect(panel).toBeVisible();
    // focus moved into the panel (auto-capture lands on the first control)
    await expect(page.getByRole('button', { name: 'Entendido' })).toBeFocused();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);

    await page.keyboard.press('Escape');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(trigger).toBeFocused(); // focus restored
  });
});
