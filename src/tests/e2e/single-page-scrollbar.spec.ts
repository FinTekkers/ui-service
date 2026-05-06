/**
 * Page-shell single-scrollbar invariant — second-brain#223 follow-up
 * RECOVERY (Option 2: sticky sidebar + body scroll).
 *
 * Previous version (PR #131) used 1024×500 to force overflow on every
 * page. That viewport happens to fit the sidebar (.dashboard_user_menu_options
 * is 50vh + logo + logout) within 100vh, so Option 1's sidebar
 * overflow-y: auto never triggered and the spec passed despite the
 * sidebar showing its own scrollbar at typical desktop sizes.
 *
 * This rewrite asserts the Option 2 invariant at typical desktop:
 *
 *   1. document.body owns scrolling — overflow-y is visible (default)
 *      and (when content overflows) the body actually scrolls.
 *   2. .dashboard-sidebar is position:sticky and does NOT have an
 *      active scrollbar (its overflow-y:auto fallback is just for
 *      tiny viewports; at 1440×900 the menu fits with headroom).
 *   3. .content-area has NO overflow set (no auto/scroll/hidden) —
 *      content flows naturally and body handles overflow. This is
 *      the bit that prevents macOS's phantom-scrollbar behavior.
 *
 * 1920×1080 is the common production-equivalent desktop viewport. The
 * sidebar (padding-top + avatar + gap-20 + menu-options 50vh + gap-20 +
 * logout) needs ~917px vertical at any viewport (50vh = 540 at 1080 vs
 * 450 at 900) — at 900 it overflows by ~17px and triggers the fallback
 * overflow-y:auto. At 1080+ it fits cleanly. Documented in the issue:
 * sidebar's overflow-y:auto is a fallback for tiny viewports; don't
 * over-engineer for sub-1000px heights.
 */
import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1920, height: 1080 } });

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

for (const path of PAGES) {
  test(`${path} — body owns scroll, sidebar sticky, content-area has no overflow`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('.auth-shell')).toBeVisible({ timeout: 10_000 });
    await page.waitForLoadState('networkidle');

    // 1. Body must NOT have overflow:hidden / overflow:auto. The default
    // (visible) lets the page-level scrollbar appear when content
    // overflows, and crucially does NOT reserve a gutter when it doesn't.
    const bodyOverflow = await page.evaluate(() => {
      const cs = getComputedStyle(document.body);
      return { x: cs.overflowX, y: cs.overflowY };
    });
    expect(
      ['visible', ''],
      `${path}: body overflow-y must be 'visible' (Option 2: body owns scroll); got ${bodyOverflow.y}`,
    ).toContain(bodyOverflow.y);

    // 2. Sidebar must be position:sticky. Its overflow-y is allowed to be
    // auto (fallback for tiny viewports) but at 1440×900 the menu fits,
    // so no scrollbar should actually be active.
    const sidebar = await page.locator('.dashboard-sidebar').evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        position: cs.position,
        height: cs.height,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
      };
    });
    expect(
      sidebar.position,
      `${path}: .dashboard-sidebar must be position:sticky (Option 2)`,
    ).toBe('sticky');
    // At 1920×1080 the menu fits — sidebar should not be actively scrolling.
    expect(
      sidebar.scrollHeight - sidebar.clientHeight,
      `${path}: sidebar should not need to scroll at 1920×1080 (got scrollH=${sidebar.scrollHeight}, clientH=${sidebar.clientHeight})`,
    ).toBeLessThanOrEqual(1);

    // 3. .content-area must NOT have overflow set. Setting overflow:auto
    // makes it a phantom scroll container on macOS "Always show
    // scrollbars" — that's exactly the bug Option 1 caused.
    const contentArea = await page.locator('.content-area').evaluate((el) => {
      const cs = getComputedStyle(el);
      return { overflowX: cs.overflowX, overflowY: cs.overflowY };
    });
    expect(
      ['visible', ''],
      `${path}: .content-area overflow-x must be 'visible'; got '${contentArea.overflowX}'`,
    ).toContain(contentArea.overflowX);
    expect(
      ['visible', ''],
      `${path}: .content-area overflow-y must be 'visible'; got '${contentArea.overflowY}'`,
    ).toContain(contentArea.overflowY);

    // 4. Inventory: across the whole page, the only element that should
    // CURRENTLY be scrolling (overflow set AND content exceeds box) is
    // either nothing (content fits viewport) or — if content tall — the
    // documentElement / body. No element inside .content-area or sidebar
    // should be a competing scroll surface.
    const competingScrolls = await page.evaluate(() => {
      const out: string[] = [];
      document.querySelectorAll<HTMLElement>('*').forEach((el) => {
        if (el === document.documentElement || el === document.body) return;
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') return;
        const overflowSet =
          cs.overflowY === 'auto' || cs.overflowY === 'scroll' ||
          cs.overflowX === 'auto' || cs.overflowX === 'scroll' ||
          cs.overflow === 'auto' || cs.overflow === 'scroll';
        if (!overflowSet) return;
        const overflowsY = el.scrollHeight - el.clientHeight > 1;
        const overflowsX = el.scrollWidth - el.clientWidth > 1;
        if (!overflowsY && !overflowsX) return;
        out.push(`${el.tagName}.${el.className?.toString?.().split(' ').slice(0, 2).join('.')}`);
      });
      return out;
    });
    // Allowed: dropdown/popover-style overlays (autocomplete .suggestions
    // is display:none when not active so won't appear here; if any ARE
    // shown, they're transient UI and not the page-level scrollbar).
    expect(
      competingScrolls.length,
      `${path}: no element inside the layout should be actively scrolling (Option 2 — body is the only scroll); found: ${JSON.stringify(competingScrolls)}`,
    ).toBe(0);
  });
}
