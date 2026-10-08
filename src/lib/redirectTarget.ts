const DEFAULT_TARGET = "/data/portfolios";

/**
 * Where to send the user after login or registration.
 *
 * - Only same-site paths are allowed (a single leading "/"); anything else,
 *   including "//evil.com" and "https://...", falls back.
 * - Trailing slashes are stripped, so "/data/portfolios/" lands on
 *   "/data/portfolios" and relative links can't resolve beneath it.
 * - Repeated slashes collapse, and a segment equal to the one before it is
 *   dropped: "/data/portfolios/portfolios" was the URL old relative sidebar
 *   links produced (US-203), so a stale redirectTo still lands on the page.
 *   Only adjacent repeats are removed.
 * - The query string is kept.
 */
export function safeRedirectTarget(
  raw: string | null,
  fallback: string = DEFAULT_TARGET
): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return fallback;
  if (raw.startsWith("/\\")) return fallback;

  let parsed: URL;
  try {
    parsed = new URL(raw, "http://local");
  } catch {
    return fallback;
  }
  if (parsed.origin !== "http://local") return fallback;

  const segments = parsed.pathname
    .split("/")
    .filter(Boolean)
    .filter((segment, i, all) => i === 0 || segment !== all[i - 1]);

  return "/" + segments.join("/") + parsed.search;
}
