/**
 * URL 'from' parameter helper.
 *
 * Used to preserve the 'from' query param across route navigations.
 * If 'from' is not in the current URL, nothing is added.
 */

const VALID_FROM_VALUES = new Set(['im', 'trtc']);

/**
 * Read 'from' from the current hash-based URL.
 * Returns the value if valid, otherwise null.
 */
function readFromUrl(): string | null {
  const hash = window.location.hash;
  const queryStr = hash.includes('?') ? hash.split('?')[1] : '';
  const params = new URLSearchParams(queryStr);
  const fromParam = params.get('from');
  return fromParam && VALID_FROM_VALUES.has(fromParam) ? fromParam : null;
}

/**
 * Get a query object containing 'from' if it exists in the current URL.
 * Returns {} when 'from' is not present, so spreading it into a
 * route query won't add an unwanted param.
 */
export function getFromQuery(): Record<string, string> {
  const from = readFromUrl();
  return from ? { from } : {};
}
