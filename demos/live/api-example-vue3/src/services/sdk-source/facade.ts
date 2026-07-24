/**
 * Demo-side facade for `tuikit-atomicx-vue3`.
 *
 * Big picture (see doc/tech-design/icebergfeng/api-example-vue3-prod-sdk-switching.md §6.2):
 *
 *   In **dev**, this file is unused — vite's `resolve.alias` is configured
 *   to leave `import 'tuikit-atomicx-vue3'` pointing at the real package
 *   (workspace symlink or vendor copy). Demo code keeps `import { ... }
 *   from 'tuikit-atomicx-vue3'` and gets the standard static-import
 *   behaviour with full IDE support and source-map debugging.
 *
 *   In **prod**, vite's alias swaps `tuikit-atomicx-vue3` →
 *   this facade file. Every named import the demo writes resolves
 *   here at bundle time:
 *
 *       // demo source — unchanged across dev/prod
 *       import { useLiveListState } from 'tuikit-atomicx-vue3';
 *
 *       // after vite alias in prod:
 *       import { useLiveListState } from '<path-to-this-file>';
 *
 *   This file's `export const useLiveListState = ...` simply forwards
 *   to `window.__ATOMICX_SDK__.useLiveListState`, which `main.ts`
 *   populates *before* mounting the Vue app (and therefore before any
 *   component that imports from `tuikit-atomicx-vue3` has its setup
 *   function called).
 *
 * Why a facade module instead of an importmap entry for the SDK:
 *
 *   We considered routing `tuikit-atomicx-vue3` through the prod-mode
 *   importmap directly (`"tuikit-atomicx-vue3": "https://esm.sh/..."`).
 *   That approach forces every demo file to be split-compatible
 *   with the SDK's network availability — i.e. the demo can't render
 *   ANY component or run ANY business code until the SDK has been
 *   fetched, because rollup hoists all static imports above any
 *   user-controlled code in the entry chunk.
 *
 *   With the facade approach, `main.ts` performs the dynamic SDK
 *   load explicitly (`await import('https://esm.sh/...')`), and we
 *   can render a recovery overlay if it fails before the demo's app
 *   is even instantiated. Demo source code stays synchronously
 *   static-imported throughout.
 *
 * Type fidelity:
 *
 *   We `import type { ... }` from `tuikit-atomicx-vue3` at the top of
 *   this file so TypeScript can resolve the same types it would have
 *   in dev. Type-only imports are erased at runtime — they don't
 *   produce ESM `import` statements in the emitted bundle. So this
 *   block contributes zero bytes to prod runtime.
 *
 *   The downside: in prod the demo is type-checked against the SDK
 *   version installed at build time (vendor/workspace), not against
 *   the version the user selects at runtime. For an API-Example
 *   site that's an acceptable trade-off — most published SDK
 *   versions present compatible type surfaces; the demo's role is
 *   to surface "did this version still expose this API" failures at
 *   runtime via the SDK source picker / fatal overlay, not at
 *   compile time.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
//
// Note on type re-exports
// =======================
// Demo code does `import { ..., type LiveListEventInfo } from
// 'tuikit-atomicx-vue3'`. In dev, vite's alias is NOT installed —
// demo files resolve `'tuikit-atomicx-vue3'` directly to the
// workspace/vendor SDK; this facade file is never imported. In
// build, vite's alias points `'tuikit-atomicx-vue3'` at THIS file,
// so we must re-export the type names downstream demo code expects.
//
// The `import type` below is safe even though we then re-alias the
// same package name at build time:
//   - `import type` is erased at compile time, so no runtime import
//     ever materialises.
//   - TypeScript's module resolution honours `tsconfig.json#paths`
//     and `node_modules`, NOT vite's `resolve.alias`. The two
//     resolvers are independent; tsconfig has no paths mapping
//     for `tuikit-atomicx-vue3`, so TS sees the real SDK's type
//     declarations from node_modules and no self-import loop
//     occurs at the type level.
//   - The vite build alias kicks in for runtime resolution only,
//     and type-only specifiers don't reach that pipeline because
//     `@vitejs/plugin-vue` + `vite:esbuild` strip them during
//     transformation.
//
import type {
  LiveListEventInfo,
  Resolution,
  Barrage,
  UpdateLiveInfoParams,
} from 'tuikit-atomicx-vue3';

/**
 * Shape of the runtime SDK namespace published by `main.ts` onto
 * `window.__ATOMICX_SDK__`. We type it as `any` here on purpose:
 * - Each demo file casts the specific export it consumes through
 *   its own `import { ... }` from this facade, so callers get the
 *   right shape from the actual `tuikit-atomicx-vue3` type
 *   declarations.
 * - Avoiding a strict type at the facade boundary lets us forward
 *   any newly-added SDK export without touching this file.
 */
interface SdkNamespace {
  [key: string]: any;
}

/**
 * Cache the SDK namespace after the first successful read.
 *
 * Each named export below resolves through `readSdk()` on every
 * call, and enum proxies traverse `readSdk()` per property access.
 * Even though a single `globalThis.__ATOMICX_SDK__` read is cheap,
 * caching turns the hot path into a single typeof check and a
 * stored-pointer dereference — visually negligible but logically
 * correct: the SDK namespace cannot change post-mount without a
 * full page reload, so it's safe to cache for the rest of the page
 * lifetime.
 */
let sdkCache: SdkNamespace | null = null;

function readSdk(): SdkNamespace {
  if (sdkCache !== null) return sdkCache;
  const sdk = (globalThis as any).__ATOMICX_SDK__ as SdkNamespace | undefined;
  if (!sdk) {
    throw new Error(
      '[sdkFacade] window.__ATOMICX_SDK__ is not set. '
        + 'main.ts must finish bootstrapping the SDK before any module '
        + 'that imports from tuikit-atomicx-vue3 evaluates. '
        + '(Typical cause: a module-level static import in a top-level '
        + "side-effect path is evaluated before main.ts's dynamic SDK load completes.)",
    );
  }
  sdkCache = sdk;
  return sdk;
}

/**
 * NOTE: We use lazy getters (or, equivalently, runtime reads on each
 * access) rather than `export const X = sdk.X;` at module evaluation
 * time. Reason:
 *
 *   This file is evaluated as part of demo bundle parsing — vite
 *   may evaluate it eagerly when the chunk it lives in is loaded.
 *   That happens BEFORE `main.ts` has had a chance to set
 *   `window.__ATOMICX_SDK__`. Using lazy reads keeps the facade's
 *   side-effect-on-evaluate to "nothing", and the actual property
 *   read happens only when demo code calls `useLiveListState()`,
 *   which is always after `main.ts` has installed the SDK.
 *
 * The chosen idiom (`const X = (...args) => readSdk().X(...args)`)
 * works for hooks/factories. For value exports (enums / event
 * symbols / component types) we need a different shape — see the
 * `Proxy`-based exports further down.
 */

// ---------- Hooks (functions) ----------
//
// When a new state hook is added to `tuikit-atomicx-vue3`, append a
// matching line here. This list is what rollup's static import checker
// looks at during `pnpm build` — a missing entry produces:
//   "<hookName>" is not exported by "src/services/sdk-source/facade.ts"
// The list is deliberately explicit (rather than a wildcard `Proxy`
// forwarder) so IDE autocomplete + type re-exports below stay accurate.
export const useLoginState = (...args: any[]): any => readSdk().useLoginState(...args);
export const useLiveListState = (...args: any[]): any => readSdk().useLiveListState(...args);
export const useLiveSeatState = (...args: any[]): any => readSdk().useLiveSeatState(...args);
export const useLiveAudienceState = (...args: any[]): any => readSdk().useLiveAudienceState(...args);
export const useLivePlayerState = (...args: any[]): any => readSdk().useLivePlayerState(...args);
export const useCoGuestState = (...args: any[]): any => readSdk().useCoGuestState(...args);
export const useCoHostState = (...args: any[]): any => readSdk().useCoHostState(...args);
export const useBattleState = (...args: any[]): any => readSdk().useBattleState(...args);
export const useLiveGiftState = (...args: any[]): any => readSdk().useLiveGiftState(...args);
export const useBarrageState = (...args: any[]): any => readSdk().useBarrageState(...args);
export const useDeviceState = (...args: any[]): any => readSdk().useDeviceState(...args);
// `useRoomEngine` returns the shared `{ instance }` object holding the
// underlying TUIRoomEngine singleton. Used by `derivedRole.ts` to
// subscribe to `TUIRoomEvents.onUserInfoChanged` for self-role
// changes — see the "self-admin detection" section of that module.
export const useRoomEngine = (...args: any[]): any => readSdk().useRoomEngine(...args);
// `addI18n` registers demo locale resources into the SDK's i18n system.
// Called once from `i18n/index.ts` during app boot.
export const addI18n = (...args: any[]): any => readSdk().addI18n(...args);

// ---------- Enum-like value exports ----------
//
// These are *runtime values* that demo code typically references via
// member access (`LiveListEvent.onLiveStarted`). We expose them as
// `Proxy`-backed objects so accesses are forwarded lazily — same
// timing safety argument as hooks above.
//
// At read time we delegate to the actual SDK enum object. Method
// calls (`Object.keys`, `for...of`, etc.) work because the Proxy's
// `ownKeys` / `getOwnPropertyDescriptor` traps fall through to the
// underlying SDK enum.

function makeLazyProxy(memberName: string): any {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        const target = readSdk()[memberName];
        if (target == null) {
          throw new Error(
            `[sdkFacade] SDK does not expose "${memberName}". `
              + 'This SDK version may not support the API the demo is using.',
          );
        }
        return target[prop as keyof typeof target];
      },
      has(_target, prop) {
        const target = readSdk()[memberName];
        return target != null && prop in target;
      },
      ownKeys() {
        const target = readSdk()[memberName];
        return target != null ? Reflect.ownKeys(target) : [];
      },
      getOwnPropertyDescriptor(_target, prop) {
        const target = readSdk()[memberName];
        if (target == null) return undefined;
        return Object.getOwnPropertyDescriptor(target, prop);
      },
    },
  );
}

export const LiveListEvent: any = makeLazyProxy('LiveListEvent');
export const LoginEvent: any = makeLazyProxy('LoginEvent');
export const LoginStatus: any = makeLazyProxy('LoginStatus');
export const LiveSeatEvent: any = makeLazyProxy('LiveSeatEvent');
export const LiveAudienceEvent: any = makeLazyProxy('LiveAudienceEvent');
export const PlayerControlEvent: any = makeLazyProxy('PlayerControlEvent');
export const HostEvent: any = makeLazyProxy('HostEvent');
export const GuestEvent: any = makeLazyProxy('GuestEvent');
export const CoHostEvent: any = makeLazyProxy('CoHostEvent');
export const CoHostStatus: any = makeLazyProxy('CoHostStatus');
export const CoHostLayoutTemplate: any = makeLazyProxy('CoHostLayoutTemplate');
export const BattleEvent: any = makeLazyProxy('BattleEvent');
export const BattleEndedReason: any = makeLazyProxy('BattleEndedReason');
export const LiveGiftEvents: any = makeLazyProxy('LiveGiftEvents');
export const BarrageEvent: any = makeLazyProxy('BarrageEvent');
export const BarrageType: any = makeLazyProxy('BarrageType');
export const SeatLayoutTemplate: any = makeLazyProxy('SeatLayoutTemplate');
export const MoveSeatPolicy: any = makeLazyProxy('MoveSeatPolicy');
export const DeviceControlPolicy: any = makeLazyProxy('DeviceControlPolicy');
export const DeviceStatus: any = makeLazyProxy('DeviceStatus');
export const DeviceError: any = makeLazyProxy('DeviceError');
// Re-exported from `@tencentcloud/tuiroom-engine-js` at the SDK layer.
// Used by `services/session/derivedRole.ts` to identify admins in
// `audienceList[me].userRole` without hardcoding the numeric constant.
export const TUIRole: any = makeLazyProxy('TUIRole');
// Room-engine event enum. Also from `@tencentcloud/tuiroom-engine-js`,
// re-exported by the SDK. `derivedRole.ts` subscribes to
// `TUIRoomEvents.onUserInfoChanged` for self-role change detection —
// the only reliable path to know one's OWN role transitioning to
// admin (since the SDK's higher-level audience map does not track
// self in the general case).
export const TUIRoomEvents: any = makeLazyProxy('TUIRoomEvents');

// ---------- Vue components ----------
//
// `LiveView` is a Vue component (`setup` / `render` / props / name
// etc.). We expose it as a tiny functional component that resolves
// the real SDK component at render time and forwards everything
// (props / attrs / slots) into it via Vue's `h(...)` helper.
//
// Why a functional wrapper rather than:
//
//   1. Forwarding via a `Proxy<empty>`:
//      Vue's renderer inspects various component own-properties at
//      mount time (`__hmrId`, `__file`, ...). Generic property-
//      forwarding through a Proxy is fragile against future
//      internal checks; a real component definition is safer.
//
//   2. `defineAsyncComponent`:
//      Even with `delay: 0` and a synchronously-resolving loader,
//      Vue still queues the resolution through a microtask — the
//      first render produces a placeholder for one tick. A
//      functional component returns the children synchronously
//      and avoids that flicker.
//
//   3. Top-level `export const LiveView = readSdk().LiveView`:
//      Evaluated at facade module load time, which happens before
//      `main.ts` has installed `__ATOMICX_SDK__`. Would throw on
//      every prod page load.
//
// The wrapper pattern below is synchronous, zero-microtask, and
// stays defensive against the global not being set yet (it would
// only happen if some demo code imports LiveView before main.ts
// resolves the SDK — at which point we want a clear error
// message, which `readSdk()` provides).
import { h } from 'vue';

let cachedLiveView: any = null;
function getRealLiveView(): any {
  if (cachedLiveView !== null) return cachedLiveView;
  const Comp = readSdk().LiveView;
  if (!Comp) {
    throw new Error(
      '[sdkFacade] SDK does not expose "LiveView". '
        + 'This SDK version may not provide the live UI component.',
    );
  }
  cachedLiveView = Comp;
  return Comp;
}

export const LiveView: any = {
  // A `name` makes the component recognisable in vue-devtools and
  // in error messages.
  name: 'LiveViewFacade',
  // No `props` declaration on purpose: we forward every prop the
  // caller passes (including unknown ones) onto the real SDK
  // component. Vue's `setup` signature still gives us access to
  // `attrs` (everything the parent passed) and `slots`.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setup(_props: any, { attrs, slots }: { attrs: any; slots: any }) {
    const Comp = getRealLiveView();
    return () => h(Comp, attrs, slots);
  },
};

// ---------- Type re-exports ----------
//
// Pure type passthroughs. These get erased at runtime — they do NOT
// add any code to the prod bundle, and they ARE consumed by demo
// files (`import { ..., type LiveListEventInfo } from 'tuikit-atomicx-vue3'`).
//
// Adding a new type-only export is as cheap as appending a line here.

export type {
  LiveListEventInfo,
  Resolution,
  Barrage,
  UpdateLiveInfoParams,
};
