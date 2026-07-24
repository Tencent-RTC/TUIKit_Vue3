import JSON5 from 'json5';
import {
  useLiveListState,
  LiveListEvent,
  SeatLayoutTemplate,
} from 'tuikit-atomicx-vue3';
import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';
import type { UpdateLiveInfoParams } from 'tuikit-atomicx-vue3';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useEventLogSubscription } from '../services/event-log/useSubscription';
import { useDemoHandlerToggle } from '../services/event-log/useDemoHandlerToggle';
import { buildSubscriptionCards } from '../services/event-log/buildSubscriptionCards';
import { session, cacheRoom, clearCachedRoom } from '../services/session/session';
import { pushToast } from '../services/toast/store';
import type { ExampleGroup, StateViewDef } from '../lib/types';
import { ALL_ROLES, Role } from '../lib/types';

/**
 * 6.1 useLiveListState —— live room lifecycle.
 *
 * Called inside App.vue setup so the hook runs in a component scope and the
 * event subscriptions can be cleaned up on unmount.
 */
function useLiveListExamples(): ExampleGroup {
  const live = useLiveListState();
  const { t } = useUIKit();

  // Always-on log subscription + toggleable demo-handler set for the
  // subscribeEvent / unsubscribeEvent cards.
  useEventLogSubscription('live-list', live, LiveListEvent);
  const demoToggle = useDemoHandlerToggle('live-list', live, LiveListEvent);

  const liveId = () => (String(session.liveId || '').trim());

  /** Compact snapshot for the state card's Output panel. */
  const snapshot = () => ({
    currentLive: live.currentLive.value
      ? {
        liveId: live.currentLive.value.liveId,
        liveName: live.currentLive.value.liveName,
        liveOwner: live.currentLive.value.liveOwner?.userId ?? '(empty)',
      }
      : null,
    liveListLength: live.liveList.value.length,
    liveListCursor: live.liveListCursor.value,
    liveList: live.liveList.value.slice(0, 5).map(item => ({
      liveId: item.liveId,
      liveName: item.liveName,
      liveOwner: item.liveOwner?.userId,
    })),
  });

  /** Humanized inspector schema for the `live-list.state` snapshot. */
  const liveListView: StateViewDef = {
    live: true,
    groups: [
      {
        title: 'Current live room',
        rows: [
          {
            key: 'currentLive',
            label: 'Current live room',
            kind: 'custom',
            format: (v, t) =>
              v && typeof v === 'object'
                ? `${String((v as Record<string, unknown>).liveName ?? '')} (${String((v as Record<string, unknown>).liveId ?? '')})`
                : t('State.Placeholder.NotInLive', '(not in a live room)'),
          },
        ],
      },
      {
        title: 'Live list',
        rows: [
          { key: 'liveListLength', label: 'Total list count', kind: 'count' },
          { key: 'liveListCursor', label: 'Pagination cursor', kind: 'text' },
          { key: 'liveList', label: 'First 5', kind: 'list', preview: 5 },
        ],
      },
    ],
  };

  return {
    state: 'live-list',
    hook: 'useLiveListState',
    title: 'Live room lifecycle',
    category: '6.1',
    source: 'LiveListState/index.ts',
    // G2 — currentLive is the global switch; no single card owns this
    // prerequisite, so state it once at the group level.
    // Scope: currentLive's own lifecycle; other groups' refs are NOT listed.
    intro: {
      summary: 'Live list & room enter/exit: directory query + start/join/leave/end live',
      groups: [
        {
          tone: 'must',
          head: 'Key points',
          items: [
            'The hook returns three refs: liveList (public live directory), liveListCursor (pagination token), currentLive (the live room you are currently in); their responsibilities differ — liveList is populated by fetchLiveList and is independent of whether you are in a room; only currentLive is established by startLive / joinLive.',
            'To tell "whether you are in a room", check whether currentLive.value?.liveId has a value — don\'t judge from currentLive.value truthiness alone: after your own leaveLive / endLive it becomes an empty object (still has a value); only when kicked or the room is dissolved does it become null.',
            'leaveLive and endLive are worlds apart: leaveLive just means you leave, the room stays online and others receive no end event; endLive (host) truly dissolves the room and everyone receives onLiveEnded.',
            'Both startLive / joinLive require "you are not currently in any room" (the SDK does not support starting/joining a live while already in a room); they auto-login for you when not logged in, but before entering a room please leaveLive / endLive first to return to the unassigned state.',
            'startLive / joinLive only change state, they don\'t render video: after entering, they only set currentLive.liveId to valid; the actual stream pulling is handled by the LiveView component. LiveView is a global singleton that auto-calls startPlayStream on mount to pull the room\'s streams into a fixed container (this demo mounts it persistently at the App level, controlled by currentLive.liveId for visibility). So "pull stream by default after entering" = LiveView auto-starts pulling once currentLive.liveId is ready; without a LiveView instance you only see the state change while the stage stays black.',
            'Pushing must actively open devices (the open* APIs): after the host (startLive) starts, they must actively call openLocalCamera / openLocalMicrophone to capture and push their own camera / microphone — only then do video and audio appear; the audience (joinLive) pulls the host\'s remote stream after entering and doesn\'t need to open devices themselves. Note: entering a room does NOT auto-open the camera / microphone — without calling open* the read is always Off (for the "latent On / immediate Off / pure device operation" details of the device switch, see the "Device Control" group).',
          ],
        },
        {
          tone: 'env',
          head: 'Quick start',
          items: [
            'For a quick experience: first fetchLiveList in this group to see the directory, then startLive (host) or joinLive (audience) to enter a room; only after that do other groups (device, PK, gift, etc.) have data.',
          ],
        },
      ],
    },
    examples: [
      {
        id: 'live-list.state',
        api: 'state',
        title: 'Read live list state (liveList / liveListCursor / currentLive)',
        description:
          'Reactive snapshot of liveList (live list) / liveListCursor (pagination cursor) / currentLive (current live room).',
        signature: 'liveList / liveListCursor / currentLive',
        roles: ALL_ROLES,
        requireLogin: false,
        events: [...Object.values(LiveListEvent)],
        // Humanized inspector schema (see `liveListView` above) replaces
        // the raw JSON dump for this card.
        stateView: liveListView,
        // Snapshot reads run on every render via watchEffect; toasting on
        // each tick would drown the screen in noise.
        successToast: false,
        // On card open, auto-pull the live list so the snapshot is already
        // populated without the operator manually running fetchLiveList first.
        // Fire-and-forget with catch: the call can throw if the SDK session
        // isn't ready yet, and a failed pre-pull is non-fatal (the list just
        // stays empty until a later manual pull).
        onActivate: () => {
          void live.fetchLiveList({ count: 20 }).catch(() => {});
        },
        // Documents the auto-pull above so operators understand why the list
        // is already filled on first open.
        notes: {
          summary: 'live-list.state · auto-pull on open',
          groups: [
            {
              tone: 'env',
              items: [
                'On opening this card, fetchLiveList({ count: 20 }) is auto-called to pull the latest live list into the reactive state liveList / liveListCursor — no need to click the fetchLiveList card manually. Results show in real time in the reactive-state panel above.',
              ],
            },
          ],
        },
        run: () => snapshot(),
        snippet: `import { useLiveListState } from 'tuikit-atomicx-vue3';

const { liveList, liveListCursor, currentLive } = useLiveListState();
// currentLive.value?.liveId is set after startLive / joinLive`,
      },
      {
        id: 'live-list.fetchLiveList',
        api: 'fetchLiveList',
        title: 'Pull live list',
        description:
          'Paginate the live list by cursor and write the result into the reactive state for consumption.',
        signature: 'fetchLiveList(params: { cursor?: string; count?: number }): Promise<void>',
        roles: ALL_ROLES,
        events: ['onLiveEnded', 'onKickedOutOfLive'],
        // Mental-model + gotchas live in a folded "usage notes" panel (same
        // pattern as the joinLive LiveView notes). Kept out of
        // `description` because that reads like a one-line summary, out
        // of `snippet` because integrators copy that verbatim, and out
        // of `field.help` because these caveats span multiple fields.
        notes: {
          summary: 'fetchLiveList',
          // Two tone-differentiated groups (must + env) — heads are
          // kept so the amber/indigo bands are anchored by text
          // labels ("Key points" vs "Common pitfalls"). The renderer only
          // auto-hides heads when there's a single group.
          groups: [
            {
              tone: 'must',
              head: 'Key points',
              items: [
                'Side-effect API: returns Promise<void>; the data is NOT in the return value but written into the reactive refs liveList / liveListCursor exposed by useLiveListState.',
                'cursor is a server-issued continuation token, NOT page number 1/2/3. Leave empty on first call to trigger a list reset; for continuation you MUST pass the last liveListCursor.value; after the last page liveListCursor is decided by the SDK (many implementations return empty string, but don\'t rely on this — always continue with the previous return value).',
                'liveList elements are LiveInfo processed by the state layer (mapped from the underlying TUILiveInfo by convertToLiveInfo) — this is the type production code consumes.',
              ],
            },
            {
              tone: 'env',
              head: 'Common pitfalls',
              items: [
                'count is "how many you EXPECT to pull this call", NOT "cumulative count after pulling". The append branch de-dupes into liveList by liveId with existing entries, so you might pass count=1 but see liveList.length=7 — the 7 is "cumulative".',
                'Don\'t treat the return value as data: `const list = await fetchLiveList(...)` gets undefined. Read liveList.value.',
              ],
            },
          ],
        },
        fields: [
          {
            key: 'cursor',
            label: 'cursor',
            type: 'text',
            default: '',
            help: 'Server-issued continuation token (not a page number). Empty triggers reset; for continuation fill in the last liveListCursor.value',
          },
          { key: 'count', label: 'count', type: 'number', default: 20, help: 'How many to pull this call (server may return fewer)' },
        ],
        run: async ({ inputs }) => {
          // Build a params object that mirrors what a caller would
          // pass. Only include keys the user actually filled in — the
          // SDK treats undefined and missing identically, but showing
          // the call site cleanly makes the Output panel honest.
          const params: { cursor?: string; count?: number } = {};
          const cursor = (inputs.cursor as string) || '';
          const count = inputs.count as number | undefined;
          if (cursor) params.cursor = cursor;
          if (typeof count === 'number' && count > 0) params.count = count;

          // Snapshot list length BEFORE the call so we can report
          // "how many did THIS call fetch" separately from
          // "cumulative length in state" — resolving the historical
          // confusion where a user passing `cursor=1, count=1` sees
          // `liveListLength: 7` and wonders why count didn't work
          // (it did; the 7 is the append+dedupe accumulation).
          const lengthBefore = live.liveList.value.length;

          // Capture the ACTUAL API return value (an `await` on a
          // `Promise<void>` yields `undefined`). We surface it in the
          // Output as `apiReturnValue` so integrators aren't misled
          // by any side-band data that also shows up.
          const apiReturnValue = await live.fetchLiveList(params);

          const lengthAfter = live.liveList.value.length;
          // For empty cursor (reset branch) the "fetched this call"
          // is simply the final length; for non-empty cursor (append
          // branch) it's the delta after de-dupe. Both convey
          // "did count take effect and how much did this call add".
          const fetchedThisCall = cursor === '' ? lengthAfter : lengthAfter - lengthBefore;

          // Data lives in the reactive state that the state layer
          // just populated. `liveList` items are LiveInfo objects
          // (state-layer type), converted from the underlying SDK's
          // TUILiveInfo by `convertToLiveInfo` inside the state layer
          // — this is what integrators actually consume in prod.
          return {
            apiReturnValue,
            calledWith: params,
            fetchedThisCall,
            reactiveState: {
              liveListCursor: live.liveListCursor.value,
              liveListLength: lengthAfter,
              liveList: live.liveList.value,
            },
          };
        },
        snippet: `import { useLiveListState } from 'tuikit-atomicx-vue3';

const { liveList, liveListCursor, fetchLiveList } = useLiveListState();

// First fetch: an empty cursor triggers a reset
await fetchLiveList({ count: 20 });
console.log('pulled', liveList.value.length, 'items');

// Keep fetching the next page until the last (liveListCursor.value === '')
while (liveListCursor.value) {
  await fetchLiveList({ cursor: liveListCursor.value, count: 20 });
}`,
      },
      {
        id: 'live-list.fetchLiveInfo',
        api: 'fetchLiveInfo',
        title: 'Query a single live room\'s info',
        signature: 'fetchLiveInfo(liveId: string): Promise<LiveInfo>',
        roles: ALL_ROLES,
        fields: [{ key: 'liveId', label: 'liveId', type: 'text', default: '', required: () => !liveId() }],
        run: async ({ inputs }) => {
          const id = (inputs.liveId as string) || liveId();
          return await live.fetchLiveInfo(id);
        },
        snippet: `const { fetchLiveInfo } = useLiveListState();
const info = await fetchLiveInfo('your-live-id');`,
      },
      {
        id: 'live-list.startLive',
        api: 'startLive',
        title: 'Start live',
        description:
          'Any logged-in user can call this; after success this side becomes the host of the live room.'
          + 'The room is fixed to "apply-to-take-seat" mode (audience must be approved by the host to take a seat), so no seatMode option is provided;'
          + 'for audience to take a seat, use [[applyForSeat|applyForSeat]] + host-side approval.',
        signature: 'startLive(params: StartLiveParams): Promise<void>',
        // Documentation label: `startLive` is what MAKES you a host,
        // so gating it behind "must already be host" is circular.
        // The runtime gate treats `unassigned` as allow (see
        // `ExampleCard.roleOk`), so this list only kicks in AFTER
        // you've entered some other room — e.g. an audience who
        // wants to start their own live must first leaveLive.
        // Listing all three RunnableRoles is the honest expression:
        // any previously-established role can, after returning to
        // unassigned, call startLive.
        roles: ALL_ROLES,
        notes: {
          summary: 'seatTemplate · seat layout template',
          // Single group → the ExampleCard renderer omits the group
          // head (the `<summary>` already labels the whole panel, so
          // a solo section heading would just repeat it). `head` is
          // therefore intentionally not set here.
          //
          // The picker's option list (label + meta subtitle for each
          // of the 5 templates) is already the source of truth for
          // "what templates exist and what each one does" — repeating
          // that as prose here would just duplicate the picker
          // without adding new context. The notes now cover ONLY the
          // invariants a picker can't express: one-shot lifecycle,
          // undefined semantics, enum-constant discipline.
          groups: [
            {
              tone: 'must',
              items: [
                'The SDK layer requires the "not in a room" state: startLive creates and enters a new live room, and the SDK rejects "starting a live while already in a room". The business side must first leaveLive (audience/admin) or endLive (your previous own live) to return to not-in-room, then call startLive. This demo card\'s run auto-leaveLive for the "audience/admin in someone else\'s room" case for quick demo; integrators must handle this step explicitly in their own code.',
                'Room-opening decision is one-shot: the SDK provides no runtime layout-switch API; switching layout requires endLive then startLive again. If the product needs "switch mode mid-live", guide the user to "end current live → reopen with new template" — don\'t expect a seamless switch.',
                'Not passing seatTemplate is legal but usually wrong: the SDK skips seat-config injection and the room will have no seats (audience can\'t apply for a seat). Only omit it when you need a "pure broadcast live" (no audience seat-taking).',
                'Always use SeatLayoutTemplate enum constants, never hardcode numeric values (e.g. 600/601/200). Values may change as the SDK evolves and hardcoded ones silently break.',
              ],
            },
          ],
        },
        fields: [
          { key: 'liveId', label: 'liveId', type: 'text', default: '', required: true },
          { key: 'liveName', label: 'liveName', type: 'text', default: 'API Example Live' },
          {
            key: 'enableMultiPlaybackQuality',
            label: 'enableMultiPlaybackQuality',
            type: 'boolean',
            default: true,
            help: 'Enable multi-resolution playback so viewers can switch resolution via live-player.switchResolution',
          },
          {
            key: 'seatTemplate',
            label: 'seatTemplate',
            // Custom dropdown (see PrettySelect.vue). Two reasons over
            // native <select>: popup opens downward (never overlays
            // the anchor as native does on macOS when space is tight),
            // and each option renders a two-line "label + meta" so
            // the enum identifier stays scannable while the plain-
            // language description gets a proper second line.
            type: 'pretty-select',
            default: SeatLayoutTemplate.VideoDynamicGrid9Seats,
            help: 'One-shot decision; cannot switch after going live; see "usage notes" below',
            // All 5 members of SeatLayoutTemplate enum, in enum
            // declaration order. Must stay in lockstep with the
            // "5 available templates" list in `notes` above — the folded
            // panel documents them, so hiding some options here
            // would create a "docs list 5, picker offers 3"
            // discrepancy that misleads integrators about what
            // the SDK actually accepts.
            options: [
              {
                label: 'VideoDynamicGrid9Seats',
                value: SeatLayoutTemplate.VideoDynamicGrid9Seats,
                meta: 'Portrait · dynamic 9 seats, positions reflow with headcount; most common voice / video room',
              },
              {
                label: 'VideoDynamicFloat7Seats',
                value: SeatLayoutTemplate.VideoDynamicFloat7Seats,
                meta: 'Portrait · 1 host + 6 guests floating surround, dynamic reflow; showroom / PK scenes',
              },
              {
                label: 'VideoFixedGrid9Seats',
                value: SeatLayoutTemplate.VideoFixedGrid9Seats,
                meta: 'Portrait · static 3x3 grid, seat positions fixed, no reflow',
              },
              {
                label: 'VideoFixedFloat7Seats',
                value: SeatLayoutTemplate.VideoFixedFloat7Seats,
                meta: 'Portrait · static 1v6 floating, guest seats fixed, no reflow',
              },
              {
                label: 'VideoLandscape4Seats',
                value: SeatLayoutTemplate.VideoLandscape4Seats,
                meta: 'Landscape · 4 seats; good for game live / landscape content',
              },
            ],
          },
        ],
        run: async ({ inputs, log }) => {
          const id = (inputs.liveId as string) || liveId();
          // Auto-leave first when the demo user is currently inside
          // someone else's live as audience / admin. The SDK's
          // `startLive` doesn't accept "already in a room" and will
          // reject; forcing the operator to click leaveLive first
          // is unnecessary friction — the intent of clicking
          // startLive here is unambiguously "leave whatever room I'm
          // in and start my own". We do NOT auto-leave when the user
          // is host of ANOTHER room (that would silently destroy
          // their existing live via endLive semantics); we let SDK
          // throw so the operator sees the conflict.
          const before = live.currentLive.value;
          const me = session.userId;
          const isInSomeoneElsesRoom = !!before?.liveId
            && before.liveOwner?.userId
            && before.liveOwner.userId !== me;
          if (isInSomeoneElsesRoom) {
            log('auto-leaveLive', { reason: 'already in another live', liveId: before?.liveId });
            await live.leaveLive();
          }
          // Enable multi-resolution playback before starting the live
          // so the SDK allocates transcoding resources. Must be called
          // before startLive; calling after has no effect.
          if (inputs.enableMultiPlaybackQuality !== false) {
            TUIRoomEngine.callExperimentalAPI(JSON.stringify({
              api: 'enableMultiPlaybackQuality',
              params: { enable: true },
            }));
          }
          // Live rooms are always apply-to-take; seatMode is intentionally not set.
          await live.startLive({
            liveId: id,
            liveName: inputs.liveName as string,
            seatTemplate: inputs.seatTemplate as SeatLayoutTemplate,
          });
          // Diagnostic: log currentLive shape after startLive so we
          // can see exactly what the SDK wrote (roomOwner presence,
          // liveId, etc.) — remove once the "role stays audience
          // after startLive" issue is understood.
          const afterStart = live.currentLive.value;
          log('post-startLive currentLive snapshot', {
            liveId: afterStart?.liveId,
            liveOwnerUserId: afterStart?.liveOwner?.userId ?? '(empty)',
            sessionUserId: session.userId,
            sessionRole: session.role,
          });
          // startLive only creates the room; capture/push lives in
          // `useDeviceState`. Guide the host straight to the camera-open API
          // so the black stage gets an actual stream.
          //
          // The toast is tagged with `role: Role.Host` (not `session.role`)
          // because `startLive` is what MAKES the caller a host — at the
          // moment we push this toast, `session.role` may still be the
          // pre-call value (e.g. `unassigned` on the first startLive of the
          // session, or `Audience` if the caller auto-left another room
          // above). `ToastStack.actionFor` role-gates guidance actions
          // against `t.role`, so using the stale pre-call role would hide
          // the "open camera" CTA on the first startLive click and only
          // start showing it on subsequent clicks — exactly the reported
          // "no guidance toast on first call" symptom. Pinning to `Role.Host`
          // matches the post-call reality and the action's `roles: [Host]`
          // gate uniformly.
          pushToast({
            source: 'live-list',
            role: Role.Host,
            level: 'success',
            title: t('Toast.StartLiveSuccess'),
            description: `liveId: ${id} · ${t('Toast.StartLiveDesc')}`,
            action: {
              state: 'device',
              apiId: 'openLocalCamera',
              label: t('Toast.StartLiveAction'),
              labelKey: 'Toast.StartLiveAction',
              roles: [Role.Host],
            },
          });
          cacheRoom(id, true);
          return live.currentLive.value;
        },
        snippet: `import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';
import { useLiveListState, SeatLayoutTemplate } from 'tuikit-atomicx-vue3';

const { startLive, leaveLive, currentLive } = useLiveListState();

// If already in someone else's live room (as audience/admin), leave it before going live
if (currentLive.value?.liveId && currentLive.value?.liveOwner?.userId !== myUserId) {
  await leaveLive();
}

// Enable multi-resolution playback (must be called before startLive)
TUIRoomEngine.callExperimentalAPI(JSON.stringify({
  api: 'enableMultiPlaybackQuality',
  params: { enable: true },
}));

// Room is fixed to "apply-to-join-seat" mode; no need to pass seatMode
await startLive({
  liveId: 'live_123',
  liveName: 'My Live',
  seatTemplate: SeatLayoutTemplate.VideoDynamicGrid9Seats,
});`,
      },
      {
        id: 'live-list.createLive',
        api: 'createLive',
        title: 'Start live (deprecated alias)',
        description: 'Deprecated, equivalent to startLive, kept only for legacy access. New integrations should use startLive.',
        signature: 'createLive(params: StartLiveParams): Promise<void>',
        // Mirrors startLive's roles list — createLive is an alias,
        // so it inherits the same "any established role can call
        // this after returning to unassigned" semantics.
        roles: ALL_ROLES,
        deprecated: true,
        fields: [
          { key: 'liveId', label: 'liveId', type: 'text', default: '', required: () => !liveId() },
          { key: 'liveName', label: 'liveName', type: 'text', default: 'API Example Live' },
        ],
        run: async ({ inputs }) => {
          const id = (inputs.liveId as string) || liveId();
          await live.createLive({ liveId: id, liveName: inputs.liveName as string });
          return live.currentLive.value;
        },
        snippet: `// @deprecated use startLive instead
const { createLive } = useLiveListState();
await createLive({ liveId: 'live_123', liveName: 'My Live' });`,
      },
      {
        id: 'live-list.joinLive',
        api: 'joinLive',
        title: 'Enter live room and pull stream',
        description:
          'End-to-end: after joinLive enters the room, the LiveView below renders the pulled stream. The state layer handles entering; the video is carried by LiveView.',
        signature: 'joinLive(params: { liveId: string }): Promise<void>',
        // `roles` here is a documentation label — see the JSDoc on
        // `ExampleDef.roles` in `lib/types/index.ts`. joinLive lands you
        // in `audience` regardless of what you were before, so any
        // previously-established role is a valid caller: a former
        // host who just called `endLive` can hop into someone else's
        // live to see it as audience; a former admin who
        // `leaveLive`d can enter a different live. The one
        // consistently-true precondition is "you are not currently
        // in a room", which the runtime gate expresses via the
        // `unassigned` allow-through in `ExampleCard.roleOk`.
        roles: ALL_ROLES,
        fields: [{ key: 'liveId', label: 'liveId', type: 'text', default: '', required: () => !liveId() }],
        mount: { kind: 'live-view' },
        notes: {
          summary: 'joinLive',
          groups: [
            {
              tone: 'must',
              items: [
                'The SDK layer requires the "not in a room" state: if you are currently in some room (audience/admin/host), please leaveLive or endLive first, then joinLive. This demo card\'s run auto-leaveLive for the "audience/admin switching to a different live room" case for quick demo; integrators must handle this step explicitly in their own code.',
                'After joinLive succeeds, your local role is uniformly "audience"; afterward the host can promote you to "admin" via setAdministrator; whether you were a host before does not affect this room-entry role.',
              ],
            },
            {
              tone: 'env',
              items: [
                'Lifecycle: any role, after returning to "not in a room", can joinLive to any liveId. Typical multi-scene combos: host endLive then joinLive someone else\'s live to view; audience leaveLive then joinLive to another live room.',
              ],
            },
          ],
        },
        run: async ({ inputs, log }) => {
          const id = (inputs.liveId as string) || liveId();
          // Same auto-leave pattern as startLive: if we're already
          // in someone else's live (audience/admin), leave it before
          // joining a different one — the SDK's `joinLive` doesn't
          // accept "already in a room". Host is intentionally NOT
          // auto-handled: silently destroying the host's own live
          // to join another is a big move that must be explicit;
          // the host should call endLive themselves.
          const before = live.currentLive.value;
          const me = session.userId;
          const isInSomeoneElsesRoom = !!before?.liveId
            && before.liveOwner?.userId
            && before.liveOwner.userId !== me
            && before.liveId !== id;
          if (isInSomeoneElsesRoom) {
            log('auto-leaveLive', { reason: 'switching to a different live', from: before?.liveId, to: id });
            await live.leaveLive();
          }
          await live.joinLive({ liveId: id });
          // The global LiveView shows the pull-stream automatically; surface a
          // success cue and a shortcut to player controls so the operator can
          // verify pause/volume/resolution end-to-end.
          pushToast({
            source: 'live-list',
            role: session.role,
            level: 'success',
            title: t('Toast.JoinLiveSuccess'),
            description: `liveId: ${id} · ${t('Toast.JoinLiveDesc')}`,
            action: {
              state: 'live-player',
              apiId: 'state',
              label: t('Toast.JoinLiveAction'),
              labelKey: 'Toast.JoinLiveAction',
            },
          });
          cacheRoom(id, false);
          return live.currentLive.value;
        },
        snippet: `const { joinLive, leaveLive, currentLive } = useLiveListState();

// If already in another live room, leave it before joining the new one
if (
  currentLive.value?.liveId
  && currentLive.value?.liveOwner?.userId !== myUserId
  && currentLive.value?.liveId !== 'live_123'
) {
  await leaveLive();
}
await joinLive({ liveId: 'live_123' });`,
      },
      {
        id: 'live-list.leaveLive',
        api: 'leaveLive',
        title: 'Leave live room',
        description: 'Any role can use this to exit the current room; if a host wants to also end the live, use [[endLive|endLive]].',
        signature: 'leaveLive(): Promise<void>',
        // leaveLive only makes sense inside a room — it exits whatever
        // room you currently occupy. Gate it behind "in a room" so the
        // card is disabled when currentLive has no liveId (matching the
        // room gates used by the live-gift group).
        disabled: () => (live.currentLive.value?.liveId ? '' : 'Card.NotInRoom'),
        // Documentation label: leaveLive is the generic room-exit
        // primitive. SDK does not restrict the caller's role, and
        // the demo mirrors that — see notes below for the semantic
        // difference vs. endLive when the caller is the host.
        roles: ALL_ROLES,
        run: async () => {
          await live.leaveLive();
          clearCachedRoom();
          pushToast({
            source: 'live-list',
            role: session.role,
            level: 'success',
            title: t('Toast.LeaveLiveSuccess'),
            description: t('Toast.LeaveLiveDesc'),
          });
          return { left: true };
        },
        snippet: `const { leaveLive } = useLiveListState();
await leaveLive();`,
        notes: {
          summary: 'leaveLive',
          groups: [
            {
              tone: 'must',
              items: [
                'leaveLive means "this side exits the room" and does NOT dissolve the room. After exiting, this side returns to "not in a room" and can immediately joinLive into another live room.',
                'Host calling leaveLive: the room still exists on the server and other audience do not receive onLiveEnded; live scenes should usually use endLive to end the whole live. Only special businesses like multi-host / resident rooms use leaveLive to let the host "temporarily leave".',
              ],
            },
          ],
        },
      },
      {
        id: 'live-list.endLive',
        api: 'endLive',
        title: 'Dissolve live room (host)',
        signature: 'endLive(): Promise<void>',
        roles: [Role.Host],
        run: async () => {
          await live.endLive();
          clearCachedRoom();
          pushToast({
            source: 'live-list',
            role: session.role,
            level: 'success',
            title: t('Toast.EndLiveSuccess'),
            description: t('Toast.EndLiveDesc'),
          });
          return { ended: true };
        },
        snippet: `const { endLive } = useLiveListState();
await endLive();`,
      },
      {
        id: 'live-list.updateLiveInfo',
        api: 'updateLiveInfo',
        title: 'Update live room info',
        // Single-JSON-input form. Rationale: `UpdateLiveInfoParams` has
        // 7 truly-supported fields; wiring each as a bespoke widget
        // (text / number / json / pretty-select) hides the API shape
        // AND makes it easy to silently drop a field when the SDK
        // adds one. A single JSON textbox pre-populated with the full
        // field list (each line commented) turns the input into a
        // self-documenting checklist: the user un-comments only the
        // fields they want to change, so the "call site" the operator
        // sees is exactly the object that hits `updateLiveInfo`.
        //
        // `liveId` is deliberately omitted from the template because
        // the state layer defaults to `currentLive.liveId` — surfacing
        // it invites cross-room misuse. `seatTemplate` is also
        // omitted: the state layer's implementation ignores it (see
        // note below), it's effectively a dead field on the type.
        signature: 'updateLiveInfo(params: UpdateLiveInfoParams): Promise<void>',
        roles: [Role.Host],
        fields: [
          {
            key: 'params',
            label: 'params',
            type: 'json',
            // Default is a *legal* JSON object (empty `{}` after line
            // comments are stripped), which means clicking "run" on
            // an untouched card is a safe no-op instead of silently
            // rewriting fields to their template values. Users
            // un-comment only the fields they want to change; commented
            // lines double as inline documentation for the full param
            // surface (values used are illustrative examples, not
            // authoritative defaults — categories especially are
            // business-defined).
            //
            // Layout notes:
            //   1. Keys mirror `UpdateLiveInfoParams` one-for-one, in
            //      declaration order — this template doubles as the
            //      type's field checklist. Editing the type without
            //      touching this template (or vice versa) should stand
            //      out on review.
            //   2. All fields are LIVE by default (not commented out).
            //      Users who don't want to change a field should
            //      delete or comment its line before clicking Run.
            //      Rationale: the previous "everything commented"
            //      default was safe-by-default but hid the actual API
            //      shape from operators who wanted to see a filled-in
            //      request; JSON syntax highlighting now makes an
            //      obviously-populated payload the more useful demo.
            //   3. `liveId` is intentionally kept as an empty string
            //      so the state layer falls back to `currentLive.liveId`.
            //      A placeholder like "your-live-id" would try to update
            //      a non-existent room and produce a confusing SDK error
            //      on first click.
            //   4. Descriptions sit on their own line above each key
            //      instead of trailing `// zh …`, so a Chinese-width
            //      comment can't push the code past the visible width
            //      and wrap.
            default: [
              '{',
              '  // Live room ID (leave empty to update the current room via currentLive.liveId)',
              '  "liveId": "",',
              '  // Live room title',
              '  "liveName": "API Example Live",',
              '  // Custom business activity-status integer (0 is also sent)',
              '  "activityStatus": 1,',
              '  // Custom business category ID integer array ([] really clears it)',
              '  "categoryList": [101, 205],',
              '  // Live room cover URL',
              '  "coverUrl": "https://your-cdn/cover.png",',
              '  // Live room background URL',
              '  "backgroundUrl": "https://your-cdn/bg.png",',
              '  // Whether publicly visible (false is also sent)',
              '  "isPublicVisible": true,',
              '  // Seat layout template ID (SeatLayoutTemplate enum):',
              '  //   600 = VideoDynamicGrid9Seats · portrait · dynamic 9 seats, positions reflow with headcount',
              '  //   601 = VideoDynamicFloat7Seats · portrait · 1v6 floating surround, dynamic reflow',
              '  //   800 = VideoFixedGrid9Seats · portrait · static 3x3 grid, fixed positions',
              '  //   801 = VideoFixedFloat7Seats · portrait · static 1v6 floating, fixed guest seats',
              '  //   200 = VideoLandscape4Seats · landscape · 4 seats (games / landscape content)',
              '  // ⚠️ Editing layoutTemplate auto-filters the other fields above; only layoutTemplate is sent. Even if the JSON includes other fields, they are dropped automatically — no need to delete them manually.',
              '  "layoutTemplate": 600',
              '}',
            ].join('\n'),
            // Row count matches the packed template line count so the
            // whole checklist fits without a resize drag; the editor
            // still allows vertical resize when a payload outgrows the
            // initial box. The layoutTemplate enum value cheat sheet
            // adds ~5 lines vs the pre-cheatsheet template.
            rows: 25,
            help: 'All fields are open by default; clicking Run sends them all at once. Delete or comment a field\'s line if you don\'t want to change it. Field descriptions are in the "usage notes" below.',
          },
        ],
        run: async ({ inputs }) => {
          // Parse with line-comment tolerance so the pre-populated
          // template stays valid whether the user un-comments zero,
          // some, or all rows. Empty / whitespace input parses to
          // `undefined` → we coerce to `{}` so the state layer sees
          // a no-op call rather than crashing on `undefined` deref.
          let params = parseJsonWithComments<UpdateLiveInfoParams>(inputs.params as string) ?? {};

          // IL layer restriction: when modifying layoutTemplate, cannot
          // concurrently modify other room properties. Filter out all other
          // fields if layoutTemplate is present.
          if (params.layoutTemplate !== undefined) {
            params = {
              liveId: params.liveId,
              layoutTemplate: params.layoutTemplate,
            };
          }

          await live.updateLiveInfo(params);
          return live.currentLive.value;
        },
        snippet: `import { useLiveListState, SeatLayoutTemplate } from 'tuikit-atomicx-vue3';
const { updateLiveInfo } = useLiveListState();
// Only pass the fields you actually want to change. Fields you omit
// are left untouched on the server; fields you pass — including
// falsy ones like \`isPublicVisible: false\` or \`activityStatus: 0\`
// — are forwarded verbatim.
await updateLiveInfo({
  liveName: 'New live streaming room name',
  coverUrl: 'https://your-cdn/cover.png',
  categoryList: [101, 205],
  layoutTemplate: SeatLayoutTemplate.VideoDynamicGrid9Seats,
});`,
        notes: {
          summary: 'updateLiveInfo',
          groups: [
            {
              tone: 'must',
              items: [
                'Delete or comment a field: to change only some fields, delete the lines you don\'t want or comment them with `//`; commented/removed fields are NOT sent to the SDK at all.',
                'Falsy values are forwarded: false / 0 / [] / "" are real values that ARE sent to the SDK, they are not swallowed. For example `"isPublicVisible": false` changes the room to not-public.',
                'liveId default: when empty, updates the current live room by default (`currentLive.liveId`); when a non-empty value is filled, updates the corresponding room.',
                'categoryList is business-defined: an integer category ID array; the SDK does not validate its meaning. The sample `[101, 205]` is just a placeholder and must align with your business system.',
                '⚠️ layoutTemplate auto-filter: when changing the seat layout, the demo auto-filters other fields and sends only `layoutTemplate`. The JSON may include other fields, which are automatically dropped on submit.',
              ],
            },
            {
              tone: 'env',
              items: [
                'The editor supports `//` line comments (block comments `/* */` and trailing commas are NOT supported).',
              ],
            },
          ],
        },
      },
      {
        id: 'live-list.queryMetaData',
        api: 'queryMetaData',
        title: 'Query metadata',
        signature: 'queryMetaData(options: { keys: string[] }): Promise<unknown>',
        roles: ALL_ROLES,
        fields: [{ key: 'keys', label: 'keys', type: 'json', default: '["custom_key"]', help: 'JSON string array' }],
        run: async ({ inputs }) => {
          const keys = parseJson<string[]>(inputs.keys as string) || [];
          return await live.queryMetaData({ keys });
        },
        snippet: `const { queryMetaData } = useLiveListState();
const data = await queryMetaData({ keys: ['custom_key'] });`,
      },
      {
        id: 'live-list.updateLiveMetaData',
        api: 'updateLiveMetaData',
        title: 'Update metadata',
        signature: 'updateLiveMetaData(options: { metaData: string }): Promise<unknown>',
        roles: [Role.Host, Role.Admin],
        fields: [{ key: 'metaData', label: 'metaData', type: 'json', default: '{"custom_key":"v1"}' }],
        run: async ({ inputs }) => {
          return await live.updateLiveMetaData({ metaData: (inputs.metaData as string) || '{}' });
        },
        snippet: `const { updateLiveMetaData } = useLiveListState();
await updateLiveMetaData({ metaData: JSON.stringify({ custom_key: 'v1' }) });`,
      },
      ...buildSubscriptionCards({
        groupSlug: 'live-list',
        hookName: 'useLiveListState',
        eventEnumName: 'LiveListEvent',
        toggle: demoToggle,
      }),
    ],
  };
}

function parseJson<T>(raw: string | undefined): T | undefined {
  if (!raw || !raw.trim()) {
    return undefined;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(`Invalid JSON input: ${raw}`);
  }
}

/**
 * Parse JSON that MAY contain `//` line comments. Used by cards that
 * pre-populate their input with a commented-out field checklist so the
 * user can un-comment only the fields they intend to send (see
 * `live-list.updateLiveInfo`).
 *
 * Uses the `json5` library to reliably handle comments while preserving `://` in URLs.
 */
function parseJsonWithComments<T>(raw: string | undefined): T | undefined {
  if (!raw || !raw.trim()) {
    return undefined;
  }
  try {
    const result = JSON5.parse(raw) as T;
    return result;
  } catch (error) {
    throw new Error(`Invalid JSON input: ${raw}`);
  }
}

// ---------------------------------------------------------------------------
// Public surface (single re-export point per project convention).
// ---------------------------------------------------------------------------

export const meta = { state: 'live-list', hook: 'useLiveListState', title: 'Live room lifecycle', category: '6.1', source: 'LiveListState/index.ts' };
export { useLiveListExamples, useLiveListExamples as factory };
