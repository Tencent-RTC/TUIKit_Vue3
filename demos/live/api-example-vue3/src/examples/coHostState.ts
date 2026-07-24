import {
  useCoHostState,
  CoHostEvent,
  CoHostStatus,
  CoHostLayoutTemplate,
} from 'tuikit-atomicx-vue3';
import { useEventLogSubscription } from '../services/event-log/useSubscription';
import { useDemoHandlerToggle } from '../services/event-log/useDemoHandlerToggle';
import { buildSubscriptionCards } from '../services/event-log/buildSubscriptionCards';
import type { ExampleGroup, FieldOption, StateViewDef } from '../lib/types';
import { ALL_ROLES, Role } from '../lib/types';

/**
 * 6.5 useCoHostState —— broadcaster cross-room connection (Cross-room connection between broadcasters).
 *
 * Boundary with useCoGuestState:
 * - CoGuest = broadcaster ↔ **same-room audience** seat-up (up/down on seat);
 * - CoHost  = broadcaster ↔ **other-room broadcasters** cross-room connection (the "connection phase before PK").
 * - CoHost focuses on establishing / tearing down / muting the cross-room connection itself;
 *   score / countdown / win-lose judgment belongs to BattleState (6.6), out of scope here.
 *
 * Role convention: the cross-room connection is a **broadcaster-to-broadcaster** behavior;
 * all request / response / end / mute actions are host-only; audience / admin can only read
 * state or subscribe to events, and cannot actively initiate the cross-room protocol.
 *
 * Key contracts (easy pitfalls):
 * - `requestHostConnection`'s target is "another broadcaster's liveId", not userId — the
 *   cross-room protocol is keyed by live room; the request is delivered to the target room's broadcaster.
 * - The `inviter` / `invitee` in the event payload are SeatUserInfo, whose `.liveId`
 *   field IS the peer room number. accept / reject / cancel use this liveId to locate the peer room in reverse.
 * - `getCoHostCandidates(cursor)` pulls the "current list of candidate broadcasters that can be
 *   invited". The SDK maintains it with an independent pagination separate from `fetchLiveList`;
 *   you must pull it once before inviting (otherwise candidates is empty → the rich-select
 *   dropdown has no options except the placeholder).
 */
function useCoHostExamples(): ExampleGroup {
  const coHost = useCoHostState();

  // Always-on event-log subscription (7 CoHost events land in EventLog).
  useEventLogSubscription('co-host', coHost, CoHostEvent);
  // Toggleable demo-handler set driven by subscribeEvent / unsubscribeEvent cards.
  const demoToggle = useDemoHandlerToggle('co-host', coHost, CoHostEvent);

  /**
   * Flatten `candidates` into a `rich-select` option grid. Each candidate is a
   * remote broadcaster the current host can invite. Value binds to the target
   * liveId (which is what `requestHostConnection` accepts).
   *
   * Empty-state placeholder guides the operator to call
   * `getCoHostCandidates` first — the candidates list is not auto-populated
   * by the state hook itself.
   */
  const candidateOptions = (): FieldOption[] => {
    const list = coHost.candidates.value ?? [];
    const flat: FieldOption[] = list.map((c) => ({
      label: c.userName || c.userId,
      value: c.liveId,
      iconUrl: c.avatarUrl || undefined,
      meta: `liveId: ${c.liveId} · userId: ${c.userId}`,
    }));
    if (flat.length === 0) {
      return [{
        label: '(Please run getCoHostCandidates to pull the candidate broadcaster list first)',
        value: '',
        meta: 'Click the getCoHostCandidates card in this group',
      }];
    }
    return flat;
  };

  /** Compact snapshot for the state card's Output panel. */
  const snapshot = () => ({
    coHostStatus: coHost.coHostStatus.value,
    connectedCount: coHost.connected.value.length,
    connected: coHost.connected.value.slice(0, 5).map(u => ({
      userId: u.userId,
      userName: u.userName,
      liveId: u.liveId,
    })),
    applicant: coHost.applicant.value
      ? {
        userId: coHost.applicant.value.userId,
        userName: coHost.applicant.value.userName,
        liveId: coHost.applicant.value.liveId,
      }
      : null,
    inviteeCount: coHost.invitees.value.length,
    invitees: coHost.invitees.value.slice(0, 5).map(u => ({
      userId: u.userId,
      liveId: u.liveId,
    })),
    candidateCount: coHost.candidates.value.length,
    candidatesCursor: coHost.candidatesCursor.value,
    mutedHosts: [...coHost.mutedHosts.value],
  });

  /** Humanized inspector schema for the `co-host.state` snapshot. */
  const coHostView: StateViewDef = {
    live: true,
    groups: [
      {
        title: 'Cross-room connection',
        rows: [
          { key: 'coHostStatus', label: 'Connection status', kind: 'enum', enumRef: CoHostStatus as unknown as Record<string, string | number>, onValue: CoHostStatus.Connected },
          {
            key: 'applicant',
            label: 'Received application',
            kind: 'custom',
            format: (v, t) =>
              v && typeof v === 'object'
                ? `${String((v as Record<string, unknown>).userName ?? '')} (${String((v as Record<string, unknown>).liveId ?? '')})`
                : t('State.Placeholder.None', '(none)'),
          },
        ],
      },
      {
        title: 'Connected / invited',
        rows: [
          { key: 'connectedCount', label: 'Connected count', kind: 'count' },
          { key: 'connected', label: 'First 5', kind: 'list', preview: 5 },
          { key: 'inviteeCount', label: 'Pending invites', kind: 'count' },
          { key: 'invitees', label: 'First 5', kind: 'list', preview: 5 },
        ],
      },
      {
        title: 'Candidates / mute',
        rows: [
          { key: 'candidateCount', label: 'Candidate broadcaster count', kind: 'count' },
          { key: 'candidatesCursor', label: 'Candidate cursor', kind: 'text' },
          { key: 'mutedHosts', label: 'Muted peers', kind: 'list', preview: 5 },
        ],
      },
    ],
  };

  return {
    state: 'co-host',
    hook: 'useCoHostState',
    title: 'Broadcaster cross-room connection',
    // The entire co-host surface (request / cancel / accept / reject /
    // exit / mute) is host-only — audience and admin can only read
    // state or subscribe to events. Surface this as a single host badge
    // on the group title instead of per-API tags.
    roles: [Role.Host],
    category: '6.6',
    source: 'CoHostState/index.ts',
    // Group-level "about this group" banner (rendered ONCE by GroupIntro.vue
    // above the cards). Verified against source: cross-room connection is keyed
    // by liveId; coHostStatus is derived; any-end disconnect ends the session.
    intro: {
      summary: 'Cross-room connection between this broadcaster and other rooms; PK is handled by BattleState',
      groups: [
        {
          tone: 'must',
          head: 'Key points',
          items: [
            'This is a "cross-room connection" between broadcasters from different rooms, NOT a same-room audience going on seat. The connection is keyed by live room (liveId); invitation / acceptance / rejection all use the peer\'s liveId, not userId.',
            'coHostStatus has only Connected / Disconnected states, auto-derived from "whether I am in the connected list" — it is NOT assigned directly by the SDK.',
            'Any single end disconnecting ends the whole connection: both ends clear connected simultaneously and both receive onCoHostUserLeft — there is no "single-party exit" concept.',
            'The candidate list and the live list pagination are NOT the same thing: getCoHostCandidates reuses the same fetchLiveList but with an independent cursor candidatesCursor (20 per page).',
          ],
        },
        {
          tone: 'env',
          head: 'Common pitfalls',
          items: [
            'If you don\'t pull the candidate list before inviting, candidates is empty and there are no options; useCoHostState auto-pulls once on init, but to get the latest you still need to run it manually.',
            'requestHostConnection returns Map<liveId, TUIConnectionCode>: only when the corresponding code is Success does invitees record this pending invitation — don\'t assume success without checking the return value.',
            'muteRemoteHostAudio only takes effect on the local playback; it does NOT notify the peer, nor does it affect the peer\'s own audience.',
          ],
        },
      ],
    },
    examples: [
      {
        id: 'co-host.state',
        api: 'state',
        title: 'Read cross-room connection state (coHostStatus / connected / applicant / invitees / candidates)',
        description: 'Snapshot of cross-room connection reactive state.',
        signature: 'coHostStatus / connected / applicant / invitees / candidates / candidatesCursor / mutedHosts',
        roles: ALL_ROLES,
        requireLogin: false,
        events: [...Object.values(CoHostEvent)],
        // Humanized inspector schema (see `coHostView` above) replaces
        // the raw JSON dump for this card.
        stateView: coHostView,
        // Snapshot re-runs on every render via watchEffect; toasting on each
        // tick would drown the screen. Same convention as other `.state` cards.
        successToast: false,
        // On card open, re-pull the cross-room candidate list to refresh the
        // `candidates` / `candidatesCursor` rows (an empty candidate list is
        // the #1 gotcha when first trying requestHostConnection). Fire-and-forget
        // with catch. The initial pull already happens on useCoHostState init
        // (when TUIRoomEngine is ready), so this just refreshes.
        onActivate: () => {
          void coHost.getCoHostCandidates('').catch(() => {});
        },
        // Documents the auto-pull above.
        notes: {
          summary: 'co-host.state · auto-pull on open',
          groups: [
            {
              tone: 'env',
              items: [
                'useCoHostState init (when TUIRoomEngine is ready) auto-calls getCoHostCandidates(\'\') to pull the candidate list; opening this card pulls again to refresh candidates / candidatesCursor — no need to click the getCoHostCandidates card manually.',
              ],
            },
          ],
        },
        run: () => snapshot(),
        snippet: `import { useCoHostState, CoHostStatus } from 'tuikit-atomicx-vue3';

const { coHostStatus, connected, applicant, invitees, candidates } = useCoHostState();
// coHostStatus.value === CoHostStatus.Connected means a cross-room link is active`,
      },
      {
        id: 'co-host.getCoHostCandidates',
        api: 'getCoHostCandidates',
        title: 'Pull candidate broadcaster list',
        description: 'Paginate and pull other broadcasters that can start a cross-room connection; result is written to the reactive candidates.',
        notes: {
          summary: 'getCoHostCandidates',
          groups: [
            {
              tone: 'must',
              items: [
                'cursor semantics: pass an empty string "" on first pull; pass the current candidatesCursor.value to continue; when at the last page candidatesCursor.value = "".',
                'The underlying layer reuses the same liveListManager.fetchLiveList pagination (20 per page) with an independent cursor candidatesCursor for continuation; if the business side has pulled the live list separately, its cursor is NOT interchangeable with this candidate cursor. You still need to run this card before requestHostConnection to obtain a usable candidate liveId.',
              ],
            },
          ],
        },
        signature: 'getCoHostCandidates(cursor: string): Promise<void>',
        roles: ALL_ROLES,
        events: [...Object.values(CoHostEvent)],
        fields: [
          {
            key: 'cursor',
            label: 'cursor',
            type: 'text',
            default: '',
            placeholder: 'Empty string on first pull; current candidatesCursor on continuation',
            help: 'Empty = from start; non-empty = paginated continuation',
          },
        ],
        successToast: {
          title: 'Candidate broadcaster list refreshed',
          description: 'You can select the target room in the requestHostConnection card\'s target dropdown',
        },
        run: async ({ inputs, t }) => {
          const cursor = String(inputs.cursor ?? '');
          await coHost.getCoHostCandidates(cursor);
          return {
            candidateCount: coHost.candidates.value.length,
            candidatesCursor: coHost.candidatesCursor.value,
            first5: coHost.candidates.value.slice(0, 5).map(c => ({
              userId: c.userId,
              userName: c.userName,
              liveId: c.liveId,
            })),
          };
        },
        snippet: `const { getCoHostCandidates, candidates, candidatesCursor } = useCoHostState();

// First fetch: pass an empty cursor
await getCoHostCandidates('');
console.log(candidates.value.length, 'candidates');

// Next page: pass the current cursor
if (candidatesCursor.value) {
  await getCoHostCandidates(candidatesCursor.value);
}`,
      },
      {
        id: 'co-host.requestHostConnection',
        api: 'requestHostConnection',
        title: 'Send cross-room connection invitation (host only)',
        description: 'Send a cross-room connection invitation to another broadcaster.',
        signature:
          'requestHostConnection(params: { liveId: string; layoutTemplate: CoHostLayoutTemplate; timeout: number; extensionInfo: string; userInfo?: {...} }): Promise<Map<string, TUIConnectionCode>>',
        roles: ALL_ROLES,
        events: [...Object.values(CoHostEvent)],
        successToast: {
          title: 'Cross-room connection invitation sent',
          description: 'The peer broadcaster receives onCoHostRequestReceived; after responding, this side triggers onCoHostRequestAccepted / Rejected / Timeout',
        },
        notes: {
          summary: 'requestHostConnection',
          groups: [
            {
              tone: 'must',
              items: [
                'The target is "the broadcaster\'s liveId", not userId: the cross-room protocol is keyed by live room; the request is delivered to the target room\'s broadcaster. The inviter / invitee.liveId in the event payload IS the peer room number.',
                'The return value is Map<liveId, TUIConnectionCode>: the SDK is batch-designed by roomIdList internally, so even a single-target invitation goes through the same entry. Only when the corresponding code is TUIConnectionCodeSuccess does the local invitees record this pending invitation — the business side should judge whether the invitation was successfully sent based on this.',
                'You MUST run getCoHostCandidates before sending: when the candidate list is empty, the target dropdown has no options except the placeholder.',
              ],
            },
          ],
        },
        fields: [
          {
            key: 'liveId',
            label: 'target liveId',
            type: 'rich-select',
            default: '',
            options: candidateOptions,
            help: 'Select from the candidate list; if empty, run getCoHostCandidates first',
          },
          {
            key: 'layoutTemplate',
            label: 'layoutTemplate',
            type: 'pretty-select',
            default: CoHostLayoutTemplate.HostDynamicGrid,
            options: [
              {
                label: 'HostDynamicGrid',
                value: CoHostLayoutTemplate.HostDynamicGrid,
                meta: 'Dynamic grid (600) · positions reflow as broadcaster count changes; common for PK',
              },
              {
                label: 'HostDynamic1v6',
                value: CoHostLayoutTemplate.HostDynamic1v6,
                meta: '1v6 dynamic (601) · broadcaster centered + 6 guests around',
              },
              {
                label: 'HostVideoLandscapeFixed2Seats',
                value: CoHostLayoutTemplate.HostVideoLandscapeFixed2Seats,
                meta: 'Landscape 2 seats (400) · fixed positions',
              },
            ],
            help: 'Mixed-stream layout template',
          },
          { key: 'timeout', label: 'timeout (seconds)', type: 'number', default: 30 },
          {
            key: 'extensionInfo',
            label: 'extensionInfo',
            type: 'text',
            default: '',
            placeholder: 'Optional business string passed through to the peer',
            help: 'Not parsed by the SDK, only passed through',
          },
        ],
        run: async ({ inputs, t }) => {
          const liveId = String(inputs.liveId ?? '').trim();
          if (!liveId) {
            throw new Error(
              t(
                'Error.CoHostLiveIdEmpty',
                'target liveId is empty: please run getCoHostCandidates to pull the candidate list first, then select the target broadcaster in the dropdown',
              ),
            );
          }
          const result = await coHost.requestHostConnection({
            liveId,
            layoutTemplate: inputs.layoutTemplate as CoHostLayoutTemplate,
            timeout: Number(inputs.timeout) || 30,
            extensionInfo: String(inputs.extensionInfo ?? ''),
          });
          // Convert Map<string, code> → plain object for the Output panel;
          // Map serializes as {} by default.
          const codes: Record<string, unknown> = {};
          result.forEach((v, k) => {
            codes[k] = v;
          });
          return {
            sent: true,
            liveId,
            perTargetCode: codes,
            inviteeCount: coHost.invitees.value.length,
          };
        },
        snippet: `import { useCoHostState, CoHostLayoutTemplate } from 'tuikit-atomicx-vue3';

const { requestHostConnection, candidates } = useCoHostState();
const target = candidates.value[0];
if (target) {
  const codes = await requestHostConnection({
    liveId: target.liveId,
    layoutTemplate: CoHostLayoutTemplate.HostDynamicGrid,
    timeout: 30,
    extensionInfo: '',
  });
  // codes: Map<targetLiveId, TUIConnectionCode>
  console.log(codes.get(target.liveId));
}`,
      },
      {
        id: 'co-host.cancelHostConnection',
        api: 'cancelHostConnection',
        title: 'Cancel sent connection invitation (host only)',
        description: 'Cancel the cross-room connection invitation before the peer responds.',
        signature: 'cancelHostConnection(params: { liveId: string }): Promise<void>',
        roles: ALL_ROLES,
        events: [...Object.values(CoHostEvent)],
        successToast: {
          title: 'Invitation cancelled',
          description: 'The peer receives onCoHostRequestCancelled; the local invitees entry is removed',
        },
        fields: [
          {
            key: 'liveId',
            label: 'target liveId',
            type: 'text',
            default: '',
            required: true,
            placeholder: 'Which room\'s invitation to cancel',
            help: 'Must match the liveId passed to requestHostConnection',
          },
        ],
        run: async ({ inputs, t }) => {
          const liveId = String(inputs.liveId ?? '').trim();
          if (!liveId) {
            throw new Error(t('Error.CoHostTargetLiveIdEmpty', 'target liveId cannot be empty'));
          }
          await coHost.cancelHostConnection({ liveId });
          return { cancelled: true, liveId };
        },
        snippet: `const { cancelHostConnection } = useCoHostState();
await cancelHostConnection({ liveId: 'target_live_id' });`,
      },
      {
        id: 'co-host.acceptHostConnection',
        api: 'acceptHostConnection',
        title: 'Accept the peer\'s connection request (host only)',
        description: 'Accept a received cross-room connection request.',
        signature: 'acceptHostConnection(params: { liveId: string }): Promise<void>',
        roles: ALL_ROLES,
        events: [...Object.values(CoHostEvent)],
        successToast: {
          title: 'Cross-room connection accepted',
          description: 'Both ends\' connected lists update; the peer triggers onCoHostRequestAccepted',
        },
        fields: [
          {
            key: 'liveId',
            label: 'inviter liveId',
            type: 'text',
            default: '',
            required: true,
            placeholder: 'The inviting broadcaster\'s liveId',
            autoFillFromEvent: {
              events: ['onCoHostRequestReceived'],
              path: 'inviter.liveId',
            },
            help: 'Auto-filled after receiving the request; can also be entered manually',
          },
        ],
        run: async ({ inputs, t }) => {
          const liveId = String(inputs.liveId ?? '').trim();
          if (!liveId) {
            throw new Error(t('Error.CoHostInviterLiveIdEmpty', 'inviter liveId cannot be empty'));
          }
          await coHost.acceptHostConnection({ liveId });
          return { accepted: true, liveId, connectedCount: coHost.connected.value.length };
        },
        snippet: `import { useCoHostState, CoHostEvent } from 'tuikit-atomicx-vue3';

const { subscribeEvent, acceptHostConnection } = useCoHostState();
subscribeEvent(CoHostEvent.onCoHostRequestReceived, async ({ inviter }) => {
  await acceptHostConnection({ liveId: inviter.liveId });
});`,
      },
      {
        id: 'co-host.rejectHostConnection',
        api: 'rejectHostConnection',
        title: 'Reject the peer\'s connection request (host only)',
        description: 'Reject a received cross-room connection request.',
        signature: 'rejectHostConnection(params: { liveId: string }): Promise<void>',
        roles: ALL_ROLES,
        events: [...Object.values(CoHostEvent)],
        successToast: {
          title: 'Rejected',
          description: 'The peer receives onCoHostRequestRejected; the local applicant is cleared',
        },
        fields: [
          {
            key: 'liveId',
            label: 'inviter liveId',
            type: 'text',
            default: '',
            required: true,
            placeholder: 'The inviting broadcaster\'s liveId',
            autoFillFromEvent: {
              events: ['onCoHostRequestReceived'],
              path: 'inviter.liveId',
            },
          },
        ],
        run: async ({ inputs, t }) => {
          const liveId = String(inputs.liveId ?? '').trim();
          if (!liveId) {
            throw new Error(t('Error.CoHostInviterLiveIdEmpty', 'inviter liveId cannot be empty'));
          }
          await coHost.rejectHostConnection({ liveId });
          return { rejected: true, liveId };
        },
        snippet: `const { rejectHostConnection } = useCoHostState();
await rejectHostConnection({ liveId: 'inviter_live_id' });`,
      },
      {
        id: 'co-host.exitHostConnection',
        api: 'exitHostConnection',
        title: 'End cross-room connection (host only)',
        description: 'Actively disconnect the current cross-room connection.',
        notes: {
          summary: 'exitHostConnection',
          groups: [
            {
              tone: 'must',
              items: [
                'Either end calling it ends the whole connection: both ends\' connected lists clear simultaneously, and both ends receive onCoHostUserLeft. There is NO "single-party exit" semantics (unlike Battle).',
                'Interaction with BattleState: if a PK is active in the room, it is recommended to properly end the battle before exiting the connection, to avoid leftover battle state. Disconnecting the cross-room connection (coHostStatus becomes Disconnected) may cascade-finalize BattleState — see BattleState\'s implementation for specifics.',
              ],
            },
          ],
        },
        signature: 'exitHostConnection(): Promise<void>',
        roles: ALL_ROLES,
        events: [...Object.values(CoHostEvent)],
        successToast: {
          title: 'Cross-room connection ended',
          description: 'Both ends\' connected lists clear; both ends receive onCoHostUserLeft',
        },
        run: async () => {
          await coHost.exitHostConnection();
          return {
            exited: true,
            coHostStatus: coHost.coHostStatus.value,
            connectedCount: coHost.connected.value.length,
          };
        },
        snippet: `const { exitHostConnection } = useCoHostState();
await exitHostConnection();`,
      },
      {
        id: 'co-host.muteRemoteHostAudio',
        api: 'muteRemoteHostAudio',
        title: 'Mute / restore peer broadcaster audio (host only)',
        description: 'Mute / restore the peer broadcaster\'s audio on the local side.',
        notes: {
          summary: 'muteRemoteHostAudio',
          groups: [
            {
              tone: 'must',
              items: [
                'Local side only: it does NOT notify the peer "you are muted", nor does it affect the audio heard by the peer\'s own audience. It is a "local playback-side listening control" — different from the mute at the push-stream layer.',
              ],
            },
          ],
        },
        signature: 'muteRemoteHostAudio(liveID: string, isMuted: boolean): Promise<void>',
        roles: ALL_ROLES,
        events: [...Object.values(CoHostEvent)],
        successToast: {
          title: 'Local playback audio adjusted',
          description: 'Only affects the local listening experience, not the peer or other audiences',
        },
        fields: [
          {
            key: 'liveId',
            label: 'remote host liveId',
            type: 'text',
            default: '',
            required: true,
            placeholder: 'A connected broadcaster\'s liveId',
            help: 'Must be a peer liveId from the connected list',
          },
          {
            key: 'isMuted',
            label: 'isMuted',
            type: 'boolean',
            default: true,
            help: 'true=mute, false=restore',
          },
        ],
        run: async ({ inputs, t }) => {
          const liveId = String(inputs.liveId ?? '').trim();
          if (!liveId) {
            throw new Error(t('Error.CoHostRemoteLiveIdEmpty', 'remote host liveId cannot be empty'));
          }
          const isMuted = Boolean(inputs.isMuted);
          await coHost.muteRemoteHostAudio(liveId, isMuted);
          return {
            liveId,
            isMuted,
            mutedHosts: [...coHost.mutedHosts.value],
          };
        },
        snippet: `const { muteRemoteHostAudio, connected } = useCoHostState();

const target = connected.value[0];
if (target) {
  await muteRemoteHostAudio(target.liveId, true);
  // To unmute: await muteRemoteHostAudio(target.liveId, false);
}`,
      },
      ...buildSubscriptionCards({
        groupSlug: 'co-host',
        hookName: 'useCoHostState',
        eventEnumName: 'CoHostEvent',
        toggle: demoToggle,
      }),
    ],
  };
}

// ---------------------------------------------------------------------------
// Re-export CoHostStatus so its enum values (Connected / Disconnected) show
// up in the Output panel as readable strings rather than raw numerics —
// consistent with the other example modules that surface enum imports at the
// top of the file.
// ---------------------------------------------------------------------------

export const meta = { state: 'co-host', hook: 'useCoHostState', title: 'Broadcaster cross-room connection', category: '6.6', source: 'CoHostState/index.ts' };
export { useCoHostExamples, useCoHostExamples as factory, CoHostStatus };
