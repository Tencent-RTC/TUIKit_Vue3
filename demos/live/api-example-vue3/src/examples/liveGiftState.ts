import { useLiveGiftState, LiveGiftEvents, useLiveListState } from 'tuikit-atomicx-vue3';
import type { GiftCategory, GiftInfo } from '@tencentcloud/tuiroom-engine-js';
import { useEventLogSubscription } from '../services/event-log/useSubscription';
import { useDemoHandlerToggle } from '../services/event-log/useDemoHandlerToggle';
import { buildSubscriptionCards } from '../services/event-log/buildSubscriptionCards';
import type { ExampleGroup, FieldOption, StateViewDef } from '../lib/types';
import { ALL_ROLES } from '../lib/types';

/**
 * 6.9 useLiveGiftState —— gifts & likes.
 *
 * Covers gift-list refresh, gift / like sending, language switching, and all
 * three gift event types (onReceiveGiftMessage / onGiftCountChanged /
 * onReceiveLikesMessage).
 *
 * Role convention: gifts / likes are "light interactions any member in the
 * live room can initiate", independent of whether they are on seat, so
 * sendGift / sendLikes are open to host / audience / admin alike. The
 * underlying `liveGiftManager` already validates the joined-room state at
 * the access layer — when not in a room it rejects the call with an error,
 * which surfaces through both the Output red box and the event log; this
 * demo layer does not need to add role gating on top.
 *
 * Design notes:
 * - `sendGift.giftId` uses a dynamic `select` of options: derives the gift
 *   dropdown from the reactive `giftInfoList`, forcing integrators to follow
 *   the "refreshGiftList first → sendGift" contract order;
 *   on first entry `resolutionList` is empty, so the dropdown shows a
 *   "click refreshGiftList first" placeholder, default bound to index 0;
 *   at runtime, if the real gift list is still empty, it throws immediately.
 * - We do NOT auto-pull `refreshGiftList` at the card level: a) it requires
 *   the current room's currentLive.liveId to exist, which may not be met at
 *   module init; b) letting integrators run the pull endpoint themselves is
 *   exactly the value of the demo.
 */
function useLiveGiftExamples(): ExampleGroup {
  const gift = useLiveGiftState();
  const { currentLive } = useLiveListState();

  // Room gate: all gift operations require being in a live room.
  const roomGate = () => currentLive.value?.liveId ? '' : 'Card.NotInRoom';

  // Subscribe every gift event into the shared log.
  const giftEvents = useEventLogSubscription('live-gift', gift, LiveGiftEvents);
  // Toggleable demo-handler set for subscribeEvent / unsubscribeEvent cards.
  const demoToggle = useDemoHandlerToggle('live-gift', gift, LiveGiftEvents);

  /**
   * Flatten `giftInfoList` (a list of categories, each with a `giftList`) into
   * a rich-select grid of `{ label, value, iconUrl, meta }`.
   *
   * The grid renderer (see `ExampleCard.vue` → `.rich-select`) shows each
   * option with its `iconUrl` (the gift sprite) and a small `meta` line
   * holding category + coin price + level, so the operator can pick a gift
   * visually instead of guessing from an opaque `gift_001` id.
   *
   * Reads `giftInfoList.value` lazily so the grid follows the reactive state
   * after `refreshGiftList` resolves.
   *
   * Note: the SDK's `.d.ts` exports `GiftInfo.giftID` / `GiftCategory.name`
   * (camelCase with the trailing "ID" uppercased), while `sendGift` accepts
   * `giftId` in its params object. We bridge that here.
   */
  const giftOptions = (): FieldOption[] => {
    const cats = gift.giftInfoList.value as GiftCategory[];
    const flat: FieldOption[] = [];
    for (const cat of cats) {
      const list: GiftInfo[] = cat.giftList ?? [];
      for (const g of list) {
        // Meta line: "category · 100 coins · L2". Each segment guarded
        // because some fields may be absent on a sparsely-populated gift.
        const segments: string[] = [];
        if (cat.name) {
          segments.push(cat.name);
        }
        if (typeof g.coins === 'number' && g.coins > 0) {
          segments.push(`${g.coins} coins`);
        }
        if (typeof g.level === 'number' && g.level > 0) {
          segments.push(`L${g.level}`);
        }
        flat.push({
          label: g.name || g.giftID,
          value: g.giftID,
          iconUrl: g.iconUrl || undefined,
          meta: segments.join(' · ') || undefined,
        });
      }
    }
    if (flat.length === 0) {
      // Placeholder so the grid has a deterministic option (matches
      // `default: ''` below); the runtime guard inside `run` still
      // rejects empty selections.
      return [{
        label: '(Please call refreshGiftList to pull the gift list first)',
        value: '',
        meta: 'Click the refreshGiftList card above',
      }];
    }
    return flat;
  };

  /** Compact snapshot serialized into the Output panel. */
  const snapshot = () => {
    const cats = gift.giftInfoList.value as GiftCategory[];
    return {
      categoryCount: cats.length,
      giftCount: cats.reduce((sum, c) => sum + (c.giftList?.length ?? 0), 0),
      categories: cats.slice(0, 5).map(c => ({
        name: c.name,
        count: c.giftList?.length ?? 0,
      })),
      totalLikeCount: gift.totalLikeCount.value,
    };
  };

  /** Humanized inspector schema for the `live-gift.state` snapshot. */
  const giftView: StateViewDef = {
    live: true,
    groups: [
      {
        title: 'Gifts',
        rows: [
          { key: 'categoryCount', label: 'Gift category count', kind: 'count' },
          { key: 'giftCount', label: 'Total gift count', kind: 'count' },
          { key: 'categories', label: 'First 5 categories', kind: 'list', preview: 5 },
        ],
      },
      {
        title: 'Likes',
        rows: [
          {
            key: 'totalLikeCount',
            label: 'Total likes',
            kind: 'custom',
            format: (v, t) => t('State.Unit.Times', { count: Number(v) || 0, defaultValue: '{{count}} times' }),
          },
        ],
      },
    ],
  };

  return {
    state: 'live-gift',
    hook: 'useLiveGiftState',
    title: 'Gifts & Likes',
    category: '6.9',
    source: 'LiveGiftState/LiveGiftState.ts',
    // Group-level "about this group" banner (rendered ONCE by GroupIntro.vue
    // above the cards). Verified against source: every action requires being in
    // a room; gift list is never auto-loaded; like count is server-pushed.
    intro: {
      summary: 'All capabilities require being in a room; the gift list is never auto-loaded',
      groups: [
        {
          tone: 'must',
          head: 'Key points',
          items: [
            'Sending gifts / likes / pulling the gift list all require currentLive.liveId to be non-empty (already in a room); calling outside a room throws directly — the host starts a live with startLive, the audience joins with joinLive first.',
            'The gift list is never auto-loaded: giftInfoList starts empty, you must actively refreshGiftList() (or the deprecated getGiftList()) to write it into the reactive data; always pull the list before sendGift.',
            'The cumulative like count totalLikeCount is not incremented after YOU send a like — it is overwritten wholesale when you/others receive the server-pushed like event; your local number will not change immediately after sendLikes.',
            'Gifts and likes do not distinguish roles and are independent of being on seat: host / audience / admin can all send, only whether you are in the room is validated.',
          ],
        },
        {
          tone: 'env',
          head: 'Common pitfalls',
          items: [
            'To receive gift / like events you must subscribeEvent(LiveGiftEvents.<event>, cb) yourself; getGiftList is an async Promise (deprecated) — new code uses refreshGiftList.',
            'After setLanguage switches the language you must call refreshGiftList again for the new-language display; switching language alone does not re-pull the cached list.',
          ],
        },
      ],
    },
    examples: [
      {
        id: 'live-gift.state',
        api: 'state',
        title: 'Read gift state (giftInfoList / totalLikeCount)',
        description: 'Reactive snapshot of the gift category list and cumulative like count.',
        signature: 'giftInfoList: Ref<GiftCategory[]> / totalLikeCount: Ref<number>',
        roles: ALL_ROLES,
        requireLogin: false,
        events: [...giftEvents],
        // Humanized inspector schema (see `giftView` above) replaces
        // the raw JSON dump for this card.
        stateView: giftView,
        // State readout — re-runs on every render. A toast on every tick
        // would spam the stack; the Output panel already shows the value.
        successToast: false,
        // On card open, auto-refresh the gift catalog so the gift list is
        // already populated (and the sendGift picker has options) without
        // manually running refreshGiftList first. Fire-and-forget with catch:
        // requires an active room, so a pre-pull before joining silently no-ops.
        onActivate: () => {
          void gift.refreshGiftList().catch(() => {});
        },
        // Documents the auto-pull above.
        notes: {
          summary: 'live-gift.state · auto-pull on open',
          groups: [
            {
              tone: 'env',
              items: [
                'On opening this card, refreshGiftList() is auto-called to pull the gift categories and list into the reactive state giftInfoList — no need to click the refreshGiftList card manually. Data only appears after being in a room (currentLive.liveId exists).',
              ],
            },
          ],
        },
        run: () => snapshot(),
        snippet: `import { useLiveGiftState } from 'tuikit-atomicx-vue3';

const { giftInfoList, totalLikeCount } = useLiveGiftState();`,
      },
      {
        id: 'live-gift.refreshGiftList',
        api: 'refreshGiftList',
        title: 'Refresh gift list',
        description: 'Pull the current live room\'s gift categories and list from the server.',
        notes: {
          summary: 'refreshGiftList',
          groups: [
            {
              tone: 'must',
              items: [
                'You must be in a room first: calling when currentLive.liveId is empty throws. Audience: joinLive first; host: startLive first.',
                'Side effect: the result is written into the reactive giftInfoList; it also preloads gift effect animation resources (reduces white screen on first gift send).',
              ],
            },
          ],
        },
        signature: 'refreshGiftList(): Promise<void>',
        roles: ALL_ROLES,
        events: [...giftEvents],
        disabled: roomGate,
        successToast: {
          title: 'Gift list refreshed',
          description: 'You can pick a gift in the sendGift card\'s giftId dropdown below',
        },
        run: async () => {
          await gift.refreshGiftList();
          return snapshot();
        },
        snippet: `const { refreshGiftList, giftInfoList } = useLiveGiftState();
await refreshGiftList();
console.log(giftInfoList.value);`,
      },
      {
        id: 'live-gift.sendGift',
        api: 'sendGift',
        title: 'Send gift',
        description: 'Send the specified gift to the current live room.',
        signature: 'sendGift(params: { giftId: string; count: number }): Promise<void>',
        roles: ALL_ROLES,
        events: [...giftEvents],
        disabled: roomGate,
        successToast: {
          title: 'Gift sent',
          description: 'The receiving side gets onReceiveGiftMessage and onGiftCountChanged',
        },
        fields: [
          {
            key: 'giftId',
            label: 'giftId',
            // `rich-select` renders an icon grid (iconUrl + label + meta) so
            // the operator picks a gift visually. Falls back to a placeholder
            // tile when `giftInfoList` is still empty (pre-refresh).
            type: 'rich-select',
            // Bind to empty so the placeholder option is selected initially
            // and the runtime guard below catches "no gift list yet".
            default: '',
            options: giftOptions,
            help: 'Click a gift card below to choose; if empty, run refreshGiftList above first',
          },
          { key: 'count', label: 'count', type: 'number', default: 1 },
        ],
        run: async ({ inputs, t }) => {
          const giftId = String(inputs.giftId || '');
          if (!giftId) {
            throw new Error(
              t(
                'Error.GiftIdEmpty',
                'giftId is empty: please run refreshGiftList to pull the gift list first, then pick a specific gift in the giftId dropdown',
              ),
            );
          }
          await gift.sendGift({ giftId, count: Number(inputs.count) || 1 });
          return { sent: true, giftId, count: Number(inputs.count) || 1 };
        },
        snippet: `const { refreshGiftList, giftInfoList, sendGift } = useLiveGiftState();

// 1) Refresh first to fetch the gift list
await refreshGiftList();

// Mind the casing: the SDK type is GiftInfo.giftID; sendGift takes giftId
const firstGiftId = giftInfoList.value[0]?.giftList?.[0]?.giftID;

// 2) Send
if (firstGiftId) {
  await sendGift({ giftId: firstGiftId, count: 1 });
}`,
      },
      {
        id: 'live-gift.sendLikes',
        api: 'sendLikes',
        title: 'Send likes',
        description: 'Send likes to the current live room.',
        signature: 'sendLikes(params: { count: number }): Promise<void>',
        roles: ALL_ROLES,
        events: [...giftEvents],
        disabled: roomGate,
        successToast: {
          title: 'Likes sent',
          description: 'The receiving side gets onReceiveLikesMessage; totalLikeCount updates after receipt',
        },
        fields: [{ key: 'count', label: 'count', type: 'number', default: 1 }],
        run: async ({ inputs, t }) => {
          const count = Number(inputs.count) || 1;
          await gift.sendLikes({ count });
          return { sent: true, count };
        },
        snippet: `const { sendLikes } = useLiveGiftState();
await sendLikes({ count: 1 });`,
      },
      {
        id: 'live-gift.setLanguage',
        api: 'setLanguage',
        title: 'Set gift info display language',
        description: 'Set the display language for gift names / descriptions, etc.',
        signature: 'setLanguage(language: string): Promise<void>',
        roles: ALL_ROLES,
        disabled: roomGate,
        notes: {
          summary: 'setLanguage',
          groups: [
            {
              tone: 'must',
              items: [
                'After setting, you must call refreshGiftList again to see the new-language names / descriptions; switching the language alone does not re-pull the cached gift list.',
              ],
            },
          ],
        },
        fields: [
          {
            key: 'language',
            label: 'language',
            type: 'pretty-select',
            default: 'zh-Hans',
            options: [
              { label: 'zh-Hans', value: 'zh-Hans', meta: 'Simplified Chinese' },
              { label: 'en', value: 'en', meta: 'English' },
            ],
          },
        ],
        run: async ({ inputs, t }) => {
          const language = String(inputs.language || 'zh-Hans');
          // Normalize locale to the format the backend expects:
          //   zh-CN / zh-TW / zh-HK / zh → zh-Hans
          //   en-US / en-GB / en        → en
          //   Everything else passes through unchanged.
          // This lets integrators pass common i18n locales (e.g. zh-CN
          // from vue-i18n) without hitting error_code:100002.
          const normalized = (() => {
            const lower = language.toLowerCase();
            if (lower.startsWith('zh')) return 'zh-Hans';
            if (lower.startsWith('en')) return 'en';
            return language;
          })();
          await gift.setLanguage(normalized);
          return { language: normalized };
        },
        // Successful language switch is invisible until the next refresh;
        // a small toast makes the cause-effect explicit.
        successToast: {
          title: 'Language switched',
          description: 'Please call refreshGiftList again so gift names / descriptions use the new language',
        },
        snippet: `const { setLanguage, refreshGiftList } = useLiveGiftState();
await setLanguage('en');
// Re-fetch the list after switching language to see gift names in the new language
await refreshGiftList();`,
      },
      {
        id: 'live-gift.getGiftList',
        api: 'getGiftList',
        title: 'Get gift list (deprecated, for legacy access only)',
        description: 'Deprecated; equivalent to refreshGiftList but additionally returns the gift category array directly (Promise).',
        signature: 'getGiftList(): Promise<GiftCategory[]>',
        roles: ALL_ROLES,
        deprecated: true,
        events: [...giftEvents],
        disabled: roomGate,
        run: async () => {
          const list = await gift.getGiftList();
          return {
            categoryCount: list.length,
            giftCount: list.reduce(
              (sum, c) => sum + ((c as GiftCategory).giftList?.length ?? 0),
              0,
            ),
          };
        },
        snippet: `// @deprecated use refreshGiftList + giftInfoList instead
const { getGiftList } = useLiveGiftState();
const categories = await getGiftList();`,
      },
      ...buildSubscriptionCards({
        groupSlug: 'live-gift',
        hookName: 'useLiveGiftState',
        eventEnumName: 'LiveGiftEvents',
        toggle: demoToggle,
      }),
    ],
  };
}

// ---------------------------------------------------------------------------
// Public surface (single re-export point per project convention).
// ---------------------------------------------------------------------------

export const meta = { state: 'live-gift', hook: 'useLiveGiftState', title: 'Gifts & Likes', category: '6.9', source: 'LiveGiftState/LiveGiftState.ts' };
export { useLiveGiftExamples, useLiveGiftExamples as factory };
