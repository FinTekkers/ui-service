// HTML escaping for the emails the public forms send (/free/request,
// US-352; /contactus, US-356): visitor text shows as text, never markup.

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
