import {
  useBattleState,
  useCoHostState,
  useLoginState,
  BattleEvent,
  BattleEndedReason,
} from 'tuikit-atomicx-vue3';
import { useEventLogSubscription } from '../services/event-log/useSubscription';
import { useDemoHandlerToggle } from '../services/event-log/useDemoHandlerToggle';
import { buildSubscriptionCards } from '../services/event-log/buildSubscriptionCards';
import type { ExampleGroup, FieldOption, StateViewDef } from '../lib/types';
import { ALL_ROLES, Role } from '../lib/types';

/**
 * 6.6 useBattleState —— PK battle (score / countdown / win-lose flow).
 *
 * Boundary and dependency with useCoHostState (6.5):
 * - CoHost is responsible for "establishing and tearing down cross-room
 *   connections"; Battle handles the "PK score / countdown / start-stop"
 *   on top of that connection. BattleState watches the current live room
 *   ($currentLive) at the module level: once you leave the room or switch
 *   to another room, it calls resetBattleState to clear the PK state,
 *   preventing the previous room's battleId from leaking into the new room.
 * - **Hard call-order constraint**: first establish the cross-room
 *   connection via requestHostConnection in useCoHostState, then
 *   requestBattle in this group makes sense. A PK must be initiated only
 *   after the cross-room connection is established; otherwise coHostStatus
 *   will be Disconnected and the request would be meaningless.
 * - FAQ from customers "where to read the PK score": the `battleScore`
 *   reactive (Map<userId, score>) is updated directly by the SDK's
 *   onBattleScoreChanged handler; the business side only needs to watch
 *   this reactive value — **no event subscription needed**.
 *   onBattleScoreChanged is also NOT in the BattleEvent enum.
 *
 * Role convention: Battle is a PK between broadcasters; all requests /
 * responses / endings are host-only; audience / admin can read state and
 * subscribe to events to observe the score and outcome.
 */
function useBattleExamples(): ExampleGroup {
  const battle = useBattleState();
  // Read CoHost.connected to derive the userIdList picker — a battle can only
  // target broadcasters that are already cross-room connected.
  const coHost = useCoHostState();
  const { loginUserInfo } = useLoginState();

  // Always-on log subscription (9 BattleEvent enums; onBattleScoreChanged is
  // NOT in the enum — it's handled internally as a reactive score update).
  useEventLogSubscription('battle', battle, BattleEvent);
  // Toggleable demo-handler set driven by subscribe / unsubscribe cards.
  const demoToggle = useDemoHandlerToggle('battle', battle, BattleEvent);

  /**
   * Rich-select options for `requestBattle.userIdList` — derived from
   * `coHost.connected`. Value is the target broadcaster's userId (batttle
   * uses userId to target, unlike CoHost which uses liveId).
   *
   * Empty-state placeholder guides the operator to first establish a
   * cross-room connection via the CoHost group.
   */
  const connectedHostOptions = (): FieldOption[] => {
    const list = coHost.connected.value ?? [];
    // Exclude the local user — you can't PK yourself.
    const flat: FieldOption[] = list
      .filter(u => u.userId !== loginUserInfo.value?.userId)
      .map((u) => ({
        label: u.userName || u.userId,
        value: u.userId,
        iconUrl: u.avatarUrl || undefined,
        meta: `liveId: ${u.liveId} · userId: ${u.userId}`,
      }));
    if (flat.length === 0) {
      return [{
        label: '(Please establish a cross-room connection in the co-host group first)',
        value: '',
        meta: 'Run co-host.requestHostConnection + peer acceptHostConnection first',
      }];
    }
    return flat;
  };

  /** Compact snapshot of the battle state. */
  const snapshot = () => {
    const info = battle.currentBattleInfo.value;
    // battleScore is a ReadonlyMap<userId, number>. Object form for the
    // Output panel (JSON.stringify serializes Map as `{}` otherwise).
    const scores: Record<string, number> = {};
    battle.battleScore.value.forEach((v, k) => {
      scores[k] = v;
    });
    return {
      battleId: info?.battleId ?? null,
      config: info?.config ?? null,
      startTime: info?.startTime ?? 0,
      endTime: info?.endTime ?? 0,
      // Remaining seconds until timeOver (endTime is a unix timestamp in
      // seconds; negative when PK has ended).
      remainingSeconds: info?.endTime
        ? Math.max(0, info.endTime - Math.floor(Date.now() / 1000))
        : 0,
      userCount: battle.battleUsers.value.length,
      users: battle.battleUsers.value.slice(0, 8).map(u => ({
        userId: u.userId,
        userName: u.userName,
        liveId: u.liveId,
      })),
      scores,
    };
  };

  /** Humanized inspector schema for the `battle.state` snapshot. */
  const battleView: StateViewDef = {
    live: true,
    groups: [
      {
        title: 'PK Battle',
        rows: [
          {
            key: 'battleId',
            label: 'Current PK',
            kind: 'custom',
            format: (v, t) => (v ? String(v) : t('State.Placeholder.NotStarted', '(not started)')),
          },
          {
            key: 'remainingSeconds',
            label: 'Remaining time',
            kind: 'custom',
            format: (v, t) => t('State.Unit.Seconds', { count: Number(v) || 0, defaultValue: '{{count}} sec' }),
          },
          { key: 'userCount', label: 'Broadcaster count', kind: 'count' },
          { key: 'users', label: 'Broadcasters', kind: 'list', preview: 8 },
        ],
      },
      {
        title: 'Score',
        rows: [
          {
            key: 'scores',
            label: 'Live score',
            kind: 'custom',
            format: (v, t) => {
              if (!v || typeof v !== 'object') return t('State.Empty', '(empty)');
              const entries = Object.entries(v as Record<string, unknown>);
              return entries.length
                ? entries.map(([k, val]) => `${k}: ${val}`).join('  ·  ')
                : t('State.Empty', '(empty)');
            },
          },
        ],
      },
    ],
  };

  return {
    state: 'battle',
    hook: 'useBattleState',
    title: 'PK Battle',
    category: '6.7',
    source: 'BattleState/index.ts',
    // Group-level "about this group" banner (rendered ONCE by GroupIntro.vue
    // above the cards). Verified against source: PK rides on top of cross-room
    // connection; room-switch reset is module-level; score is SDK-driven.
    intro: {
      summary: 'PK rides on cross-room connection; SDK compares scores and auto-times',
      groups: [
        {
          tone: 'must',
          head: 'Key points',
          items: [
            'PK only handles "score / countdown / start-stop" — it does NOT establish or validate the cross-room connection. The target userId comes from the already-connected peer broadcaster, so you MUST first call requestHostConnection in useCoHostState to build the connection, then requestBattle.',
            'Switching away from / leaving the live room auto-clears the PK state: currentBattleInfo is emptied, battleUsers is cleared, and battleScore is emptied, preventing the previous room\'s battleId from leaking into the new room (this is module-level behavior — the business side should NOT watch the room to reset it manually).',
            'This group does not expose a reset API. The PK state is finalized internally by two scenarios: "room switch" and "PK ended / exited". The business side does not need to maintain it manually.',
          ],
        },
        {
          tone: 'env',
          head: 'Common pitfalls',
          items: [
            'The score is not something you write: the SDK\'s onBattleScoreChanged directly rewrites the battleScore ref. It is NOT in the BattleEvent enum, so subscribeEvent never receives score updates — you should watch(battleScore).',
            'The remaining seconds are not an independent ref: the demo computes currentTime via currentBattleInfo.endTime − now; endTime is the real end timestamp.',
            'A single party exiting does NOT end the PK: only when all participating broadcasters exit, or the countdown hits zero, does onBattleEnded fire. After you exit, the others\' PK continues and the score keeps updating.',
          ],
        },
      ],
    },
    examples: [
      {
        id: 'battle.state',
        api: 'state',
        title: 'Read PK state (currentBattleInfo / battleUsers / battleScore)',
        description:
          'Snapshot of three read-only reactive values: currentBattleInfo / battleUsers / battleScore.',
        signature: 'currentBattleInfo: Ref<BattleInfo | undefined> / battleUsers: Ref<SeatUserInfo[]> / battleScore: Ref<Map<string, number>>',
        roles: ALL_ROLES,
        requireLogin: false,
        events: [...Object.values(BattleEvent)],
        // Humanized inspector schema (see `battleView` above) replaces
        // the raw JSON dump for this card.
        stateView: battleView,
        successToast: false,
        notes: {
          summary: 'battle state readout',
          groups: [
            {
              tone: 'must',
              items: [
                'battleScore (score) does NOT go through event subscription: the SDK internally updates the reactive Map via onBattleScoreChanged. The business side only needs watch(battleScore); do NOT subscribe to onBattleScoreChanged (it is not in the BattleEvent enum).',
              ],
            },
          ],
        },
        run: () => snapshot(),
        snippet: `import { useBattleState } from 'tuikit-atomicx-vue3';
import { watch } from 'vue';

const { currentBattleInfo, battleUsers, battleScore } = useBattleState();
watch(battleScore, (map) => {
  map.forEach((score, userId) => console.log(userId, score));
}, { deep: true });`,
      },
      {
        id: 'battle.requestBattle',
        api: 'requestBattle',
        title: 'Send PK invitation (host only)',
        description: 'Send a PK invitation to an already cross-room-connected peer broadcaster.',
        signature:
          'requestBattle(options: { config: { duration: number; needResponse: boolean; extensionInfo: string }; userIdList: string[]; timeout: number }): Promise<any>',
        roles: [Role.Host],
        events: [...Object.values(BattleEvent)],
        successToast: {
          title: 'PK invitation sent',
          description: 'When needResponse=true the peer triggers onBattleRequestReceived; after responding, this side triggers onBattleRequestAccept / Reject / Timeout',
        },
        notes: {
          summary: 'requestBattle · prerequisites & semantics',
          groups: [
            {
              tone: 'must',
              items: [
                'You MUST establish the cross-room connection in the co-host group first: Battle depends on the CoHost connection. If not connected, the target dropdown is empty and calling directly will make the SDK immediately judge it as disconnected and resetBattle.',
                'needResponse decides whether the response chain is used: when true the peer MUST acceptBattle / rejectBattle for it to take effect; when false the PK starts directly, skipping both sides\' response.',
              ],
            },
          ],
        },
        fields: [
          {
            key: 'userId',
            label: 'target userId',
            type: 'rich-select',
            default: '',
            options: connectedHostOptions,
            help: 'Pick from peer broadcasters connected in the co-host group',
          },
          {
            key: 'duration',
            label: 'config.duration (seconds)',
            type: 'number',
            default: 60,
            help: 'PK countdown in seconds (auto-ends on expiry)',
          },
          {
            key: 'needResponse',
            label: 'config.needResponse',
            type: 'boolean',
            default: true,
            help: 'true = peer must respond',
          },
          {
            key: 'extensionInfo',
            label: 'config.extensionInfo',
            type: 'text',
            default: '',
            placeholder: 'Optional business string passed through to the peer',
          },
          { key: 'timeout', label: 'timeout (seconds)', type: 'number', default: 30 },
        ],
        run: async ({ inputs, t }) => {
          const userId = String(inputs.userId ?? '').trim();
          if (!userId) {
            throw new Error(
              t(
                'Error.BattleUserIdEmpty',
                'target userId is empty: please run requestHostConnection in the co-host group first ' +
                  'and let the peer acceptHostConnection; only then will this card\'s dropdown have options',
              ),
            );
          }
          const result = await battle.requestBattle({
            config: {
              duration: Number(inputs.duration) || 60,
              needResponse: Boolean(inputs.needResponse),
              extensionInfo: String(inputs.extensionInfo ?? ''),
            },
            userIdList: [userId],
            timeout: Number(inputs.timeout) || 30,
          });
          // SDK returns an implementation-defined result; surface as-is.
          return {
            sent: true,
            userId,
            duration: Number(inputs.duration) || 60,
            needResponse: Boolean(inputs.needResponse),
            sdkResult: result,
          };
        },
        snippet: `import { useCoHostState, useBattleState, CoHostLayoutTemplate } from 'tuikit-atomicx-vue3';

const { requestHostConnection, connected } = useCoHostState();
const { requestBattle } = useBattleState();

// 1) Establish the cross-room connection
await requestHostConnection({
  liveId: 'target_live_id',
  layoutTemplate: CoHostLayoutTemplate.HostDynamicGrid,
  timeout: 30,
  extensionInfo: '',
});

// 2) Start the PK battle
const target = connected.value[0];
if (target) {
  await requestBattle({
    config: { duration: 60, needResponse: true, extensionInfo: '' },
    userIdList: [target.userId],
    timeout: 30,
  });
}`,
      },
      {
        id: 'battle.cancelBattleRequest',
        api: 'cancelBattleRequest',
        title: 'Cancel sent PK invitation (host only)',
        description: 'Cancel the PK invitation before the peer responds.',
        signature: 'cancelBattleRequest(options: { battleId: string; userIdList: string[] }): Promise<any>',
        roles: [Role.Host],
        events: [...Object.values(BattleEvent)],
        successToast: {
          title: 'PK invitation cancelled',
          description: 'The peer triggers onBattleRequestCancelled',
        },
        notes: {
          summary: 'cancelBattleRequest · parameter contract',
          groups: [
            {
              tone: 'must',
              items: [
                'userIdList MUST match exactly what was passed to requestBattle: cancel is a point-to-point operation; a non-matching userId is silently ignored by the SDK.',
              ],
            },
          ],
        },
        fields: [
          {
            key: 'battleId',
            label: 'battleId',
            type: 'text',
            default: '',
            required: true,
            placeholder: 'battleId to cancel',
            autoFillFromEvent: {
              events: ['onBattleRequestReceived'],
              path: 'battleId',
            },
            help: 'Auto-filled; can be overridden manually',
          },
          {
            key: 'userId',
            label: 'target userId',
            type: 'text',
            default: '',
            required: true,
            placeholder: 'Invited peer broadcaster userId',
            autoFillFromEvent: {
              events: ['onBattleRequestReceived'],
              path: 'invitee.userId',
            },
          },
        ],
        run: async ({ inputs, t }) => {
          const battleId = String(inputs.battleId ?? '').trim();
          const userId = String(inputs.userId ?? '').trim();
          if (!battleId) {
            throw new Error(t('Error.BattleIdEmpty', 'battleId cannot be empty'));
          }
          if (!userId) {
            throw new Error(t('Error.BattleTargetUserIdEmpty', 'target userId cannot be empty'));
          }
          await battle.cancelBattleRequest({ battleId, userIdList: [userId] });
          return { cancelled: true, battleId, userIdList: [userId] };
        },
        snippet: `const { cancelBattleRequest } = useBattleState();
await cancelBattleRequest({
  battleId: 'battle_id',
  userIdList: ['target_user_id'],
});`,
      },
      {
        id: 'battle.acceptBattle',
        api: 'acceptBattle',
        title: 'Accept PK invitation (host only)',
        description: 'Accept a received PK invitation.',
        signature: 'acceptBattle(options: { battleId: string }): Promise<any>',
        roles: [Role.Host],
        events: [...Object.values(BattleEvent)],
        successToast: {
          title: 'PK accepted',
          description: 'The SDK fires onBattleStarted; battleScore begins receiving updates',
        },
        fields: [
          {
            key: 'battleId',
            label: 'battleId',
            type: 'text',
            default: '',
            required: true,
            placeholder: 'Auto-filled after receiving invitation',
            autoFillFromEvent: {
              events: ['onBattleRequestReceived'],
              path: 'battleId',
            },
          },
        ],
        run: async ({ inputs, t }) => {
          const battleId = String(inputs.battleId ?? '').trim();
          if (!battleId) {
            throw new Error(t('Error.BattleIdEmpty', 'battleId cannot be empty'));
          }
          await battle.acceptBattle({ battleId });
          return {
            accepted: true,
            battleId,
            currentBattleId: battle.currentBattleInfo.value?.battleId ?? null,
          };
        },
        snippet: `import { useBattleState, BattleEvent } from 'tuikit-atomicx-vue3';

const { subscribeEvent, acceptBattle } = useBattleState();
subscribeEvent(BattleEvent.onBattleRequestReceived, async ({ battleId, inviter }) => {
  await acceptBattle({ battleId });
});`,
      },
      {
        id: 'battle.rejectBattle',
        api: 'rejectBattle',
        title: 'Reject PK invitation (host only)',
        description: 'Reject the current received onBattleRequestReceived. The peer triggers onBattleRequestReject.',
        signature: 'rejectBattle(options: { battleId: string }): Promise<any>',
        roles: [Role.Host],
        events: [...Object.values(BattleEvent)],
        successToast: {
          title: 'PK rejected',
          description: 'The peer triggers onBattleRequestReject',
        },
        fields: [
          {
            key: 'battleId',
            label: 'battleId',
            type: 'text',
            default: '',
            required: true,
            placeholder: 'Auto-filled after receiving invitation',
            autoFillFromEvent: {
              events: ['onBattleRequestReceived'],
              path: 'battleId',
            },
          },
        ],
        run: async ({ inputs, t }) => {
          const battleId = String(inputs.battleId ?? '').trim();
          if (!battleId) {
            throw new Error(t('Error.BattleIdEmpty', 'battleId cannot be empty'));
          }
          await battle.rejectBattle({ battleId });
          return { rejected: true, battleId };
        },
        snippet: `const { rejectBattle } = useBattleState();
await rejectBattle({ battleId: 'battle_id' });`,
      },
      {
        id: 'battle.exitBattle',
        api: 'exitBattle',
        title: 'Exit PK (host only)',
        description: 'Actively exit the current PK.',
        // Exit / end semantics fan out into 3 branches — not obvious
        // from the API signature, easy to design UIs against the
        // wrong assumption. Documented in notes rather than crammed
        // into description.
        notes: {
          summary: 'exitBattle · exit & end semantics',
          groups: [
            {
              tone: 'must',
              items: [
                'Single-party exit: the caller no longer counts toward the score, but the rest of the broadcasters\' PK continues and the score keeps updating normally. onBattleEnded does NOT fire.',
                'All-party exit: only when every participating broadcaster has called exitBattle does the SDK judge the PK ended and fire onBattleEnded with reason = allMemberExit.',
                'Countdown expiry: when no one exits actively and the countdown hits zero, the SDK auto-ends the PK and fires onBattleEnded with reason = timeOver.',
              ],
            },
          ],
        },
        signature: 'exitBattle(options: { battleId: string }): Promise<any>',
        roles: [Role.Host],
        events: [...Object.values(BattleEvent)],
        successToast: {
          title: 'Exited PK',
          description: 'This side\'s battleUsers updates; the SDK fires onBattleEnded depending on all-party exit',
        },
        fields: [
          {
            key: 'battleId',
            label: 'battleId',
            type: 'text',
            default: '',
            required: true,
            placeholder: 'The current PK\'s battleId',
            autoFillFromEvent: [
              {
                events: ['onBattleStarted'],
                path: 'battleInfo.battleId',
              },
              {
                events: ['onBattleRequestReceived'],
                path: 'battleId',
              },
            ],
            help: 'Auto-filled; can be overridden manually',
          },
        ],
        run: async ({ inputs, t }) => {
          const battleId = String(inputs.battleId ?? '').trim();
          if (!battleId) {
            throw new Error(t('Error.BattleIdEmpty', 'battleId cannot be empty'));
          }
          await battle.exitBattle({ battleId });
          return {
            exited: true,
            battleId,
            currentBattleId: battle.currentBattleInfo.value?.battleId ?? null,
          };
        },
        snippet: `const { exitBattle, currentBattleInfo } = useBattleState();
if (currentBattleInfo.value) {
  await exitBattle({ battleId: currentBattleInfo.value.battleId });
}`,
      },
      ...buildSubscriptionCards({
        groupSlug: 'battle',
        hookName: 'useBattleState',
        eventEnumName: 'BattleEvent',
        toggle: demoToggle,
      }),
    ],
  };
}

// ---------------------------------------------------------------------------
// Re-export BattleEndedReason so its enum values (timeOver / allMemberExit)
// can be quickly imported by cards / notes that discuss the end reason —
// consistent with the CoHost group re-exporting CoHostStatus.
// ---------------------------------------------------------------------------

export const meta = { state: 'battle', hook: 'useBattleState', title: 'PK Battle', category: '6.7', source: 'BattleState/index.ts' };
export { useBattleExamples, useBattleExamples as factory, BattleEndedReason };
