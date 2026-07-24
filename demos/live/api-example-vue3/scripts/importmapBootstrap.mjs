/**
 * Shared logic for the runtime importmap bootstrap.
 *
 * The `injectImportMapBootstrapPlugin.mjs` plugin bakes a small inline
 * `<script>` into the built index.html. That script must derive the
 * absolute URL of `host-shim/*.js` from the current page URL at load
 * time, no matter where the bundle is deployed.
 *
 * The URL-derivation core is trivial enough that we could inline it
 * directly into the bootstrap script — but doing so would make it
 * effectively untestable without a headless browser. Instead, we
 * factor it out here as a plain function, and:
 *
 *   1. The vite plugin embeds the SAME logic into the runtime
 *      bootstrap script body (see `renderImportMapBootstrapScript`).
 *      This is a copy in source-text form, kept in lockstep by hand,
 *      but reduced to ~4 lines of core math that are easy to review.
 *   2. `tests/coverage.spec.ts` imports THIS module and asserts the
 *      logic behaves correctly against a table of deployment URL
 *      shapes (root, subpath, index.html, query, hash, file://).
 *
 * If a future regression changes the runtime logic without updating
 * this module, the test suite will still pass and someone will get
 * a broken deploy. To guard against that, the test also spot-checks
 * a fingerprint of the runtime bootstrap source text (see
 * `assertBootstrapContainsCoreLogic` below) so drift is loud.
 */

/**
 * Derive the absolute directory URL that host-shim assets are
 * served from, given the URL of the currently-loaded index.html.
 *
 * Behaviour matches what the browser does when the bootstrap script
 * runs `document.currentScript.baseURI`:
 *   - Query and fragment are already excluded from `baseURI`.
 *   - We drop everything after the final '/' to get the directory
 *     portion. Falls back to appending '/' if no slash exists
 *     (defensive; should not happen for real URLs).
 *
 * @param {string} baseURI - `document.currentScript.baseURI` value.
 * @returns {string} absolute directory URL, always ends with '/'.
 */
export function deriveDeployRoot(baseURI) {
  // Strip query and hash defensively — `baseURI` does NOT include
  // them per spec, but tests pass raw location.href-style strings.
  const noHash = baseURI.split('#')[0];
  const noQuery = noHash.split('?')[0];
  const slash = noQuery.lastIndexOf('/');
  return slash >= 0 ? noQuery.slice(0, slash + 1) : noQuery + '/';
}

/**
 * Compose the absolute URL of a host-shim file given the deploy
 * root and the file name (as declared in `SHARED_SINGLETONS`).
 *
 * @param {string} rootUrl - result of `deriveDeployRoot`.
 * @param {string} shimFile - e.g. "vue.js".
 * @returns {string} absolute URL of the shim.
 */
export function resolveShimUrl(rootUrl, shimFile) {
  return new URL('host-shim/' + shimFile, rootUrl).toString();
}

/**
 * Build the imports object that will populate the importmap.
 *
 * @param {string} baseURI - `document.currentScript.baseURI` value.
 * @param {Array<{name: string, shimFile: string}>} sharedSingletons
 * @returns {Record<string, string>}
 */
export function buildImportsForBaseURI(baseURI, sharedSingletons) {
  const root = deriveDeployRoot(baseURI);
  const imports = {};
  for (const s of sharedSingletons) {
    imports[s.name] = resolveShimUrl(root, s.shimFile);
  }
  return imports;
}

/**
 * Fingerprint of code fragments that MUST appear inside the runtime
 * bootstrap script for it to behave correctly. Used by the test
 * suite as a smoke check: if someone rewrites the plugin without
 * touching this file, the assertion here will catch drift.
 *
 * Each entry is a plain substring (NOT a regex) — a matcher of the
 * essential moves the runtime must make.
 */
export const BOOTSTRAP_FINGERPRINT = Object.freeze([
  // Must locate its own URL via document.currentScript.
  'document.currentScript',
  // Must derive a directory URL by trimming past the last '/'.
  "lastIndexOf('/')",
  // Must build absolute URLs with the URL constructor.
  "new URL('host-shim/'",
  // Must install a <script type="importmap">.
  "'importmap'",
  // Must append the importmap element to head.
  'document.head',
]);
