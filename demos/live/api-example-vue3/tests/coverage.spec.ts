/**
 * Coverage regression for the API Example site.
 *
 * Strategy (see PRD FR5): instead of naively scanning a hook's *runtime*
 * return object (which misses members injected via spread `...actions`), we
 * scan the framework-agnostic **contract type** of each state and require that
 * every callable, non-deprecated API has a declared example.
 *
 * The test only reads source text (no SDK import), so it runs in plain Node.
 *
 * When a new API is added to a contract, this test fails until an example is
 * added to the corresponding `src/examples/*.ts` file.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
// @ts-expect-error - `.mjs` module with no `.d.ts`; the scanner is intentionally
// plain Node so `vite.config.ts`'s build-time preflight plugin can share it.
import { scanFacadeContract, formatMissingValues, formatMissingTypes } from '../scripts/scanFacadeContract.mjs';
// @ts-expect-error - `.mjs` module with no `.d.ts`; shared between the vite
// plugin (embedded into runtime bootstrap script) and this test suite.
import { deriveDeployRoot, buildImportsForBaseURI, BOOTSTRAP_FINGERPRINT } from '../scripts/importmapBootstrap.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const CORE_TYPES = resolve(here, '../../../../packages/uikit-core/src/types');
const EXAMPLES = resolve(here, '../src/examples');
const SUBSCRIPTION_HELPER = resolve(
  here,
  '../src/services/event-log/buildSubscriptionCards.ts',
);
const SDK_FACADE = resolve(here, '../src/services/sdk-source/facade.ts');
const IMPORTMAP_BOOTSTRAP_PLUGIN = resolve(
  here,
  '../scripts/injectImportMapBootstrapPlugin.mjs',
);
const MAIN_TS = resolve(here, '../src/main.ts');

/**
 * Callable members that are intentionally not surfaced as their own card.
 *
 * Empty by default — `subscribeEvent` / `unsubscribeEvent` are surfaced as
 * a pair of toggle cards via `buildSubscriptionCards` (see
 * `src/services/event-log/buildSubscriptionCards.ts`).
 */
const IGNORE = new Set<string>();

interface TargetSpec {
  /** Matrix slug, for error messages. */
  slug: string;
  /** Contract interface name in the core type file. */
  contractInterface: string;
  /** Core type file (relative to CORE_TYPES). */
  contractFile: string;
  /** Example file (relative to EXAMPLES). */
  exampleFile: string;
}

const TARGETS: TargetSpec[] = [
  {
    slug: 'live-list',
    contractInterface: 'ILiveListStateReturn',
    contractFile: 'liveList.ts',
    exampleFile: 'liveListState.ts',
  },
  {
    slug: 'live-audience',
    contractInterface: 'ILiveAudienceStateReturn',
    contractFile: 'liveAudience.ts',
    exampleFile: 'liveAudienceState.ts',
  },
  {
    slug: 'live-player',
    contractInterface: 'ILivePlayerStateReturn',
    contractFile: 'livePlayer.ts',
    exampleFile: 'livePlayerState.ts',
  },
];

interface Member {
  name: string;
  callable: boolean;
  deprecated: boolean;
}

/** Extract the `{ ... }` body of `interface <name>` (brace matched). */
function extractInterfaceBody(src: string, name: string): string {
  const declIdx = src.indexOf(`interface ${name}`);
  if (declIdx < 0) {
    throw new Error(`interface ${name} not found`);
  }
  const braceStart = src.indexOf('{', declIdx);
  let depth = 0;
  for (let i = braceStart; i < src.length; i++) {
    if (src[i] === '{') {
      depth++;
    } else if (src[i] === '}') {
      depth--;
      if (depth === 0) {
        return src.slice(braceStart + 1, i);
      }
    }
  }
  throw new Error(`Unbalanced braces for interface ${name}`);
}

/**
 * Parse top-level members of an interface body. Members in these contracts are
 * single-line (`name: Type` or `name: (args) => ret`), with JSDoc above.
 */
function parseMembers(body: string): Member[] {
  const members: Member[] = [];
  let pendingDeprecated = false;
  for (const rawLine of body.split('\n')) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }
    if (line.startsWith('/**') || line.startsWith('*') || line.startsWith('*/') || line.startsWith('//')) {
      if (line.includes('@deprecated')) {
        pendingDeprecated = true;
      }
      continue;
    }
    const match = line.match(/^([A-Za-z_]\w*)\??\s*:\s*(.*)$/);
    if (match) {
      const [, name, typeText] = match;
      members.push({
        name,
        callable: typeText.includes('=>'),
        deprecated: pendingDeprecated,
      });
      pendingDeprecated = false;
    }
  }
  return members;
}

/**
 * Declared `api: '...'` names in an example file.
 *
 * Examples that call `buildSubscriptionCards(...)` (see
 * `src/services/event-log/buildSubscriptionCards.ts`) implicitly declare the
 * `subscribeEvent` / `unsubscribeEvent` cards via the helper; merge those in
 * so the contract scanner sees them as covered. The opt-in is via the call
 * site: groups that don't use the helper still have to declare the pair
 * locally.
 */
function declaredApis(exampleSrc: string): Set<string> {
  const set = new Set<string>();
  const re = /\bapi:\s*'([^']+)'/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(exampleSrc)) !== null) {
    set.add(m[1]);
  }
  if (exampleSrc.includes('buildSubscriptionCards(')) {
    const helperSrc = readFileSync(SUBSCRIPTION_HELPER, 'utf-8');
    let h: RegExpExecArray | null;
    const helperRe = /\bapi:\s*'([^']+)'/g;
    while ((h = helperRe.exec(helperSrc)) !== null) {
      set.add(h[1]);
    }
  }
  return set;
}

describe('API Example coverage matrix', () => {
  for (const target of TARGETS) {
    it(`covers all callable APIs of ${target.contractInterface} (${target.slug})`, () => {
      const contractSrc = readFileSync(resolve(CORE_TYPES, target.contractFile), 'utf-8');
      const exampleSrc = readFileSync(resolve(EXAMPLES, target.exampleFile), 'utf-8');

      const members = parseMembers(extractInterfaceBody(contractSrc, target.contractInterface));
      const required = members
        .filter(m => m.callable && !m.deprecated && !IGNORE.has(m.name))
        .map(m => m.name);

      expect(required.length, `${target.slug}: no callable APIs parsed`).toBeGreaterThan(0);

      const declared = declaredApis(exampleSrc);
      const missing = required.filter(name => !declared.has(name));

      expect(
        missing,
        `${target.slug} 缺少以下 API 的示例（请在 src/examples/${target.exampleFile} 补充 api: '...' 卡片）：${missing.join(', ')}`,
      ).toEqual([]);
    });
  }
});

/**
 * Regression tests that guard `pnpm build` in `vite build` mode from a very
 * specific and hard-to-diagnose failure: rollup rejects the build with
 *   "<name>" is not exported by "src/services/sdk-source/facade.ts"
 * when a new example file `import { newHook } from 'tuikit-atomicx-vue3'`
 * but the facade forgot to forward `newHook`.
 *
 * The failure is invisible to `pnpm dev` (facade is aliased in ONLY at
 * build time), so `pnpm run test:coverage` is the earliest place to catch
 * it. The same scanner is also loaded by `vite.config.ts` as a build-time
 * pre-flight guard, so CI pipelines that skip `test:coverage` still get a
 * friendly diagnostic instead of the raw rollup error.
 *
 * The check is split into two tests with different severities:
 *
 *   1. **Hard failure — value forwarders**. hook forwarders + enum lazy
 *      proxies are `export const X = ...` in the facade. Rollup performs
 *      strict static checking on these at build time; a missing entry
 *      breaks the build. Enforced with `toEqual({})`.
 *
 *   2. **Soft warning — type re-exports**. `import { type X } from ...`
 *      is stripped by esbuild/tsc before rollup sees anything, so a
 *      missing `export type { X }` in the facade does NOT break the
 *      build. It only degrades IDE experience (missing autocomplete /
 *      go-to-definition). Reported via console.warn so it stays visible
 *      without failing CI on cosmetic drift.
 *
 * Historic incident: 2026-07 蓝盾 pipeline broke because CoHost / Battle /
 * LiveGift / Barrage were all added but facade was never updated. The
 * hard-failure test below would have caught that at PR time.
 */
describe('SDK facade forwards every import used by examples', () => {
  it('facade.ts exports every VALUE specifier the examples import from tuikit-atomicx-vue3', () => {
    const { missingValues } = scanFacadeContract({
      examplesDir: EXAMPLES,
      facadePath: SDK_FACADE,
    });

    expect(
      missingValues,
      Object.keys(missingValues).length > 0
        ? formatMissingValues(missingValues)
        : '',
    ).toEqual({});
  });

  it('facade.ts type re-exports cover every TYPE specifier the examples import (soft warn)', () => {
    const { missingTypes } = scanFacadeContract({
      examplesDir: EXAMPLES,
      facadePath: SDK_FACADE,
    });

    if (Object.keys(missingTypes).length > 0) {
      // Deliberately a warn, not an assertion failure: type-only imports
      // are stripped before rollup, so this shouldn't block a build. The
      // warn keeps the drift visible in test output without breaking CI.
      // eslint-disable-next-line no-console
      console.warn(formatMissingTypes(missingTypes));
    }
    expect(true).toBe(true);
  });
});

/**
 * Regression tests for the runtime importmap bootstrap.
 *
 * The bootstrap script runs inside every deployed index.html and is
 * responsible for building an absolute-URL importmap at page-load
 * time. It must be robust against every deployment shape (root,
 * arbitrarily deep subpath, index.html or not, ?query, #hash,
 * file://).
 *
 * We cannot run the actual bootstrap in Node (it needs a DOM), so we
 * verify two things instead:
 *   1. The URL-derivation math (extracted into `importmapBootstrap.mjs`)
 *      handles every deployment URL shape correctly.
 *   2. The plugin's runtime bootstrap source text still contains the
 *      essential moves — a low-effort fingerprint check that catches
 *      structural drift (e.g. someone rewrites the plugin to use
 *      `location.href` instead of `document.currentScript.baseURI`).
 *
 * Historic incident: 2026-07 the demo failed to load on
 * `web.sdk.qcloud.com/hybrid/live/api-example/vue3/dev/` because the
 * static importmap used absolute paths (`/host-shim/vue.js`) that
 * resolved against the origin rather than the deploy subpath. The
 * fix switched to runtime-computed absolute URLs; these tests lock
 * that fix in place.
 */
describe('Runtime importmap bootstrap deploy-location independence', () => {
  const SHARED_SINGLETONS = [
    { name: 'vue', shimFile: 'vue.js' },
    { name: 'vue-router', shimFile: 'vue-router.js' },
    { name: '@tencentcloud/uikit-base-component-vue3', shimFile: 'uikit-base.js' },
  ];

  // Each row: [label, baseURI given to bootstrap, expected 'vue' shim URL].
  // Covers every deployment shape we've seen or can reasonably expect.
  const scenarios: Array<[string, string, string]> = [
    [
      'root deploy',
      'https://x.com/',
      'https://x.com/host-shim/vue.js',
    ],
    [
      'root deploy with explicit index.html',
      'https://x.com/index.html',
      'https://x.com/host-shim/vue.js',
    ],
    [
      'production subpath deploy (blueking incident URL)',
      'https://web.sdk.qcloud.com/hybrid/live/api-example/vue3/dev/index.html',
      'https://web.sdk.qcloud.com/hybrid/live/api-example/vue3/dev/host-shim/vue.js',
    ],
    [
      'deep nested subpath ending in /',
      'https://x.com/a/b/c/',
      'https://x.com/a/b/c/host-shim/vue.js',
    ],
    [
      'deep nested subpath ending in index.html',
      'https://x.com/a/b/c/index.html',
      'https://x.com/a/b/c/host-shim/vue.js',
    ],
    [
      'URL with query string is stripped',
      'https://x.com/a/b/index.html?debug=1',
      'https://x.com/a/b/host-shim/vue.js',
    ],
    [
      'URL with hash is stripped',
      'https://x.com/a/b/index.html#/route/deep',
      'https://x.com/a/b/host-shim/vue.js',
    ],
    [
      'file:// protocol for offline preview',
      'file:///Users/user/dist/index.html',
      'file:///Users/user/dist/host-shim/vue.js',
    ],
  ];

  for (const [label, baseURI, expectedVueUrl] of scenarios) {
    it(`derives correct absolute URLs for: ${label}`, () => {
      const root = deriveDeployRoot(baseURI);
      const imports = buildImportsForBaseURI(baseURI, SHARED_SINGLETONS);

      expect(root.endsWith('/'), `deployRoot must end with '/': got ${root}`).toBe(true);
      const importsMap = imports as Record<string, string>;
      expect(importsMap['vue']).toBe(expectedVueUrl);
      // Every shim URL must be absolute (no relative paths leaking through).
      for (const [name, url] of Object.entries(importsMap)) {
        expect(
          /^[a-z]+:\/\//.test(url),
          `${name} must resolve to an absolute URL, got: ${url}`,
        ).toBe(true);
      }
    });
  }

  it('runtime bootstrap script embedded by injectImportMapBootstrapPlugin.mjs still contains the essential URL-derivation moves', () => {
    const src = readFileSync(IMPORTMAP_BOOTSTRAP_PLUGIN, 'utf-8');
    const fingerprints: string[] = BOOTSTRAP_FINGERPRINT;
    const missing = fingerprints.filter(fragment => !src.includes(fragment));

    expect(
      missing,
      missing.length > 0
        ? `\ninjectImportMapBootstrapPlugin.mjs has drifted: the runtime bootstrap script no longer contains these essential fragments:\n${missing.map(f => '  - ' + JSON.stringify(f)).join('\n')}\n` +
          `These fragments correspond to the moves that let the deployed page derive absolute host-shim URLs from its own location.\n` +
          `If the runtime logic is being replaced with something equivalent, update BOOTSTRAP_FINGERPRINT in scripts/importmapBootstrap.mjs to match.\n`
        : '',
    ).toEqual([]);
  });
});

/**
 * Regression tests for prod-mode SDK stylesheet injection.
 *
 * ## The bug this guards against
 *
 * The SDK entry (`tuikit-atomicx-vue3/dist/index.js`) starts with
 * `import './styles/index.css'` — a side-effect import carrying ALL
 * component styles (LiveView's `.stream-cover` / `.no-video-container`
 * video-stage classes, gift / barrage / co-host panels, etc.).
 *
 * - In `pnpm dev` the SDK is resolved via a vite workspace alias, so
 *   vite processes that CSS import and injects the styles for us.
 * - In `pnpm build` the SDK is loaded at runtime from esm.sh in
 *   bundler mode (`?external=...&target=es2022`). esm.sh STRIPS the
 *   CSS side-effect import from the JS and emits NO `x-esm-css`
 *   header, so the styles never reach the page unless main.ts injects
 *   them explicitly. Without injection: LiveView renders unstyled,
 *   `.no-video-container` collapses to 0px, and `openLocalCamera`
 *   produces a black (zero-size) preview even though capture works.
 *
 * `main.ts` fixes this by fetching the SDK's CSS bundle from esm.sh
 * (`/<pkg>@<version>/dist/styles/index.css`) and injecting a
 * `<link rel="stylesheet">` in the prod boot path, awaited alongside
 * the SDK JS import.
 *
 * ## Why a source-text test (not a runtime test)
 *
 * The injection only runs under `import.meta.env.PROD` inside an async
 * boot IIFE that also dynamic-imports from esm.sh — impossible to
 * exercise in a jsdom-less Node test without heavy mocking. Instead we
 * assert the SOURCE contains the essential moves, so an accidental
 * removal (someone "cleaning up" the CSS injection, or esm.sh URL
 * drift) fails loudly at PR time.
 *
 * Historic incident: 2026-07 the prod build loaded the SDK JS but not
 * its CSS. LiveView looked structurally present but visually broken,
 * and host camera preview was black. dev was unaffected (vite injects
 * the CSS), so it only reproduced on the deployed COS build.
 */
describe('Prod boot injects the SDK stylesheet', () => {
  const mainSrc = readFileSync(MAIN_TS, 'utf-8');

  it('main.ts resolves the SDK CSS URL from esm.sh headers with a hardcoded fallback', () => {
    // The resolution must be header-driven (authoritative) rather than
    // a bare hardcoded guess, to survive upstream drift in the SDK's
    // CSS output path or esm.sh's stylesheet-handoff behaviour.
    const fragments = [
      // 1) Prefer esm.sh's official CSS handoff header.
      'x-esm-css',
      // 2) Otherwise derive the resolved version from the module path
      //    header (so a `latest` request maps to the concrete version).
      'x-esm-path',
      // 3) Keep the conventional path only as a last-resort fallback.
      '/dist/styles/index.css',
    ];
    const missing = fragments.filter(f => !mainSrc.includes(f));
    expect(
      missing,
      missing.length > 0
        ? '\nmain.ts SDK-CSS resolution has drifted — missing:\n'
          + missing.map(f => '  - ' + JSON.stringify(f)).join('\n')
          + '\nThe URL must be resolved from esm.sh response headers\n'
          + '(x-esm-css preferred, x-esm-path to derive the resolved\n'
          + 'version) with /dist/styles/index.css only as a last-resort\n'
          + 'fallback. A bare hardcoded path silently 404s if the SDK CSS\n'
          + 'output path or esm.sh behaviour changes, re-shipping the demo\n'
          + 'unstyled.\n'
        : '',
    ).toEqual([]);
  });

  it('main.ts injects a <link rel="stylesheet"> for the SDK CSS', () => {
    const fragments = [
      // Creates a link element…
      "createElement('link')",
      // …as a stylesheet…
      "rel = 'stylesheet'",
      // …and appends it to the document head.
      'document.head.appendChild',
    ];
    const missing = fragments.filter(f => !mainSrc.includes(f));
    expect(
      missing,
      missing.length > 0
        ? '\nmain.ts is missing the SDK stylesheet injection moves:\n'
          + missing.map(f => '  - ' + JSON.stringify(f)).join('\n')
          + '\nWithout injecting the SDK CSS, the prod build renders LiveView '
          + 'unstyled and the camera preview is black (dev is unaffected '
          + 'because vite injects the CSS via the workspace alias).\n'
        : '',
    ).toEqual([]);
  });

  it('main.ts awaits the stylesheet load in the prod boot path (parallel with SDK JS)', () => {
    // The CSS injection must be awaited so the app does not mount
    // before styles apply (otherwise an unstyled LiveView flashes).
    // We look for the Promise.all that overlaps JS + CSS loading.
    expect(
      mainSrc.includes('injectSdkStylesheet') && mainSrc.includes('Promise.all'),
      'main.ts must await injectSdkStylesheet (ideally via Promise.all '
        + 'alongside the SDK dynamic import) so the boot overlay stays up '
        + 'until styles are applied.',
    ).toBe(true);
  });
});

/**
 * Contract tests for fetchLiveList — locks the demo card to the real
 * SDK signature.
 *
 * ## Why a dedicated test for this specific card
 *
 * fetchLiveList is a side-effect API: it resolves to `Promise<void>`
 * and writes results into the reactive state (liveList /
 * liveListCursor). This shape makes it especially error-prone in
 * demo authoring:
 *   - Easy to invent a phantom parameter that "would make sense"
 *     (historic case: `category` — never on the SDK signature, but
 *     lived in the demo's `fields` and snippet for a while, misleading
 *     integrators into passing an argument the SDK silently drops).
 *   - Easy to show a synthetic "Output" object that isn't the real
 *     return value, hiding the void nature and encouraging
 *     `const list = await fetchLiveList(...)` (which yields undefined).
 *
 * The tests below pin the demo card's public surface — `fields` keys,
 * `signature` string, snippet code — to the actual SDK contract. If
 * the SDK signature ever changes, both files fail together and force
 * an intentional co-update.
 *
 * Real SDK signature (see
 * `ui-component/packages/uikit-component-vue3/src/states/LiveListState/index.ts`):
 *
 *   async function fetchLiveList({
 *     cursor = '',
 *     count = 20,
 *   }: FetchLiveListParams): Promise<void>
 */
describe('fetchLiveList demo card stays aligned with the SDK contract', () => {
  const LIVE_LIST_EXAMPLE = resolve(EXAMPLES, 'liveListState.ts');
  const src = readFileSync(LIVE_LIST_EXAMPLE, 'utf-8');

  /**
   * Extract the fetchLiveList card block. We scan from its id anchor
   * up to the next `id:` (start of the next card). Regex is loose on
   * purpose — the card shape isn't a formal syntax, and a tighter
   * grammar would break every time we tweak formatting.
   */
  function extractFetchLiveListCard(): string {
    const idx = src.indexOf("id: 'live-list.fetchLiveList'");
    if (idx < 0) return '';
    // Look for the next card boundary, or the end of the exports.
    const tail = src.slice(idx);
    const nextIdMatch = tail.slice(1).match(/id:\s*'live-list\./);
    const end = nextIdMatch ? (nextIdMatch.index || 0) + 1 : tail.length;
    return tail.slice(0, end);
  }

  it('fetchLiveList card only declares fields the SDK actually accepts', () => {
    const card = extractFetchLiveListCard();
    expect(card, 'fetchLiveList card must exist in liveList.ts').not.toBe('');

    // Real SDK params: `{ cursor?: string; count?: number }`.
    // Anything else in `fields` is a phantom parameter.
    const ALLOWED = new Set(['cursor', 'count']);
    const fieldKeyRe = /\{\s*key:\s*'([^']+)'/g;
    const declared = new Set<string>();
    let m: RegExpExecArray | null;
    while ((m = fieldKeyRe.exec(card)) !== null) {
      declared.add(m[1]);
    }

    const phantom = [...declared].filter(k => !ALLOWED.has(k));
    expect(
      phantom,
      phantom.length > 0
        ? `\nfetchLiveList card declares fields the SDK does NOT accept: ${phantom.join(', ')}.\n`
          + 'The SDK signature is `fetchLiveList({ cursor?, count? }): Promise<void>` '
          + '— any other key is a phantom parameter that the SDK will silently drop, '
          + 'misleading integrators who copy the field into their own call site.\n'
          + 'Remove the field, or, if the SDK genuinely gained a new parameter, '
          + 'update ALLOWED in this test to match.\n'
        : '',
    ).toEqual([]);
  });

  it('fetchLiveList card signature reflects the real Promise<void> return type', () => {
    const card = extractFetchLiveListCard();
    const sigMatch = card.match(/signature:\s*'([^']+)'/);
    expect(sigMatch, 'fetchLiveList card must declare a signature string').not.toBeNull();
    const sig = (sigMatch as RegExpMatchArray)[1];

    // Must reflect that it returns Promise<void>. This is the whole
    // point — integrators looking at the signature must not think
    // there is a meaningful return value.
    expect(
      sig.includes('Promise<void>'),
      `\nfetchLiveList signature must declare 'Promise<void>' — the SDK function\n`
        + `resolves to void; results are consumed from the reactive state.\n`
        + `Current signature: ${sig}\n`,
    ).toBe(true);

    // Must not mention phantom parameters. `category` is the historic
    // offender; we include it in the sentinel list so a regression
    // that re-adds it is caught by name.
    const BANNED_IN_SIGNATURE = ['category'];
    const found = BANNED_IN_SIGNATURE.filter(w => sig.includes(w));
    expect(
      found,
      found.length > 0
        ? `\nfetchLiveList signature mentions parameters the SDK does not accept: ${found.join(', ')}.\n`
          + 'These will silently be dropped by the SDK and confuse integrators.\n'
        : '',
    ).toEqual([]);
  });

  it('fetchLiveList snippet is copy-pasteable and shows how to consume the reactive state', () => {
    const card = extractFetchLiveListCard();
    const snippetMatch = card.match(/snippet:\s*`([\s\S]*?)`/);
    expect(snippetMatch, 'fetchLiveList card must have a snippet').not.toBeNull();
    const snippet = (snippetMatch as RegExpMatchArray)[1];

    const requiredFragments = [
      // Imports the state hook by its published name.
      "from 'tuikit-atomicx-vue3'",
      // Destructures the reactive state alongside the function.
      'useLiveListState()',
      // Actually calls the API (with await, since it's async).
      'await fetchLiveList',
      // Teaches the caller to READ from the reactive state — the
      // point that was missing when the demo showed a synthetic
      // "Output" object as if it were the return value.
      'liveList',
    ];
    const missing = requiredFragments.filter(f => !snippet.includes(f));
    expect(
      missing,
      missing.length > 0
        ? `\nfetchLiveList snippet is missing essential fragments a copy-paster needs:\n`
          + missing.map(f => '  - ' + JSON.stringify(f)).join('\n')
          + '\nA snippet that only shows the call (`await fetchLiveList(...)`) but not '
          + 'how to CONSUME the resulting state is misleading — integrators end up '
          + 'writing `const list = await fetchLiveList(...)` and getting undefined.\n'
        : '',
    ).toEqual([]);

    // And equally: the phantom `category` must not appear.
    expect(
      snippet.includes('category'),
      'fetchLiveList snippet must not mention `category` — the SDK signature '
        + 'has no such parameter. Historic drift; see the test above for context.',
    ).toBe(false);
  });

  /**
   * Mental-model / gotcha content (cursor-is-a-token, count-vs-cumulative,
   * void-return) belongs in the folded `notes` panel — NOT in
   * `description` (scanned quickly, should stay one sentence), NOT in
   * `snippet` (code you copy-paste, prose comments dilute it), and NOT
   * in `field.help` (only visible while filling that one input).
   *
   * This test locks the placement in so a future edit that "just moves
   * the caveat back into description because it's easier" trips a
   * failure and forces a conversation about the information hierarchy
   * we already settled on.
   */
  it('fetchLiveList mental-model content lives in `notes`, not `description`', () => {
    const card = extractFetchLiveListCard();

    // Sentinel phrases that summarise the mental-model + gotchas.
    // Each was, at some point, drafted directly into `description`
    // before we agreed the folded `notes` panel was the right home.
    const MENTAL_MODEL_SENTINELS = [
      'side-effect',   // void return, data lives in reactive state
      'token',         // cursor semantics
      '累计',           // count-vs-cumulative gotcha
    ];

    // `description` is a single string literal on the card — grab it
    // and verify it stays a one-liner free of these sentinels.
    const descMatch = card.match(/description:\s*(?:'([^']*)'|"([^"]*)"|`([\s\S]*?)`|\n\s*'([^']*(?:'\s*\+\s*'[^']*)*)')/);
    // The description field uses a `'...' + '...'` concatenation
    // pattern in this file; capture the whole concatenated segment
    // instead of a single literal.
    const descBlockMatch = card.match(/description:\s*([\s\S]*?),\s*\n\s*signature:/);
    const desc = descBlockMatch ? descBlockMatch[1] : (descMatch ? (descMatch[1] || descMatch[2] || descMatch[3] || descMatch[4] || '') : '');

    const leaked = MENTAL_MODEL_SENTINELS.filter(s => desc.includes(s));
    expect(
      leaked,
      leaked.length > 0
        ? `\nfetchLiveList description has absorbed mental-model content it should not carry: ${leaked.join(', ')}.\n`
          + 'These caveats belong in the folded `notes` panel (same pattern as the\n'
          + 'joinLive LiveView notes). Description should stay a one-sentence summary\n'
          + 'so integrators scanning cards see the point without a wall of text.\n'
        : '',
    ).toEqual([]);

    // Positive check: the `notes` field exists and covers these
    // sentinels somewhere in its groups. If notes is missing, the
    // caveats have been quietly deleted — even worse than moving them
    // to description.
    expect(
      card.includes('notes:'),
      'fetchLiveList must declare a `notes` panel that carries the '
        + 'mental-model + gotcha content. Removing notes without moving the '
        + 'content anywhere else strips essential guidance from the card.',
    ).toBe(true);

    const missingFromNotes = MENTAL_MODEL_SENTINELS.filter(s => !card.includes(s));
    expect(
      missingFromNotes,
      missingFromNotes.length > 0
        ? '\nfetchLiveList `notes` no longer covers the essential mental-model sentinels: '
          + missingFromNotes.join(', ')
          + '.\nIf the SDK semantics genuinely changed, update MENTAL_MODEL_SENTINELS.\n'
          + 'Otherwise this is a regression that will re-open the confusion loop we\n'
          + 'already closed (cursor-as-page-number, `const list = await ...`).\n'
        : '',
    ).toEqual([]);
  });
});

/**
 * Contract tests for startLive's `seatTemplate` field — locks the
 * demo picker to the real `SeatLayoutTemplate` enum.
 *
 * ## Why a dedicated test for this specific field
 *
 * `seatTemplate` is the only field on `startLive` whose set of
 * legal values is a closed enum declared in a separate file
 * (`uikit-core/src/types/liveList.ts`). Two documentation surfaces
 * describe it side-by-side on the demo card:
 *   - the picker `options` array — what the operator can pick
 *   - the folded 使用须知 `notes` groups — what the docs claim
 *     the SDK supports
 *
 * These drifted before: the picker exposed 3 options while the
 * notes described 5, misleading integrators into thinking the
 * SDK only accepts a subset. This test pins both surfaces to the
 * enum and to each other so a future edit that hides an option
 * (or, worse, hides one from ONLY one surface) trips a failure at
 * PR time.
 */
describe('startLive seatTemplate stays aligned with SeatLayoutTemplate enum', () => {
  const LIVE_LIST_EXAMPLE = resolve(EXAMPLES, 'liveListState.ts');
  const LIVE_LIST_ENUM = resolve(CORE_TYPES, 'liveList.ts');
  const exampleSrc = readFileSync(LIVE_LIST_EXAMPLE, 'utf-8');
  const enumSrc = readFileSync(LIVE_LIST_ENUM, 'utf-8');

  /** Extract the SeatLayoutTemplate enum member names in declaration order. */
  function extractEnumMembers(): string[] {
    const bodyIdx = enumSrc.indexOf('enum SeatLayoutTemplate');
    if (bodyIdx < 0) return [];
    const braceStart = enumSrc.indexOf('{', bodyIdx);
    const braceEnd = enumSrc.indexOf('}', braceStart);
    const body = enumSrc.slice(braceStart + 1, braceEnd);
    const names: string[] = [];
    const re = /^\s*([A-Za-z_]\w*)\s*=/gm;
    let m: RegExpExecArray | null;
    while ((m = re.exec(body)) !== null) {
      names.push(m[1]);
    }
    return names;
  }

  /** Extract the startLive card block (same slicing shape as fetchLiveList). */
  function extractStartLiveCard(): string {
    const idx = exampleSrc.indexOf("id: 'live-list.startLive'");
    if (idx < 0) return '';
    const tail = exampleSrc.slice(idx);
    const nextIdMatch = tail.slice(1).match(/id:\s*'live-list\./);
    const end = nextIdMatch ? (nextIdMatch.index || 0) + 1 : tail.length;
    return tail.slice(0, end);
  }

  /**
   * Extract the seatTemplate field's `options: [ ... ]` block via
   * bracket matching. Regex alone can't handle nested objects
   * reliably, but the file's options entries are shallow so a
   * simple depth counter suffices.
   */
  function pickerOptionsBlock(card: string): string {
    const start = card.indexOf("key: 'seatTemplate'");
    if (start < 0) return '';
    const optionsIdx = card.indexOf('options: [', start);
    if (optionsIdx < 0) return '';
    const openIdx = card.indexOf('[', optionsIdx);
    let depth = 0;
    for (let i = openIdx; i < card.length; i++) {
      if (card[i] === '[') depth++;
      else if (card[i] === ']') {
        depth--;
        if (depth === 0) {
          return card.slice(openIdx, i + 1);
        }
      }
    }
    return '';
  }

  /** Extract the `notes: { ... }` block via brace matching. */
  function notesBlock(card: string): string {
    const notesIdx = card.indexOf('notes:');
    if (notesIdx < 0) return '';
    const braceIdx = card.indexOf('{', notesIdx);
    let depth = 0;
    for (let i = braceIdx; i < card.length; i++) {
      if (card[i] === '{') depth++;
      else if (card[i] === '}') {
        depth--;
        if (depth === 0) {
          return card.slice(braceIdx, i + 1);
        }
      }
    }
    return '';
  }

  it('picker offers every member of SeatLayoutTemplate', () => {
    const enumNames = extractEnumMembers();
    expect(
      enumNames.length,
      'SeatLayoutTemplate enum parse produced no members — the parser or the enum file moved',
    ).toBeGreaterThan(0);

    const options = pickerOptionsBlock(extractStartLiveCard());
    expect(options, 'startLive card must declare a seatTemplate options array').not.toBe('');

    const missing = enumNames.filter(n => !options.includes(`SeatLayoutTemplate.${n}`));
    expect(
      missing,
      missing.length > 0
        ? '\nstartLive seatTemplate picker is missing these enum members: '
          + missing.join(', ')
          + '.\nEvery SeatLayoutTemplate value is a legal argument to the SDK;\n'
          + 'hiding one from the picker misleads integrators into thinking\n'
          + 'only a subset is accepted. If a value is truly unsupported, remove\n'
          + 'it from the enum in uikit-core first.\n'
        : '',
    ).toEqual([]);
  });

  it('every picker option carries a meta subtitle (the reason pretty-select exists)', () => {
    const options = pickerOptionsBlock(extractStartLiveCard());
    const labelCount = (options.match(/\blabel:\s*'/g) || []).length;
    const metaCount = (options.match(/\bmeta:\s*'/g) || []).length;
    expect(labelCount).toBeGreaterThan(0);
    expect(
      metaCount === labelCount,
      `seatTemplate picker has ${labelCount} options but only ${metaCount} meta lines. `
        + 'pretty-select exists specifically to render a two-line subtitle for '
        + 'each option; skipping meta anywhere regresses back to native <select> '
        + 'ergonomics for that row.',
    ).toBe(true);
  });

  /**
   * 使用须知 is deliberately NOT a rewording of the picker.
   *
   * Earlier drafts of this file duplicated every template into a
   * "5 个可选模板" prose list inside the notes — but the picker
   * already renders label + meta for each option, so the prose list
   * added nothing. Notes now carry ONLY the invariants that a
   * picker cannot express: one-shot room-creation semantics,
   * undefined-parameter behaviour, and enum-constant discipline.
   *
   * These test the presence of those invariants via sentinel words.
   * If a maintainer accidentally deletes the notes panel, or
   * regresses back to "let me just list the templates here", the
   * sentinels stop matching and this fails loudly.
   */
  it('使用须知 covers the invariants a picker cannot express', () => {
    const notes = notesBlock(extractStartLiveCard());
    expect(notes, 'startLive must declare a `notes` panel').not.toBe('');

    // Each sentinel word maps to one invariant:
    //   endLive       — "one-shot; must destroy the room to change"
    //   跳过           — "unset seatTemplate causes SDK to skip config"
    //   枚举常量        — "use enum, never hardcode numeric IDs"
    // Chinese/English mix mirrors how the invariants are written in
    // the source. Update alongside the notes if the wording shifts.
    const INVARIANT_SENTINELS = ['endLive', '跳过', '枚举常量'];
    const missing = INVARIANT_SENTINELS.filter(s => !notes.includes(s));
    expect(
      missing,
      missing.length > 0
        ? '\nstartLive 使用须知 is missing invariant sentinels: '
          + missing.join(', ')
          + '.\nThe notes exist to carry information the picker cannot\n'
          + 'express (lifecycle, undefined semantics, enum discipline).\n'
          + 'If the wording changed, update INVARIANT_SENTINELS here.\n'
          + 'If the content was outright removed, that IS a regression —\n'
          + 'the picker alone does not teach integrators these three rules.\n'
        : '',
    ).toEqual([]);
  });

  /**
   * Guardrail against the deleted duplication returning.
   *
   * The picker already lists all 5 templates with descriptive meta;
   * the notes should NOT re-enumerate them (was the "5 个可选模板"
   * group we removed after user feedback). This test flags a
   * regression if someone adds prose that names 3 or more enum
   * members inside the notes — the classic shape of "let me just
   * copy the template list here".
   */
  it('使用须知 does NOT re-list every template (picker is the SoT)', () => {
    const enumNames = extractEnumMembers();
    const notes = notesBlock(extractStartLiveCard());
    const listed = enumNames.filter(n => notes.includes(n));
    expect(
      listed.length < 3,
      `startLive 使用须知 names ${listed.length} enum members (${listed.join(', ')}).\n`
        + 'That is the shape of the "5 个可选模板" prose list we removed —\n'
        + 'the picker\'s label + meta already documents every template, so\n'
        + 'the notes duplicating that list adds no signal. Keep the notes\n'
        + 'focused on invariants a picker cannot express (lifecycle, unset\n'
        + 'semantics, enum discipline). Mentioning 1–2 members as examples\n'
        + '(e.g. VideoLandscape4Seats as the fallback) is fine.\n',
    ).toBe(true);
  });
});

/**
 * Contract: `session.role` MUST be derived from live SDK state, not a
 * hardcoded / user-picked value.
 *
 * Prevents a regression where somebody re-adds a role picker (e.g.
 * to "debug faster") and quietly reintroduces the mental-model bug
 * the derivation was meant to fix ("I say I'm host, but I never
 * called startLive"). Enforced at the source-text level because
 * running the reactive derivation would require a full SDK bootstrap
 * inside vitest, which the coverage suite deliberately avoids.
 */
describe('Role is derived from SDK state (never user-picked)', () => {
  const DERIVED_ROLE = resolve(here, '../src/services/session/derivedRole.ts');
  const SESSION = resolve(here, '../src/services/session/session.ts');
  const ROLE_SWITCHER = resolve(here, '../src/services/session/RoleSwitcher.vue');
  const FACADE = resolve(here, '../src/services/sdk-source/facade.ts');
  const APP = resolve(here, '../src/app/App.vue');

  it('derivedRole.ts reads role signals from the SDK (not a stub)', () => {
    const src = readFileSync(DERIVED_ROLE, 'utf-8');
    const requiredSignals = [
      // Room hook — used for host detection (currentLive.liveOwner)
      // and room-in/out transitions.
      'useLiveListState',
      // Direct engine handle — used to subscribe to the lowest-level
      // event stream for self-role changes.
      'useRoomEngine',
      // Runtime enum comparison — no hardcoded numeric literal for
      // TUIRole.kAdministrator (the pre-refactor code used `=== 1`,
      // which silently mis-classifies if the enum ever renumbers).
      'TUIRole.kAdministrator',
      // The bottom-most event the derivation subscribes to. Firing
      // for every user (INCLUDING self) inside the current room, it
      // is the reliable signal for admin promotions of self.
      'TUIRoomEvents.onUserInfoChanged',
      // Room fields the host branch reads.
      'currentLive',
      'liveOwner',
    ];
    const missing = requiredSignals.filter(s => !src.includes(s));
    expect(
      missing,
      `derivedRole.ts is missing SDK-derivation signals: ${missing.join(', ')}.\n`
        + 'If you replaced the SDK read with a hardcoded / prop-driven value,\n'
        + 'you re-introduced the "self-declared costume" bug where the badge\n'
        + 'has no relationship to real SDK state. The derivation must read\n'
        + 'currentLive.liveOwner (host) and TUIRoomEvents.onUserInfoChanged\n'
        + 'filtered by userId === self (admin) — anything else is not the fix.\n',
    ).toEqual([]);
  });

  it('session.role defaults to "unassigned" (not "audience")', () => {
    const src = readFileSync(SESSION, 'utf-8');
    // The reactive session object initialises `role: 'unassigned'`.
    // Regex tolerates whitespace / trailing comma but pins the literal.
    expect(
      /role:\s*'unassigned'/.test(src),
      'session.ts initialises `role` to something other than \'unassigned\'.\n'
        + 'A role only exists once the user is in a live room — before\n'
        + '`startLive`/`joinLive` there is no room to be a role in. Pre-\n'
        + 'derivation defaults must be `unassigned` so the badge accurately\n'
        + 'reflects "not in any room yet"; defaulting to `audience` would\n'
        + 'silently claim a role the user has not yet acquired.\n',
    ).toBe(true);
  });

  it('RoleSwitcher.vue never emits update:modelValue (badge is read-only)', () => {
    const src = readFileSync(ROLE_SWITCHER, 'utf-8');
    // Two paths that would break "role is derived":
    //   - `defineEmits(...update:modelValue...)` declaration
    //   - `$emit('update:modelValue', ...)` runtime dispatch
    // Both must be absent. The role badge is a display of SDK state,
    // not a form control the operator writes to.
    const hasEmitDecl = /defineEmits[^)]*update:modelValue/.test(src);
    const hasEmitDispatch = /\$emit\(\s*['"]update:modelValue['"]/.test(src)
      || /emit\(\s*['"]update:modelValue['"]/.test(src);
    expect(
      !hasEmitDecl && !hasEmitDispatch,
      'RoleSwitcher.vue emits `update:modelValue`, meaning the operator\n'
        + 'can write back into `session.role`. That defeats the derivation:\n'
        + '`session.role` is written by a watchEffect in derivedRole.ts and\n'
        + 'reflects live SDK state; a v-model write would either be\n'
        + 'immediately overwritten on the next SDK tick (visually a race)\n'
        + 'or, worse, drift out of sync until the next `currentLive`/\n'
        + '`audienceList` change fires. The badge MUST be read-only.\n',
    ).toBe(true);
  });

  it('facade.ts exposes TUIRole and TUIRoomEvents via lazy proxy', () => {
    const src = readFileSync(FACADE, 'utf-8');
    // Both runtime enums must be re-exported through `makeLazyProxy`
    // — direct import from `@tencentcloud/tuiroom-engine-js` would
    // evaluate before main.ts installs `__ATOMICX_SDK__` in prod.
    // The proxy defers property access until first read, keeping
    // timing safe.
    //
    // `TUIRole` powers the admin comparison; `TUIRoomEvents` powers
    // the `onUserInfoChanged` subscription that captures self-role
    // changes. Both must be present or the derivation can't build.
    const proxied = ['TUIRole', 'TUIRoomEvents'];
    const missing = proxied.filter(name =>
      !new RegExp(
        `export\\s+const\\s+${name}[^=]*=\\s*makeLazyProxy\\(\\s*['"]${name}['"]`,
      ).test(src),
    );
    expect(
      missing,
      `facade.ts does NOT expose ${missing.join(', ')} via makeLazyProxy.\n`
        + '`derivedRole.ts` needs both:\n'
        + '  - TUIRole.kAdministrator to compare against userInfo.userRole\n'
        + '    without hardcoding the numeric constant.\n'
        + '  - TUIRoomEvents.onUserInfoChanged as the subscription key\n'
        + '    on the underlying room engine.\n'
        + 'In prod (esm.sh + facade alias), both must go through the lazy\n'
        + 'proxy so property access happens after main.ts finishes\n'
        + 'installing `__ATOMICX_SDK__` — direct imports would evaluate\n'
        + 'too early and throw.\n',
    ).toEqual([]);
  });

  it('App.vue installs the derivation exactly once, via installDerivedRole', () => {
    const src = readFileSync(APP, 'utf-8');
    // Two things must be true at once:
    //   - `installDerivedRole` is imported from the module of record.
    //   - It is CALLED from setup, not merely imported (an unused
    //     import would silently disable the whole derivation).
    const imported = /import\s*\{[^}]*installDerivedRole[^}]*\}\s*from\s*['"]\.\.\/services\/session\/derivedRole['"]/
      .test(src);
    const invoked = /installDerivedRole\s*\(\s*\)/.test(src);
    expect(
      imported && invoked,
      'App.vue does not both import AND invoke installDerivedRole().\n'
        + 'The derivation module is self-contained but inert until called:\n'
        + 'the `watchEffect` writing back to `session.role`, the\n'
        + '`TUIRoomEvents.onUserInfoChanged` subscription for self-role\n'
        + 'detection, and the room-leave cleanup watch are ALL registered\n'
        + 'only inside `installDerivedRole()`. Dropping the invocation\n'
        + 'would silently leave `session.role` frozen at its initial\n'
        + 'value (`unassigned`) forever, even after startLive.\n',
    ).toBe(true);
  });
});

/**
 * Contract: `derivedRole.ts` must subscribe to
 * `TUIRoomEvents.onUserInfoChanged` on the underlying room engine to
 * capture self-role transitions.
 *
 * Background — why the room engine, not `useLiveAudienceState`:
 *   - `useLiveAudienceState().audienceList` is populated by
 *     `onRemoteUserEnterRoom` which never adds self, and by
 *     `fetchAudienceList()` which requires an explicit call.
 *   - The room engine's raw `onUserInfoChanged` fires for EVERY
 *     user (including self) inside the current room. Filtering
 *     `userInfo.userId === me` yields exactly the self-role
 *     transitions we need, with zero network requests and no
 *     dependency on higher-level cache seeding.
 */
describe('Self-admin detection via TUIRoomEvents.onUserInfoChanged', () => {
  const DERIVED_ROLE = resolve(here, '../src/services/session/derivedRole.ts');

  it('derivedRole.ts binds onUserInfoChanged on the room engine instance', () => {
    const src = readFileSync(DERIVED_ROLE, 'utf-8');
    const requiredMoves = [
      // Direct engine handle instead of going through a higher-level
      // hook — required for `instance.on(...)` binding.
      'useRoomEngine',
      // The engine object gets its `.instance` filled asynchronously
      // by the SDK's own `TUIRoomEngine.once('ready', ...)` handler.
      // A `watch(() => roomEngine.instance, ...)` binds the listener
      // the moment `.instance` transitions from null to a real
      // TUIRoomEngine.
      'roomEngine.instance',
      // The actual subscription call.
      'TUIRoomEvents.onUserInfoChanged',
      // Must filter to self — otherwise every other user's info
      // change would clobber the local mirror.
      'session.userId',
    ];
    const missing = requiredMoves.filter(s => !src.includes(s));
    expect(
      missing,
      `derivedRole.ts is missing self-role subscription moves: ${missing.join(', ')}.\n`
        + 'Without subscribing to the room engine\'s `onUserInfoChanged`\n'
        + 'and filtering by `userInfo.userId === session.userId`, there is\n'
        + 'no path for self-role transitions to update the local mirror —\n'
        + 'being promoted via `setAdministrator` would be invisible in the\n'
        + 'promoted user\'s own tab. Restore the `useRoomEngine()` +\n'
        + '`watch(roomEngine.instance, ...)` binding of\n'
        + '`TUIRoomEvents.onUserInfoChanged`.\n',
    ).toEqual([]);
  });
});

