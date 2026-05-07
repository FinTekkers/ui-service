/**
 * Single-page scrollbar — second-brain#223 (brute-force).
 *
 * History:
 *   PR #127  per-grid overflow stripped → two scrollbars still showed.
 *   PR #131  Option 1 (app-shell pinned + content-area scroll) — phantom
 *            gutter on macOS "Always show scrollbars".
 *   PR #132  Option 2 (sticky sidebar + body scroll) — broke in Safari
 *            (sticky + flex + 100vh interaction; not reproducible in
 *            Chromium-headless).
 *   This PR  Brute-force: <html> is the only scroll container.
 *            .main_ui_menu lost its 100vh + overflow:hidden cap;
 *            sidebar is no longer sticky; calculator-layout is no
 *            longer sticky. Trade-off: sidebar/inputs scroll with the
 *            page. Acceptance: works in Safari + Chrome (manual).
 *
 * Assertions:
 *   1. <html>.overflowY is 'scroll' (always-visible track).
 *   2. <body>.overflowY is 'visible' (body delegates scroll to html).
 *   3. No descendant of .auth-shell is an active scroll container
 *      (scrollHeight > clientHeight WITH overflow auto|scroll set),
 *      apart from autocomplete-suggestion popups (.suggestions etc.
 *      which are absolutely-positioned overlays, not layout scrollers).
 */

import { test, expect } from '@playwright/test';

const PAGES = ['/data/securities', '/data/positions', '/data/calculators'];

// storageState is provided by the chromium project (auth.setup.ts dependency).
test.use({
  viewport: { width: 1920, height: 1080 },
});

for (const path of PAGES) {
  test(`${path} — single body scrollbar (brute-force)`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('.auth-shell')).toBeVisible({ timeout: 10_000 });

    const rootScroll = await page.evaluate(() => ({
      htmlOverflowY: getComputedStyle(document.documentElement).overflowY,
      bodyOverflowY: getComputedStyle(document.body).overflowY,
    }));
    expect(rootScroll.htmlOverflowY, `${path}: html.overflow-y must be 'scroll'`).toBe('scroll');
    expect(rootScroll.bodyOverflowY, `${path}: body.overflow-y must be 'visible'`).toBe('visible');

    const rogueScrollers = await page.evaluate(() => {
      const shell = document.querySelector('.auth-shell');
      if (!shell) return ['.auth-shell missing'];
      const offenders: string[] = [];
      const all = shell.querySelectorAll<HTMLElement>('*');
      for (const el of all) {
        if (el.closest('.suggestions, [class*="suggestion"]')) continue;
        const cs = getComputedStyle(el);
        const hasOverflow =
          cs.overflowY === 'auto' || cs.overflowY === 'scroll' ||
          cs.overflowX === 'auto' || cs.overflowX === 'scroll' ||
          cs.overflow === 'auto' || cs.overflow === 'scroll';
        if (!hasOverflow) continue;
        const overflowsY = el.scrollHeight - el.clientHeight > 1;
        const overflowsX = el.scrollWidth - el.clientWidth > 1;
        if (overflowsY || overflowsX) {
          offenders.push(`${el.tagName}.${el.className}: scrollH=${el.scrollHeight} clientH=${el.clientHeight}`);
        }
      }
      return offenders;
    });
    expect(rogueScrollers, `${path}: only <html> may scroll; found rogue scrollers`).toEqual([]);
  });
}
