/**
 * Example manifest — auto-discovered via `import.meta.glob`.
 *
 * Adding a new example file (`xxxState.ts`) to `src/examples/` is the ONLY
 * step needed: the glob picks it up, `safeBuildGroup` wraps it, and the menu
 * renders it. No central registry to update.
 *
 * Each example file MUST export:
 *   - `meta`  — static `{ state, hook, title, category, source }` used as a
 *               fallback when the factory throws (missing SDK export).
 *   - `factory` — `() => ExampleGroup`, the actual example builder.
 *
 * MUST be called inside a component `setup`, because the factories
 * instantiate state hooks and register event subscriptions tied to the
 * component lifecycle.
 */

import type { ExampleGroup, GroupMeta } from '../lib/types';

interface ExampleModule {
  meta: GroupMeta;
  factory: () => ExampleGroup;
}

// Eager-glob every `*State.ts` in this directory. `index.ts` does NOT
// match the pattern, so it's naturally excluded.
const modules = import.meta.glob<ExampleModule>('./*State.ts', { eager: true });

/**
 * Scaffolded groups whose examples are planned for a later milestone.
 *
 * When non-empty, each entry appears in the menu as "Planned" so the full
 * matrix is visible, and the coverage test treats its declared APIs as
 * not-yet-covered. Empty state (all 6.x groups implemented) is the
 * happy path — leave the array in place so future new state hooks can
 * be scaffolded here first before their example file lands.
 */
const PENDING_GROUPS: ExampleGroup[] = [];

/**
 * Safe wrapper around an example factory. If the factory throws —
 * which happens when its module references an export the active
 * SDK build doesn't provide (the shim plugin returns a Proxy
 * sentinel; any property access on the sentinel throws) — we
 * return a SKELETON group with `disabledReason` set, instead of
 * crashing the entire manifest build.
 *
 * The error message includes the missing export name when we can
 * extract it from `__atomicxMissingExport` (the shim sentinel
 * stamps every error with the originating name). Falls back to the
 * raw message otherwise.
 *
 * The skeleton metadata comes from the example file's own `meta`
 * export — co-located with the factory, eliminating the old central
 * `FACTORY_SKELETONS` dict that duplicated the same data.
 */
function safeBuildGroup(meta: GroupMeta, factory: () => ExampleGroup): ExampleGroup {
  try {
    return factory();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Extract any "missing export X" name mentioned in the message;
    // gives the menu UI a chance to render a more pointed hint
    // ("missing SeatLayoutTemplate" vs. just "factory failed").
    const namesFromMessage: string[] = [];
    const re = /tuikit-atomicx-vue3 export "([^"]+)"/g;
    for (const m of message.matchAll(re)) {
      namesFromMessage.push(m[1]);
    }
    // eslint-disable-next-line no-console
    console.warn(`[manifest] group "${meta.state}" disabled: ${message}`);
    return {
      ...meta,
      examples: [],
      disabledReason: message,
      disabledMissingNames: namesFromMessage,
    };
  }
}

/**
 * Build the full example manifest.
 *
 * Each factory is wrapped in `safeBuildGroup` so a single broken group
 * (typically caused by a `$missing` sentinel thrown at module-top
 * level under an incompatible online SDK version) doesn't take down
 * the rest of the menu — the broken group becomes a greyed-out tile
 * with a "this group depends on missing SDK exports" placeholder.
 *
 * Note: `useLiveMonitorState` (6.10) is intentionally excluded from the
 * demo — it's an internal operations/moderation surface that is NOT part
 * of the SDK's public API contract. Leaving it out keeps the site's menu
 * aligned with what integrators can actually call.
 */
function useManifest(): ExampleGroup[] {
  const groups = Object.values(modules).map((mod) =>
    safeBuildGroup(mod.meta, mod.factory),
  );

  return [...groups, ...PENDING_GROUPS].sort((a, b) =>
    compareCategory(a.category, b.category),
  );
}

function compareCategory(a: string, b: string): number {
  const an = Number(a.replace('6.', ''));
  const bn = Number(b.replace('6.', ''));
  return an - bn;
}

// ---------------------------------------------------------------------------
// Public surface (single re-export point per project convention).
// ---------------------------------------------------------------------------

export { useManifest };
