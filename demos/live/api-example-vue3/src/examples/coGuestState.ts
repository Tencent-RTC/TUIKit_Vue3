import { useCoGuestState, useLiveSeatState, HostEvent, GuestEvent } from 'tuikit-atomicx-vue3';
import { useEventLogSubscription } from '../services/event-log/useSubscription';
import { useDemoHandlerToggle } from '../services/event-log/useDemoHandlerToggle';
import { buildSubscriptionCards } from '../services/event-log/buildSubscriptionCards';
import { session } from '../services/session/session';
import type { ExampleGroup, StateViewDef } from '../lib/types';
import { ALL_ROLES, Role } from '../lib/types';

/**
 * 6.4 useCoGuestState —— co-guest (the seat-up application / invitation
 * two-way link between audience and host).
 *
 * The live room is fixed to "apply-to-take-seat" mode; the standard path
 * for an audience to take a seat is this group:
 * - Audience side: applyForSeat to apply → host approves; or passively accept
 *   an inviteToSeat invitation.
 * - Host side: subscribe HostEvent.onGuestApplicationReceived to get the
 *   application → acceptApplication / rejectApplication; or actively
 *   inviteToSeat to invite an audience.
 *
 * Events span two enums: HostEvent (host side) / GuestEvent (audience side);
 * this group subscribes both into the log.
 */
function useCoGuestExamples(): ExampleGroup {
  const coGuest = useCoGuestState();
  // Seat state is consumed read-only here for "am I on seat?" reflection.
  const seat = useLiveSeatState();

  // Subscribe both event enums into the shared log.
  const hostEvents = useEventLogSubscription('co-guest', coGuest, HostEvent);
  const guestEvents = useEventLogSubscription('co-guest', coGuest, GuestEvent);
  const allEvents = [...hostEvents, ...guestEvents];

  // Demo handler toggle for the subscribe / unsubscribe cards. CoGuest is
  // the only group with two event enums; merge them into a single object so
  // the toggle treats the union as one flat event list.
  const demoToggle = useDemoHandlerToggle(
    'co-guest',
    coGuest,
    { ...HostEvent, ...GuestEvent },
  );

  /** Compact, serializable view of the co-guest state. */
  const snapshot = () => {
    const conn = coGuest.connected.value;
    // Look up the local user's seat once; both `localOnSeat` and
    // `localSeatIndex` derive from the same record. Mirrors the
    // `localSeatIndex()` helper used in `liveSeat.ts`.
    const me = seat.seatList.value.find(s => s.userInfo?.userId === session.userId);
    return {
      connectedCount: conn.length,
      applicants: coGuest.applicants.value,
      invitees: coGuest.invitees.value,
      connected: conn.slice(0, 9).map(u => ({ userId: u.userId, userName: u.userName })),
      // Surfaced for after-action visibility (acceptInvitation / disConnect /
      // applyForSeat all settle through seatList membership of the local user).
      localOnSeat: !!me,
      localSeatIndex: me ? me.index : -1,
    };
  };

  /** Humanized inspector schema for the `co-guest.state` snapshot. */
  const coGuestView: StateViewDef = {
    live: true,
    groups: [
      {
        title: 'Local seat',
        rows: [
          { key: 'localOnSeat', label: 'On seat?', kind: 'bool', onValue: true },
          {
            key: 'localSeatIndex',
            label: 'Seat index',
            kind: 'custom',
            format: (v, t) => (typeof v === 'number' && v >= 0 ? `#${v}` : t('State.Placeholder.NotOnSeat', '(not on seat)')),
          },
        ],
      },
      {
        title: 'Co-guest relations',
        rows: [
          { key: 'connected', label: 'Connected', kind: 'list', preview: 9 },
          { key: 'applicants', label: 'Pending applications', kind: 'list', preview: 9 },
          { key: 'invitees', label: 'Pending invitations', kind: 'list', preview: 9 },
        ],
      },
    ],
  };

  return {
    state: 'co-guest',
    hook: 'useCoGuestState',
    title: 'Co-guest',
    category: '6.5',
    source: 'CoGuestState.ts',
    // Group-level "about this group" banner (rendered ONCE by GroupIntro.vue
    // above the cards). Verified against source: two independent seat paths;
    // actual on-seat occupancy lives in live-seat group.
    intro: {
      summary: 'This group manages "seat application / invitation"; which seat you actually sit in is in the live-seat group',
      groups: [
        {
          tone: 'must',
          head: 'Key points',
          items: [
            'There are two independent seat-up paths: the audience actively "applies" (applyForSeat → host acceptApplication/rejectApplication) and the host actively "invites" (inviteToSeat → audience acceptInvitation/rejectInvitation). The two lines record via applyRequest / inviteRequest respectively and are NOT interchangeable.',
            '"Whether you are on seat" belongs to the live-seat group: this group\'s connected is only the on-seat user list derived from seat state; the real seat occupancy is in live-seat.',
            'Both application / invitation carry a timeout (default 30, unit per card); on timeout the request auto-disappears and fires onXxxNoResponse.',
            'Switching live rooms auto-clears all pending applications and invitations.',
          ],
        },
        {
          tone: 'env',
          head: 'Common pitfalls',
          items: [
            'applyForSeat / inviteToSeat resolving only means "request sent"; the actual seat-up happens after the peer accepts — confirm via seatList / connected.',
            'acceptApplication / acceptInvitation require the corresponding request to still be in the record; if the peer timed out / cancelled it silently no-ops.',
            'In the invitation event, "who the peer is" is hostUser (from request.fromUser) — don\'t take request.userId directly, that would be yourself being invited.',
          ],
        },
      ],
    },
    examples: [
      {
        id: 'co-guest.state',
        api: 'state',
        title: 'Read co-guest state (connected / applicants / invitees)',
        description:
          'Read-only snapshot of connected (on-seat users) / applicants (pending approval) / invitees (pending response) / candidates, updating live with application/invitation events.',
        signature: 'connected / applicants / invitees / candidates',
        roles: ALL_ROLES,
        requireLogin: false,
        events: [...allEvents],
        // Humanized inspector schema (see `coGuestView` above) replaces
        // the raw JSON dump for this card.
        stateView: coGuestView,
        // Snapshot reads run on every render via watchEffect; toasting on
        // each tick would drown the screen in noise.
        successToast: false,
        run: () => snapshot(),
        snippet: `import { useCoGuestState } from 'tuikit-atomicx-vue3';

const { connected, applicants, invitees } = useCoGuestState();`,
      },
      {
        id: 'co-guest.applyForSeat',
        api: 'applyForSeat',
        title: 'Apply for seat (audience / admin)',
        description:
          'Audience sends a seat-up application to the host. The host side must subscribe [[onGuestApplicationReceived|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onGuestApplicationReceived]] to receive it (see this group\'s host-side cards). The approval result comes back to the audience side via [[onGuestApplicationResponded|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onGuestApplicationResponded]].',
        signature: 'applyForSeat(options: { seatIndex: number; timeout: number }): Promise<void>',
        roles: [Role.Audience, Role.Admin],
        events: [...allEvents],
        // Disable when the user is already on a seat — applying again
        // would be rejected by the SDK with "already in seat". This
        // check is role-agnostic: anyone already seated (host / admin /
        // audience) should not re-apply.
        disabled: () => {
          const me = seat.seatList.value.find(s => s.userInfo?.userId === session.userId);
          return me ? 'Card.AlreadyOnSeat' : '';
        },
        notes: {
          summary: 'applyForSeat · prerequisites',
          groups: [
            {
              tone: 'must',
              items: [
                'You must first joinLive into the room (audience already in the room), then call applyForSeat to apply. Calling outside a room is rejected with an error by the underlying RoomEngine.',
                'The call itself resolves immediately, but the actual seat-up happens after the host receives it via [[onGuestApplicationReceived|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onGuestApplicationReceived]] and approves; the approval result comes back to the audience side via [[onGuestApplicationResponded|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onGuestApplicationResponded]].',
              ],
            },
          ],
        },
        // Surface a clear "your request is sent, awaiting host" cue —
        // the SDK call resolves immediately, but the on-seat transition
        // only happens after the host accepts, so without an explicit
        // toast the operator can't tell whether their applyForSeat
        // succeeded or is still in flight.
        successToast: {
          title: 'Seat application sent',
          description: 'Awaiting host approval; result returns via [[GuestEvent.onGuestApplicationResponded|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onGuestApplicationResponded]]',
        },
        fields: [
          { key: 'seatIndex', label: 'seatIndex', type: 'number', default: 1 },
          { key: 'timeout', label: 'timeout (sec)', type: 'number', default: 30, help: '0 = no timeout' },
        ],
        run: async ({ inputs }) => {
          await coGuest.applyForSeat({
            seatIndex: Number(inputs.seatIndex),
            timeout: Number(inputs.timeout),
          });
          return snapshot();
        },
        snippet: `const { applyForSeat } = useCoGuestState();
await applyForSeat({ seatIndex: 1, timeout: 30 });`,
      },
      {
        id: 'co-guest.cancelApplication',
        api: 'cancelApplication',
        title: 'Cancel seat application (audience / admin)',
        signature: 'cancelApplication(): Promise<void>',
        roles: [Role.Audience, Role.Admin],
        events: [...allEvents],
        successToast: {
          title: 'Seat application cancelled',
          description: 'The host side receives [[HostEvent.onGuestApplicationCancelled|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onGuestApplicationCancelled]]',
        },
        run: async () => {
          await coGuest.cancelApplication();
          return snapshot();
        },
        snippet: `const { cancelApplication } = useCoGuestState();
await cancelApplication();`,
      },
      {
        id: 'co-guest.acceptApplication',
        api: 'acceptApplication',
        title: 'Approve seat application (host / admin)',
        description: 'Host approves the specified applicant to take a seat.',
        signature: 'acceptApplication(options: { userId: string }): Promise<void>',
        roles: [Role.Host, Role.Admin],
        events: [...allEvents],
        successToast: {
          title: 'Application approved',
          description: 'The audience is about to take a seat; confirm in the seat state',
        },
        fields: [
          {
            key: 'userId',
            label: 'userId',
            type: 'text',
            default: '',
            required: true,
            placeholder: 'Applicant userId',
            autoFillFromEvent: {
              events: ['onGuestApplicationReceived'],
              path: 'guestUser.userId',
            },
          },
        ],
        run: async ({ inputs }) => {
          await coGuest.acceptApplication({ userId: String(inputs.userId || '') });
          return snapshot();
        },
        snippet: `const { acceptApplication } = useCoGuestState();
await acceptApplication({ userId: 'audience_1' });`,
      },
      {
        id: 'co-guest.rejectApplication',
        api: 'rejectApplication',
        title: 'Reject seat application (host / admin)',
        signature: 'rejectApplication(options: { userId: string }): Promise<void>',
        roles: [Role.Host, Role.Admin],
        events: [...allEvents],
        successToast: {
          title: 'Application rejected',
          description: 'The audience side receives [[GuestEvent.onGuestApplicationResponded|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onGuestApplicationResponded]](isAccept=false)',
        },
        fields: [
          {
            key: 'userId',
            label: 'userId',
            type: 'text',
            default: '',
            required: true,
            autoFillFromEvent: {
              events: ['onGuestApplicationReceived'],
              path: 'guestUser.userId',
            },
          },
        ],
        run: async ({ inputs }) => {
          await coGuest.rejectApplication({ userId: String(inputs.userId || '') });
          return snapshot();
        },
        snippet: `const { rejectApplication } = useCoGuestState();
await rejectApplication({ userId: 'audience_1' });`,
      },
      {
        id: 'co-guest.inviteToSeat',
        api: 'inviteToSeat',
        title: 'Invite audience to seat (host / admin)',
        description: 'Host actively invites a specified audience to co-guest.',
        signature:
          'inviteToSeat(options: { userId: string; seatIndex: number; timeout: number }): Promise<void>',
        roles: [Role.Host, Role.Admin],
        events: [...allEvents],
        successToast: {
          title: 'Co-guest invitation sent',
          description: 'Awaiting audience acceptance; result returns via [[HostEvent.onHostInvitationResponded|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onHostInvitationResponded]]',
        },
        fields: [
          { key: 'userId', label: 'userId', type: 'text', default: '', required: true, placeholder: 'Invited audience userId' },
          { key: 'seatIndex', label: 'seatIndex', type: 'number', default: 1 },
          { key: 'timeout', label: 'timeout (sec)', type: 'number', default: 30, help: '0 = no timeout' },
        ],
        run: async ({ inputs }) => {
          await coGuest.inviteToSeat({
            userId: String(inputs.userId || ''),
            seatIndex: Number(inputs.seatIndex),
            timeout: Number(inputs.timeout),
          });
          return snapshot();
        },
        snippet: `const { inviteToSeat } = useCoGuestState();
await inviteToSeat({ userId: 'audience_1', seatIndex: 1, timeout: 30 });`,
      },
      {
        id: 'co-guest.cancelInvitation',
        api: 'cancelInvitation',
        title: 'Cancel co-guest invitation (host / admin)',
        signature: 'cancelInvitation(options: { inviteeId: string }): Promise<void>',
        roles: [Role.Host, Role.Admin],
        events: [...allEvents],
        successToast: {
          title: 'Co-guest invitation withdrawn',
          description: 'The audience side receives [[GuestEvent.onHostInvitationCancelled|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onHostInvitationCancelled]]',
        },
        fields: [{ key: 'inviteeId', label: 'inviteeId', type: 'text', default: '', required: true, placeholder: 'Invitee userId' }],
        run: async ({ inputs }) => {
          await coGuest.cancelInvitation({ inviteeId: String(inputs.inviteeId || '') });
          return snapshot();
        },
        snippet: `const { cancelInvitation } = useCoGuestState();
await cancelInvitation({ inviteeId: 'audience_1' });`,
      },
      {
        id: 'co-guest.acceptInvitation',
        api: 'acceptInvitation',
        title: 'Accept co-guest invitation (audience / admin)',
        description: 'Audience accepts the host\'s co-guest invitation to take a seat.',
        signature: 'acceptInvitation(options: { inviterId: string }): Promise<void>',
        roles: [Role.Audience, Role.Admin],
        events: [...allEvents],
        successToast: {
          title: 'Invitation accepted',
          description: 'About to take a seat; confirm in the seat state',
        },
        fields: [
          {
            key: 'inviterId',
            label: 'inviterId',
            type: 'text',
            default: '',
            required: true,
            placeholder: 'Inviting host userId',
            autoFillFromEvent: {
              events: ['onHostInvitationReceived'],
              path: 'hostUser.userId',
            },
          },
        ],
        run: async ({ inputs }) => {
          await coGuest.acceptInvitation({ inviterId: String(inputs.inviterId || '') });
          return snapshot();
        },
        snippet: `const { acceptInvitation } = useCoGuestState();
await acceptInvitation({ inviterId: 'host_1' });`,
      },
      {
        id: 'co-guest.rejectInvitation',
        api: 'rejectInvitation',
        title: 'Reject co-guest invitation (audience / admin)',
        signature: 'rejectInvitation(options: { inviterId: string }): Promise<void>',
        roles: [Role.Audience, Role.Admin],
        events: [...allEvents],
        successToast: {
          title: 'Invitation rejected',
          description: 'The host side receives [[HostEvent.onHostInvitationResponded|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onHostInvitationResponded]](isAccept=false)',
        },
        fields: [
          {
            key: 'inviterId',
            label: 'inviterId',
            type: 'text',
            default: '',
            required: true,
            autoFillFromEvent: {
              events: ['onHostInvitationReceived'],
              path: 'hostUser.userId',
            },
          },
        ],
        run: async ({ inputs }) => {
          await coGuest.rejectInvitation({ inviterId: String(inputs.inviterId || '') });
          return snapshot();
        },
        snippet: `const { rejectInvitation } = useCoGuestState();
await rejectInvitation({ inviterId: 'host_1' });`,
      },
      {
        id: 'co-guest.disConnect',
        api: 'disConnect',
        title: 'Disconnect co-guest (guest leaves seat)',
        signature: 'disConnect(): Promise<void>',
        roles: [Role.Audience, Role.Admin],
        events: [...allEvents],
        successToast: {
          title: 'Left seat',
          description: 'The seat state updates accordingly',
        },
        run: async () => {
          await coGuest.disConnect();
          return snapshot();
        },
        snippet: `const { disConnect } = useCoGuestState();
await disConnect();`,
      },
      ...buildSubscriptionCards({
        groupSlug: 'co-guest',
        hookName: 'useCoGuestState',
        // CoGuest accepts a HostEvent | GuestEvent union. The signature uses the
        // union type expression; the snippet must import each enum as a concrete
        // value and dereference a real member (a union can't be imported / deref'd).
        eventEnumName: 'HostEvent | GuestEvent',
        eventEnumImports: ['HostEvent', 'GuestEvent'],
        toggle: demoToggle,
      }),
    ],
  };
}

// ---------------------------------------------------------------------------
// Public surface (single re-export point per project convention).
// ---------------------------------------------------------------------------

export const meta = { state: 'co-guest', hook: 'useCoGuestState', title: 'Co-guest', category: '6.5', source: 'CoGuestState.ts' };
export { useCoGuestExamples, useCoGuestExamples as factory };
