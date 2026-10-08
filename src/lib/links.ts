import { base } from "$app/paths";

/**
 * Href for a menu entry. Internal entries are absolute paths ("/data/...")
 * so they resolve the same from every page; prefix them with the app's base
 * path. External URLs pass through unchanged.
 */
export const menuHref = (url: string): string =>
  url.startsWith("/") ? base + url : url;
