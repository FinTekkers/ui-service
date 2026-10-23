/**
 * Vitest stub for `$app/forms` (SvelteKit's virtual module). `enhance` is a
 * no-op action here: component tests check what a form would send, not the
 * network.
 */
export function enhance(_form: HTMLFormElement, _submit?: unknown) {
  return { destroy() {} };
}
