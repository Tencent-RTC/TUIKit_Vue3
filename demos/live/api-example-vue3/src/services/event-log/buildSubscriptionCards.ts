import type { DemoHandlerToggle } from './useDemoHandlerToggle';
import type { ExampleDef } from '../../lib/types';
import { ALL_ROLES } from '../../lib/types';

/**
 * Build the standard pair of `subscribeEvent` / `unsubscribeEvent` cards for
 * a state group.
 *
 * Every state hook ends up needing the exact same two cards:
 *   - subscribeEvent: recovery action — re-subscribes a previously cancelled
 *     demo handler, or no-op when already on.
 *   - unsubscribeEvent: primary action — cancels the demo handler for a
 *     chosen event (or all events).
 *
 * Centralizing the spec here keeps every group's wording / role-set /
 * select-options consistent, and means the contract `successToast: false`
 * (state-readout style) is enforced uniformly.
 *
 * The cards push `[demo] <event>` log rows so the operator can see the
 * delta against the always-on log subscription installed by
 * `useEventLogSubscription`. See `useDemoHandlerToggle.ts` for rationale.
 */
interface BuildSubscriptionCardsOptions {
  /** Group slug, e.g. `live-barrage`. Used in card ids. */
  groupSlug: string;
  /**
   * The state hook name shown in snippets, e.g. `useBarrageState`. MUST be
   * the real exported identifier.
   *
   * We take an explicit string instead of deriving it from `hookFn.name`
   * because the published `tuikit-atomicx-vue3` bundle is minified: a hook
   * declared as `function H()` and re-exported as `useBarrageState` keeps
   * `H` as its `.name` at runtime, so `hookFn.name` would render the
   * mangled internal identifier (`H` / `f` / ...) in the snippet — a symbol
   * that is NOT exported from `tuikit-atomicx-vue3` and would mislead
   * integrators. Passing the literal export name avoids that entirely.
   */
  hookName: string;
  /**
   * The event-enum TYPE expression used in the `signature` line and prose,
   * e.g. `BarrageEvent` or, for groups that accept a union, `HostEvent | GuestEvent`.
   *
   * This is a type expression only — it is NOT used as a value, so a union is
   * fine here. For the actual identifiers that must be imported / dereferenced
   * in the snippet, see `eventEnumImports`.
   */
  eventEnumName: string;
  /**
   * The concrete event-enum identifiers to import and use as the base for the
   * example `Enum.member` qualifier in the snippet, e.g. `['BarrageEvent']` or
   * `['HostEvent', 'GuestEvent']`.
   *
   * Defaults to `[eventEnumName]`, which is correct for single-enum groups.
   * Groups whose `eventEnumName` is a union (e.g. CoGuest's `HostEvent | GuestEvent`)
   * MUST pass this, because a union cannot be imported as a value nor
   * dereferenced (`HostEvent | GuestEvent.onX` is invalid syntax).
   *
   * The first entry is used as the qualifier base for the example call; it must
   * therefore be the enum that owns `toggle.events[0]`.
   */
  eventEnumImports?: string[];
  /** The demo handler toggle returned by `useDemoHandlerToggle`. */
  toggle: DemoHandlerToggle;
  /**
   * Optional: example callback name used in snippets (purely cosmetic).
   * Defaults to `handler`.
   */
  snippetHandlerName?: string;
}

/**
 * Special select value meaning "operate on every event in the enum".
 * Empty string so the default option is visually distinct from real events
 * (which all have non-empty string names).
 */
const ALL_EVENTS_SENTINEL = '';

function buildSubscriptionCards(opts: BuildSubscriptionCardsOptions): ExampleDef[] {
  const {
    groupSlug,
    hookName,
    eventEnumName,
    eventEnumImports,
    toggle,
    snippetHandlerName = 'handler',
  } = opts;

  if (!hookName) {
    // Caught at module-eval time so a bad refactor surfaces in the manifest
    // factory rather than silently producing snippets with `().` in them.
    throw new Error(
      `[buildSubscriptionCards] group "${groupSlug}": hookName is required.`,
    );
  }

  // Concrete enum identifiers imported / dereferenced in the snippet. Defaults
  // to the single-enum case; union groups (CoGuest) pass an explicit list.
  const enumImports = eventEnumImports ?? [eventEnumName];
  // `Enum.member` qualifier for the example call. The first import must be the
  // enum that owns `toggle.events[0]` — true by construction (the toggle
  // spreads enums in the same order the caller lists them here).
  const exampleEventQualifier = `${enumImports[0]}.${toggle.events[0] ?? 'XXX'}`;

  /**
   * Resolve the select dropdown options. Re-evaluated on each render so
   * future state changes (e.g. event enum extensions) appear immediately
   * without rebuilding the example group.
   */
  const eventSelectOptions = () => [
    { label: '(all events)', value: ALL_EVENTS_SENTINEL },
    ...toggle.events.map(event => ({ label: event, value: event })),
  ];

  /**
   * Compact snapshot of the demo handler subscription state.
   *
   * Earlier revisions returned the full `subscribed: { onX: true, onY: ... }`
   * boolean map, which produced a 13-line Output panel for CoGuest (HostEvent
   * + GuestEvent union) — visually noisy because the "happy path" is
   * "everything subscribed".
   *
   * Instead we surface:
   *   - `activeCount` / `totalEvents`: high-level counters;
   *   - `unsubscribed`: only events currently OFF (the actionable delta).
   *
   * Steady state: `unsubscribed: []` — a single line. Cancelled events show
   * up as a short list pointing the operator at which subscriptions are
   * "missing" from the demo handler set.
   */
  const snapshot = () => {
    const unsubscribed: string[] = [];
    let activeCount = 0;
    for (const event of toggle.events) {
      if (toggle.state.subscribed[event]) {
        activeCount++;
      } else {
        unsubscribed.push(event);
      }
    }
    return {
      activeCount,
      totalEvents: toggle.events.length,
      unsubscribed,
    };
  };

  const subscribeCard: ExampleDef = {
    id: `${groupSlug}.subscribeEvent`,
    api: 'subscribeEvent',
    title: '订阅事件（默认全订阅，可恢复被取消的事件）',
    description:
      `本组挂载时已默认订阅 ${eventEnumName} 全部事件（演示 handler；带 \`[demo]<事件名>\` 前缀的日志行）。` +
      '若被下方 unsubscribeEvent 卡片取消，可在此选择"全部"或单个事件重新订阅；' +
      '若该事件已在订阅中，本次调用是幂等空操作。',
    signature: `subscribeEvent<T extends ${eventEnumName}>(event: T, callback: (info) => void): void`,
    roles: ALL_ROLES,
    requireLogin: false,
    events: [...toggle.events],
    // Snapshot-style — Output panel already reflects the subscribed map.
    successToast: {
      title: '已订阅',
      description: '该事件下次触发时，EventLog 会同时出现 "[demo]" 前缀的日志行',
    },
    fields: [
      {
        key: 'event',
        label: 'event',
        type: 'pretty-select',
        default: ALL_EVENTS_SENTINEL,
        options: eventSelectOptions,
        help: '选 (all events) 表示对全部事件批量订阅',
      },
    ],
    run: ({ inputs }) => {
      const event = String(inputs.event ?? ALL_EVENTS_SENTINEL);
      if (event === ALL_EVENTS_SENTINEL) {
        toggle.subscribeAll();
        return { scope: 'all', ...snapshot() };
      }
      toggle.subscribeOne(event);
      return { scope: 'one', event, ...snapshot() };
    },
    snippet: `import { ${hookName}, ${enumImports.join(', ')} } from 'tuikit-atomicx-vue3';

const { subscribeEvent, unsubscribeEvent } = ${hookName}();
const ${snippetHandlerName} = (info: unknown) => { /* ... */ };

// subscribeEvent / unsubscribeEvent must pass the SAME handler reference to unsubscribe correctly.
subscribeEvent(${exampleEventQualifier}, ${snippetHandlerName});

// Cancel the subscription when the feature goes offline (see the unsubscribeEvent card).
unsubscribeEvent(${exampleEventQualifier}, ${snippetHandlerName});`,
  };

  const unsubscribeCard: ExampleDef = {
    id: `${groupSlug}.unsubscribeEvent`,
    api: 'unsubscribeEvent',
    title: '取消订阅事件（单个或全部）',
    description:
      `从 ${eventEnumName} 中取消订阅一个或全部事件。取消后该事件再次触发时，` +
      'EventLog 里 "[demo] xxx" 前缀的日志行不再出现（不带前缀的常规事件行仍由站点的常驻日志订阅捕获）。' +
      // NB: description is rendered as plain text (`{{ example.description }}`
      // in ExampleCard.vue). Do NOT use markdown syntax like `**bold**` here —
      // the `**` would leak through verbatim. Use Chinese 「…」 (or full-width
      // quotes) when you need visual emphasis in a description string.
      '⚠️ 真实业务中调用必须传与 subscribeEvent 时「完全相同」的 handler 引用，' +
      '否则 SDK 会查找不到并静默失败。',
    signature: `unsubscribeEvent<T extends ${eventEnumName}>(event: T, callback: (info) => void): void`,
    roles: ALL_ROLES,
    requireLogin: false,
    events: [...toggle.events],
    successToast: {
      title: '已取消订阅',
      description: '该事件下次触发时，EventLog 不再出现 "[demo]" 前缀的日志行',
    },
    fields: [
      {
        key: 'event',
        label: 'event',
        type: 'pretty-select',
        default: ALL_EVENTS_SENTINEL,
        options: eventSelectOptions,
        help: '选 (all events) 表示对全部事件批量取消订阅',
      },
    ],
    run: ({ inputs }) => {
      const event = String(inputs.event ?? ALL_EVENTS_SENTINEL);
      if (event === ALL_EVENTS_SENTINEL) {
        toggle.unsubscribeAll();
        return { scope: 'all', ...snapshot() };
      }
      toggle.unsubscribeOne(event);
      return { scope: 'one', event, ...snapshot() };
    },
    snippet: `import { ${hookName}, ${enumImports.join(', ')} } from 'tuikit-atomicx-vue3';

const { subscribeEvent, unsubscribeEvent } = ${hookName}();
const ${snippetHandlerName} = (info: unknown) => { /* ... */ };

subscribeEvent(${exampleEventQualifier}, ${snippetHandlerName});

// Must pass the same handler reference used for subscribeEvent.
unsubscribeEvent(${exampleEventQualifier}, ${snippetHandlerName});`,
  };

  return [subscribeCard, unsubscribeCard];
}

// ---------------------------------------------------------------------------
// Public surface (single re-export point per project convention).
// ---------------------------------------------------------------------------

export { buildSubscriptionCards };
