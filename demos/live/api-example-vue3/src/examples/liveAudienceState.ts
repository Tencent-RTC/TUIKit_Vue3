import { useLiveAudienceState, LiveAudienceEvent } from 'tuikit-atomicx-vue3';
import { useEventLogSubscription } from '../services/event-log/useSubscription';
import { useDemoHandlerToggle } from '../services/event-log/useDemoHandlerToggle';
import { buildSubscriptionCards } from '../services/event-log/buildSubscriptionCards';
import type { ExampleGroup, StateViewDef } from '../lib/types';
import { ALL_ROLES, Role } from '../lib/types';

/**
 * 6.3 useLiveAudienceState —— Audience management.
 * After entering a live room, audienceList / audienceCount update in
 * real time with the events.
 */
function useLiveAudienceExamples(): ExampleGroup {
  const audience = useLiveAudienceState();

  // Always-on log subscription so every event lands in EventLog.
  const allEvents = useEventLogSubscription('live-audience', audience, LiveAudienceEvent);
  // Separate demo-handler toggle that the subscribeEvent / unsubscribeEvent
  // cards drive. Lines pushed by this toggle are prefixed with `[demo]`.
  const demoToggle = useDemoHandlerToggle('live-audience', audience, LiveAudienceEvent);

  /** Compact snapshot for the state card's Output panel. */
  const snapshot = () => ({
    audienceCount: audience.audienceCount.value,
    audienceListLength: audience.audienceList.value.length,
    audienceList: audience.audienceList.value.slice(0, 5).map(u => ({
      userId: u.userId,
      userName: u.userName,
    })),
    messageBannedCount: audience.messageBannedUserList.value.length,
    messageBannedUserList: audience.messageBannedUserList.value.slice(0, 5).map(u => ({
      userId: u.userId,
      userName: u.userName,
    })),
  });

  /** Humanized inspector schema for the `live-audience.state` snapshot. */
  const audienceView: StateViewDef = {
    live: true,
    groups: [
      {
        title: 'Audience',
        rows: [
          { key: 'audienceCount', label: 'Total audience', kind: 'count' },
          { key: 'audienceList', label: 'First 5', kind: 'list', preview: 5 },
        ],
      },
      {
        title: 'Mute',
        rows: [
          { key: 'messageBannedCount', label: 'Muted count', kind: 'count' },
          { key: 'messageBannedUserList', label: 'First 5', kind: 'list', preview: 5 },
        ],
      },
    ],
  };

  return {
    state: 'live-audience',
    hook: 'useLiveAudienceState',
    title: 'Audience management',
    category: '6.3',
    source: 'LiveAudienceState/index.ts',
    // Group-level "about this group" banner (rendered ONCE by GroupIntro.vue
    // above the cards). Verified against source: list populates only after
    // entering a room; moderation calls forward straight to RoomEngine.
    intro: {
      summary: 'The audience list does not appear on its own; success of moderation actions is decided by the underlying RoomEngine',
      groups: [
        {
          tone: 'must',
          head: 'Key points',
          items: [
            'audienceList is auto-pulled and filled once after entering a room (watches currentLive.liveId); before joining it stays an empty array.',
            'audienceCount is driven by the total room headcount and is not strictly equal to the list length: when the total exceeds 200 it is computed as `total − 1 (host)` because the local list keeps at most 200 users and the host is actively excluded from the list.',
            'Management actions (setAdministrator / revokeAdministrator / kickUserOutOfRoom / disableSendMessage) merely forward to the underlying RoomEngine; this module does NOT check permissions — a call from a non-host / non-admin is rejected directly by the lower layer.',
          ],
        },
        {
          tone: 'env',
          head: 'Common pitfalls',
          items: [
            'The local audience list keeps at most 200 users; an audience not visible in the list is not necessarily absent from the room, it is just not recorded locally.',
            'fetchAudienceList clears then rebuilds the list (not incremental append), and only has data when joined; calling it before joining yields an empty list.',
            'audienceList / audienceCount are reactive and change in real time with join / leave / mute events — do not cache them as a one-shot snapshot.',
          ],
        },
      ],
    },
    examples: [
      {
        id: 'live-audience.state',
        api: 'state',
        title: 'Read audience state (audienceList / audienceCount / messageBannedUserList)',
        description:
          'Reactive snapshot of audienceList (audience list) / audienceCount (audience count) / messageBannedUserList (muted users), updating in real time with join / leave / headcount change / mute events.',
        signature: 'audienceList / audienceCount / messageBannedUserList',
        roles: ALL_ROLES,
        requireLogin: false,
        events: [...allEvents],
        // Humanized inspector schema (see `audienceView` above) replaces
        // the raw JSON dump for this card.
        stateView: audienceView,
        // Snapshot reads run on every render via watchEffect; toasting on
        // each tick would drown the screen in noise.
        successToast: false,
        // On card open, auto-pull the audience list so the snapshot is
        // already populated without manually running fetchAudienceList first.
        // Fire-and-forget with catch: requires an active room, so a pre-pull
        // before joining silently no-ops.
        onActivate: () => {
          void audience.fetchAudienceList().catch(() => {});
        },
        // Documents the auto-pull above.
        notes: {
          summary: 'live-audience.state · auto-pull on enter',
          groups: [
            {
              tone: 'env',
              items: [
                'On entering this card, fetchAudienceList() is auto-called to pull the audience list and write it into the reactive state audienceList / audienceCount — no need to manually click the fetchAudienceList card. Data is only available after joining a room (currentLive.liveId exists).',
              ],
            },
          ],
        },
        run: () => snapshot(),
        snippet: `import { useLiveAudienceState } from 'tuikit-atomicx-vue3';

const { audienceList, audienceCount, messageBannedUserList } = useLiveAudienceState();`,
      },
      {
        id: 'live-audience.fetchAudienceList',
        api: 'fetchAudienceList',
        title: 'Fetch audience list',
        description: 'Manually pull the audience list (local audienceList keeps at most 200 users; overflow is not written). Returns the count and the first few users.',
        signature: 'fetchAudienceList(): Promise<AudienceInfo[]>',
        roles: ALL_ROLES,
        notes: {
          summary: 'fetchAudienceList · prerequisites & semantics',
          groups: [
            {
              tone: 'must',
              items: [
                'audienceList / audienceCount are reactive refs that change in real time with join / leave / headcount changes; this API is a manual on-demand pull, and local audienceList keeps at most 200 users — the two complement each other.',
                'Must be called after joining a room (currentLive.liveId exists); calling before joining yields an empty list.',
              ],
            },
          ],
        },
        events: [...allEvents],
        run: async () => {
          const list = await audience.fetchAudienceList();
          return {
            audienceCount: audience.audienceCount.value,
            listLength: list.length,
            sample: list.slice(0, 5),
          };
        },
        snippet: `import { useLiveAudienceState } from 'tuikit-atomicx-vue3';

const { audienceList, audienceCount, fetchAudienceList } = useLiveAudienceState();
const list = await fetchAudienceList();`,
      },
      {
        id: 'live-audience.setAdministrator',
        api: 'setAdministrator',
        title: 'Set as admin (host)',
        signature: 'setAdministrator(params: { userId: string }): Promise<void>',
        roles: [Role.Host],
        notes: {
          summary: 'setAdministrator · prerequisites',
          groups: [
            {
              tone: 'must',
              items: [
                'Whether it is allowed and succeeds is decided by the underlying RoomEngine (only privileged roles like host will succeed); a call before joining / from a non-host is rejected by the underlying RoomEngine.',
                'The target admin must still be in the room to take effect; the target userId should be an audience userId currently in the room.',
              ],
            },
          ],
        },
        events: ['onAdminJoined', 'onAdminLeft'],
        fields: [{ key: 'userId', label: 'userId', type: 'text', default: '', required: true, placeholder: 'Target audience userId' }],
        run: async ({ inputs }) => {
          await audience.setAdministrator({ userId: inputs.userId as string });
          return { userId: inputs.userId };
        },
        snippet: `const { setAdministrator } = useLiveAudienceState();
await setAdministrator({ userId: 'audience_1' });`,
      },
      {
        id: 'live-audience.revokeAdministrator',
        api: 'revokeAdministrator',
        title: 'Revoke admin (host)',
        signature: 'revokeAdministrator(params: { userId: string }): Promise<void>',
        roles: [Role.Host],
        notes: {
          summary: 'revokeAdministrator · prerequisites',
          groups: [
            {
              tone: 'must',
              items: [
                'Whether it is allowed and succeeds is decided by the underlying RoomEngine (only privileged roles like host will succeed); a call before joining / from a non-host is rejected by the underlying RoomEngine.',
              ],
            },
          ],
        },
        events: ['onAdminJoined', 'onAdminLeft'],
        fields: [{ key: 'userId', label: 'userId', type: 'text', default: '', required: true }],
        run: async ({ inputs }) => {
          await audience.revokeAdministrator({ userId: inputs.userId as string });
          return { userId: inputs.userId };
        },
        snippet: `const { revokeAdministrator } = useLiveAudienceState();
await revokeAdministrator({ userId: 'audience_1' });`,
      },
      {
        id: 'live-audience.kickUserOutOfRoom',
        api: 'kickUserOutOfRoom',
        title: 'Kick out of room (host / admin)',
        signature: 'kickUserOutOfRoom(params: { userId: string }): Promise<void>',
        roles: [Role.Host, Role.Admin],
        notes: {
          summary: 'kickUserOutOfRoom · prerequisites',
          groups: [
            {
              tone: 'must',
              items: [
                'Whether it is allowed and succeeds is decided by the underlying RoomEngine (only privileged roles like host / admin will succeed); a call before joining / without permission is rejected by the underlying RoomEngine.',
                'The target userId should be an audience userId currently in the room; the kicked user receives onAudienceLeft.',
              ],
            },
          ],
        },
        events: ['onAudienceLeft'],
        fields: [{ key: 'userId', label: 'userId', type: 'text', default: '', required: true }],
        run: async ({ inputs }) => {
          await audience.kickUserOutOfRoom({ userId: inputs.userId as string });
          return { kicked: inputs.userId };
        },
        snippet: `const { kickUserOutOfRoom } = useLiveAudienceState();
await kickUserOutOfRoom({ userId: 'audience_1' });`,
      },
      {
        id: 'live-audience.disableSendMessage',
        api: 'disableSendMessage',
        title: 'Mute / unmute (host / admin)',
        signature: 'disableSendMessage(params: { userId: string; isDisable: boolean }): Promise<void>',
        roles: [Role.Host, Role.Admin],
        notes: {
          summary: 'disableSendMessage · prerequisites',
          groups: [
            {
              tone: 'must',
              items: [
                'Whether it is allowed and succeeds is decided by the underlying RoomEngine (only privileged roles like host / admin will succeed); a call before joining / without permission is rejected by the underlying RoomEngine.',
                'isDisable=true mutes, false unmutes; the muted user enters messageBannedUserList, which you can observe via that ref.',
              ],
            },
          ],
        },
        events: ['onAudienceMessageDisabled'],
        fields: [
          { key: 'userId', label: 'userId', type: 'text', default: '', required: true },
          { key: 'isDisable', label: 'isDisable (mute)', type: 'boolean', default: true },
        ],
        run: async ({ inputs }) => {
          await audience.disableSendMessage({
            userId: inputs.userId as string,
            isDisable: Boolean(inputs.isDisable),
          });
          return {
            userId: inputs.userId,
            isDisable: inputs.isDisable,
            bannedCount: audience.messageBannedUserList.value.length,
          };
        },
        snippet: `const { disableSendMessage } = useLiveAudienceState();
await disableSendMessage({ userId: 'audience_1', isDisable: true });`,
      },
      ...buildSubscriptionCards({
        groupSlug: 'live-audience',
        hookName: 'useLiveAudienceState',
        eventEnumName: 'LiveAudienceEvent',
        toggle: demoToggle,
      }),
    ],
  };
}

// ---------------------------------------------------------------------------
// Public surface (single re-export point per project convention).
// ---------------------------------------------------------------------------

export const meta = { state: 'live-audience', hook: 'useLiveAudienceState', title: 'Audience management', category: '6.3', source: 'LiveAudienceState/index.ts' };
export { useLiveAudienceExamples, useLiveAudienceExamples as factory };
