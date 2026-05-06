/**
 * Page-shell single-scrollbar invariant — second-brain#223 follow-up.
 *
 * The bug: PR #127 dropped table-level overflow but two scrollbars were
 * still visible on every authenticated data page. Cause: the per-page
 * outer wrapper allowed body scroll when the sidebar overflowed, while
 * the right-pane .dashboard-container had its own overflow:auto.
 *
 * The fix: factor src/routes/(authenticated)/+layout.svelte to own the
 * shell. .auth-shell pinned to viewport with overflow:hidden; sidebar
 * with internal scroll if its menu grows; .content-area is the single
 * scroll surface for page content.
 *
 * This spec uses a deliberately small viewport (1024×500) to FORCE both
 * vertical and horizontal overflow on every page, and asserts:
 *   1. document.body does not scroll.
 *   2. The only scroll surface in the main content flow is .content-area.
 *      The sidebar (inside .dashboard-sidebar) is allowed to scroll
 *      internally when its menu items + logo + logout exceed viewport
 *      height — that's part of Option 1's app-shell shape (sidebar
 *      contains its own scroll instead of pushing body). It's not a
 *      competing scroll for the content area.
 *
 * Default desktop viewports (1280×720+) often don't trigger the bug
 * because content fits — that's why the bug shipped past PR #127.
 *
 * Calc pages are included: their inputs+results section uses
 * position:sticky to stay visible while the cashflow flows past, so the
 * single-scrollbar invariant holds on /data/calculators too.
 */
import { test, expect } from '@playwright/test';

// 1024 wide forces some grids to need horizontal scroll; 500 tall forces
// every page to need vertical scroll once content+padding exceed it.
test.use({ viewport: { width: 1024, height: 500 } });

const PAGES = [
  '/data/securities',
  '/data/positions',
  '/data/transactions',
  '/data/portfolios',
  '/data/prices',
  '/data/cpi_index',
  '/data/treasury_curve',
  '/data/curves',
  '/data/catalog',
  '/data/calculators',
] as const;

// Authentication waits for storageState (set by playwright.config.ts via
// auth.setup.ts), so each test starts already logged in.
for (const path of PAGES) {
  test(`${path} — single page-level scroll surface (.content-area)`, async ({ page }) => {
    await page.goto(path);

    // Wait for the layout to render before measuring.
    await expect(page.locator('.auth-shell')).toBeVisible({ timeout: 10_000 });
    await page.waitForLoadState('networkidle');

    // Body must not be scrollable. The auth-shell's overflow:hidden
    // suppresses body scroll; if it's > 0 we've regressed.
    const bodyOverflow = await page.evaluate(() => ({
      scrollHeight: document.body.scrollHeight,
      clientHeight: document.body.clientHeight,
      overflowY: getComputedStyle(document.body).overflowY,
    }));
    expect(
      bodyOverflow.scrollHeight - bodyOverflow.clientHeight,
      `body must not scroll on ${path} (got scrollHeight=${bodyOverflow.scrollHeight}, clientHeight=${bodyOverflow.clientHeight})`,
    ).toBeLessThanOrEqual(1);

    // Count actually-scrolling elements OUTSIDE the sidebar. The sidebar
    // (inside .dashboard-sidebar) is allowed to scroll internally — that's
    // the Option 1 design. We only care about competing scroll surfaces
    // in the main content flow.
    //
    // Autocomplete .suggestions lists and similar dropdowns have
    // max-height + overflow:auto but are display:none / hidden when not
    // active, so they don't show up as actively scrolling.
    const scrollingOutsideSidebar = await page.evaluate(() => {
      const out: string[] = [];
      const candidates = Array.from(document.querySelectorAll<HTMLElement>('*'));
      for (const el of candidates) {
        if (el.closest('.dashboard-sidebar')) continue;
        const cs = getComputedStyle(el);
        const scrollable =
          cs.overflowY === 'auto' || cs.overflowY === 'scroll' ||
          cs.overflowX === 'auto' || cs.overflowX === 'scroll' ||
          cs.overflow === 'auto' || cs.overflow === 'scroll';
        if (!scrollable) continue;
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        const overflowsY = el.scrollHeight - el.clientHeight > 1;
        const overflowsX = el.scrollWidth - el.clientWidth > 1;
        if (overflowsY || overflowsX) {
          out.push(`${el.tagName}.${el.className?.toString?.().split(' ').slice(0, 2).join('.')}`);
        }
      }
      return out;
    });

    expect(
      scrollingOutsideSidebar.length,
      `${path} should have exactly one content-area scroll surface; found: ${JSON.stringify(scrollingOutsideSidebar)}`,
    ).toBeLessThanOrEqual(1);

    // When something IS scrolling outside the sidebar, it must be
    // .content-area — not some grid that re-introduced overflow.
    if (scrollingOutsideSidebar.length === 1) {
      const contentAreaIsScrolling = await page.locator('.content-area').evaluate((el) => {
        const overflowsY = el.scrollHeight - el.clientHeight > 1;
        const overflowsX = el.scrollWidth - el.clientWidth > 1;
        return overflowsY || overflowsX;
      });
      expect(
        contentAreaIsScrolling,
        `${path}: the one scrolling element must be .content-area`,
      ).toBe(true);
    }
  });
}
