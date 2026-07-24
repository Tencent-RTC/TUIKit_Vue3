import {
  useLiveSeatState,
  LiveSeatEvent,
  MoveSeatPolicy,
  DeviceControlPolicy,
} from 'tuikit-atomicx-vue3';
import { useEventLogSubscription } from '../services/event-log/useSubscription';
import { useDemoHandlerToggle } from '../services/event-log/useDemoHandlerToggle';
import { buildSubscriptionCards } from '../services/event-log/buildSubscriptionCards';
import { session } from '../services/session/session';
import type { ExampleGroup, StateViewDef } from '../lib/types';
import { ALL_ROLES, Role } from '../lib/types';

/**
 * 6.4 useLiveSeatState — seat management.
 *
 * Covers seat lifecycle (take / leave / lock / unlock), admin device
 * controls (open / close remote camera / microphone), local mic mute,
 * stream playback, and the four LiveSeatEvent notifications (admin
 * remotely toggling the local user's camera / microphone).
 *
 * Role convention:
 * - takeSeat / leaveSeat / muteMicrophone / unmuteMicrophone: any user
 *   (the SDK enforces seat-occupancy and permission internally).
 * - lockSeat / unlockSeat / kickUserOutOfSeat / moveUserToSeat /
 *   openRemoteCamera / closeRemoteCamera / openRemoteMicrophone /
 *   closeRemoteMicrophone: host / admin only (the SDK rejects calls
 *   from general users with a permission error; the demo does not
 *   pre-gate so the integrator sees the real error surface).
 * - startPlayStream / stopPlayStream: any user in a room.
 */
function useLiveSeatExamples(): ExampleGroup {
  const seat = useLiveSeatState();

  // Subscribe every LiveSeatEvent into the shared log.
  const seatEvents = useEventLogSubscription('live-seat', seat, LiveSeatEvent);
  const demoToggle = useDemoHandlerToggle('live-seat', seat, LiveSeatEvent);

  /** Compact, serializable view of the seat state. */
  const snapshot = () => {
    const seats = seat.seatList.value;
    const me = seats.find(s => s.userInfo?.userId === session.userId);
    return {
      seatCount: seats.length,
      occupiedCount: seats.filter(s => s.userInfo).length,
      localOnSeat: !!me,
      localSeatIndex: me ? me.index : -1,
      canvasWidth: seat.canvas.value.width,
      canvasHeight: seat.canvas.value.height,
      speakingUserCount: seat.speakingUsers.value.size,
    };
  };

  /** Humanized inspector schema for the `live-seat.state` snapshot. */
  const seatView: StateViewDef = {
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
        title: 'Room canvas',
        rows: [
          { key: 'canvasWidth', label: 'Canvas width', kind: 'number' },
          { key: 'canvasHeight', label: 'Canvas height', kind: 'number' },
        ],
      },
      {
        title: 'Seat overview',
        rows: [
          { key: 'seatCount', label: 'Total seats', kind: 'number' },
          { key: 'occupiedCount', label: 'Occupied', kind: 'number' },
          { key: 'speakingUserCount', label: 'Speaking users', kind: 'number' },
        ],
      },
    ],
  };

  return {
    state: 'live-seat',
    hook: 'useLiveSeatState',
    title: 'Seat management',
    category: '6.4',
    source: 'LiveSeatState/index.ts',
    intro: {
      summary: 'Seat lifecycle, admin device controls, and local mic mute',
      groups: [
        {
          tone: 'must',
          head: 'Key points',
          items: [
            'All seat operations require being in a room (currentLive.liveId non-empty); calling outside a room throws.',
            'takeSeat is for host/admin direct seat-grab; audience co-broadcast uses useCoGuestState.applyForSeat (which sends an application the host must accept).',
            'lockSeat / unlockSeat / kickUserOutOfSeat / moveUserToSeat / openRemoteCamera / closeRemoteCamera / openRemoteMicrophone / closeRemoteMicrophone are host/admin-only; the SDK rejects general users with a permission error.',
            'seatList / canvas are updated automatically by the SDK via onSeatLayoutChanged — you never push into them manually.',
            'speakingUsers and networkQualities are Map<string, number> / Map<string, NetworkInfo> updated in real-time by SDK events.',
          ],
        },
      ],
    },
    examples: [
      {
        id: 'live-seat.state',
        api: 'state',
        title: 'Read seat state (seatList / canvas / speakingUsers / networkQualities / avStatistics)',
        description: 'Reactive snapshot of the seat layout, canvas, speaking users, network quality, and AV statistics.',
        signature: 'seatList: Ref<SeatInfo[]> / canvas: Ref<LiveCanvas> / speakingUsers: Ref<Map<string, number>> / networkQualities: Ref<Map<string, NetworkInfo>> / avStatistics: Ref<AVStatistics[]>',
        roles: ALL_ROLES,
        requireLogin: false,
        events: [...seatEvents],
        stateView: seatView,
        successToast: false,
        run: async () => snapshot(),
        snippet: `const { seatList, canvas, speakingUsers, networkQualities, avStatistics } = useLiveSeatState();

// seatList.value → array of SeatInfo (index, isLocked, userInfo, region)
// canvas.value → { width, height, background }
// speakingUsers.value → Map<userId, volume>
// networkQualities.value → Map<userId, NetworkInfo>
// avStatistics.value → AVStatistics[]`,
      },
      {
        id: 'live-seat.takeSeat',
        api: 'takeSeat',
        title: 'Take seat',
        description: 'Host and admin directly take a seat without application. For audience and admin, [[applyForSeat|applyForSeat]] is recommended instead (sends an application the host or admin must approve).',
        signature: 'takeSeat(params: { seatIndex: number }): Promise<void>',
        roles: ALL_ROLES,
        requireLogin: true,
        events: [...seatEvents],
        // Disable when the user is already on a seat — taking a seat
        // again would be rejected by the SDK. Role-agnostic: anyone
        // already seated should leave first.
        disabled: () => {
          const me = seat.seatList.value.find(s => s.userInfo?.userId === session.userId);
          return me ? 'Card.AlreadyOnSeat' : '';
        },
        fields: [
          { key: 'seatIndex', label: 'seatIndex', type: 'number', default: 1 },
        ],
        run: async ({ inputs }) => {
          const seatIndex = Number(inputs.seatIndex) || 0;
          await seat.takeSeat({ seatIndex });
          return { seatIndex };
        },
        // No successToast: takeSeat's outcome depends on the caller's
        // role (host/admin → direct take; audience → throws). The SDK
        // also resolves the promise even when an application is sent
        // (returning a TUIRequest), so a blanket "success" toast would
        // be misleading. The card's output area shows the real result.
        successToast: false,
        snippet: `const { takeSeat } = useLiveSeatState();
await takeSeat({ seatIndex: 1 });`,
      },
      {
        id: 'live-seat.leaveSeat',
        api: 'leaveSeat',
        title: 'Leave seat',
        description: 'Leave the current seat. Releases the seat for other users.',
        signature: 'leaveSeat(): Promise<void>',
        roles: ALL_ROLES,
        requireLogin: true,
        events: [...seatEvents],
        run: async () => {
          await seat.leaveSeat();
          return { left: true };
        },
        successToast: {
          title: 'Left seat',
          description: 'You have left the seat',
        },
        snippet: `const { leaveSeat } = useLiveSeatState();
await leaveSeat();`,
      },
      {
        id: 'live-seat.lockSeat',
        api: 'lockSeat',
        title: 'Lock seat',
        description: 'Lock a seat so users cannot take it. Host / admin only.',
        signature: 'lockSeat(params: { seatIndex: number }): Promise<void>',
        roles: [Role.Host, Role.Admin],
        requireLogin: true,
        events: [...seatEvents],
        fields: [
          { key: 'seatIndex', label: 'seatIndex', type: 'number', default: 2 },
        ],
        run: async ({ inputs }) => {
          const seatIndex = Number(inputs.seatIndex) || 0;
          await seat.lockSeat({ seatIndex });
          return { seatIndex, locked: true };
        },
        successToast: {
          title: 'Seat locked',
          description: `Seat #${'{seatIndex}'} is now locked`,
        },
        snippet: `const { lockSeat } = useLiveSeatState();
await lockSeat({ seatIndex: 2 });`,
      },
      {
        id: 'live-seat.unlockSeat',
        api: 'unlockSeat',
        title: 'Unlock seat',
        description: 'Unlock a previously locked seat. Host / admin only.',
        signature: 'unlockSeat(params: { seatIndex: number }): Promise<void>',
        roles: [Role.Host, Role.Admin],
        requireLogin: true,
        events: [...seatEvents],
        fields: [
          { key: 'seatIndex', label: 'seatIndex', type: 'number', default: 2 },
        ],
        run: async ({ inputs }) => {
          const seatIndex = Number(inputs.seatIndex) || 0;
          await seat.unlockSeat({ seatIndex });
          return { seatIndex, locked: false };
        },
        successToast: {
          title: 'Seat unlocked',
          description: `Seat #${'{seatIndex}'} is now unlocked`,
        },
        snippet: `const { unlockSeat } = useLiveSeatState();
await unlockSeat({ seatIndex: 2 });`,
      },
      {
        id: 'live-seat.kickUserOutOfSeat',
        api: 'kickUserOutOfSeat',
        title: 'Kick user off seat',
        description: 'Forcefully remove a user from their seat. Host / admin only.',
        signature: 'kickUserOutOfSeat(params: { userId: string }): Promise<void>',
        roles: [Role.Host, Role.Admin],
        requireLogin: true,
        events: [...seatEvents],
        fields: [
          { key: 'userId', label: 'userId', type: 'text', default: '', required: true },
        ],
        run: async ({ inputs }) => {
          const userId = String(inputs.userId || '').trim();
          if (!userId) throw new Error('userId is required');
          await seat.kickUserOutOfSeat({ userId });
          return { userId, kicked: true };
        },
        successToast: {
          title: 'User kicked',
          description: 'The user has been removed from their seat',
        },
        snippet: `const { kickUserOutOfSeat } = useLiveSeatState();
await kickUserOutOfSeat({ userId: 'user123' });`,
      },
      {
        id: 'live-seat.moveUserToSeat',
        api: 'moveUserToSeat',
        title: 'Move user to seat',
        description: 'Move a user to a different seat with a conflict policy. Host / admin only.',
        signature: 'moveUserToSeat(params: { userId: string; targetIndex: number; policy: MoveSeatPolicy }): Promise<void>',
        roles: [Role.Host, Role.Admin],
        requireLogin: true,
        events: [...seatEvents],
        fields: [
          { key: 'userId', label: 'userId', type: 'text', default: '', required: true },
          { key: 'targetIndex', label: 'targetIndex', type: 'number', default: 0 },
          {
            key: 'policy',
            label: 'policy',
            type: 'pretty-select',
            default: MoveSeatPolicy.AbortWhenOccupied,
            options: [
              { label: 'AbortWhenOccupied', value: MoveSeatPolicy.AbortWhenOccupied, meta: 'Abort if target seat is occupied' },
              { label: 'ForceReplace', value: MoveSeatPolicy.ForceReplace, meta: 'Force replace user on target seat' },
              { label: 'SwapPosition', value: MoveSeatPolicy.SwapPosition, meta: 'Swap positions with user on target seat' },
            ],
          },
        ],
        run: async ({ inputs }) => {
          const userId = String(inputs.userId || '').trim();
          if (!userId) throw new Error('userId is required');
          const targetIndex = Number(inputs.targetIndex) || 0;
          const policy = Number(inputs.policy) as MoveSeatPolicy;
          await seat.moveUserToSeat({ userId, targetIndex, policy });
          return { userId, targetIndex, policy };
        },
        successToast: {
          title: 'User moved',
          description: 'The user has been moved to the target seat',
        },
        snippet: `import { MoveSeatPolicy } from 'tuikit-atomicx-vue3';
const { moveUserToSeat } = useLiveSeatState();
await moveUserToSeat({
  userId: 'user123',
  targetIndex: 3,
  policy: MoveSeatPolicy.ForceReplace,
});`,
      },
      {
        id: 'live-seat.openRemoteCamera',
        api: 'openRemoteCamera',
        title: 'Open remote camera (admin unlock)',
        description: 'Unlock a seated user\'s camera so they can turn it on. Host / admin only.',
        signature: 'openRemoteCamera(params: { userId: string; policy: DeviceControlPolicy }): Promise<void>',
        roles: [Role.Host, Role.Admin],
        requireLogin: true,
        events: [...seatEvents],
        fields: [
          { key: 'userId', label: 'userId', type: 'text', default: '', required: true },
        ],
        run: async ({ inputs }) => {
          const userId = String(inputs.userId || '').trim();
          if (!userId) throw new Error('userId is required');
          await seat.openRemoteCamera({ userId, policy: DeviceControlPolicy.UnlockOnly });
          return { userId, camera: 'unlocked' };
        },
        successToast: {
          title: 'Camera unlocked',
          description: 'The user can now turn on their camera',
        },
        snippet: `import { DeviceControlPolicy } from 'tuikit-atomicx-vue3';
const { openRemoteCamera } = useLiveSeatState();
await openRemoteCamera({ userId: 'user123', policy: DeviceControlPolicy.UnlockOnly });`,
      },
      {
        id: 'live-seat.closeRemoteCamera',
        api: 'closeRemoteCamera',
        title: 'Close remote camera',
        description: 'Forcefully close a seated user\'s camera. Host / admin only.',
        signature: 'closeRemoteCamera(params: { userId: string }): Promise<void>',
        roles: [Role.Host, Role.Admin],
        requireLogin: true,
        events: [...seatEvents],
        fields: [
          { key: 'userId', label: 'userId', type: 'text', default: '', required: true },
        ],
        run: async ({ inputs }) => {
          const userId = String(inputs.userId || '').trim();
          if (!userId) throw new Error('userId is required');
          await seat.closeRemoteCamera({ userId });
          return { userId, camera: 'closed' };
        },
        successToast: {
          title: 'Camera closed',
          description: 'The user\'s camera has been closed',
        },
        snippet: `const { closeRemoteCamera } = useLiveSeatState();
await closeRemoteCamera({ userId: 'user123' });`,
      },
      {
        id: 'live-seat.openRemoteMicrophone',
        api: 'openRemoteMicrophone',
        title: 'Open remote microphone (admin unlock)',
        description: 'Unlock a seated user\'s microphone so they can turn it on. Host / admin only.',
        signature: 'openRemoteMicrophone(params: { userId: string; policy: DeviceControlPolicy }): Promise<void>',
        roles: [Role.Host, Role.Admin],
        requireLogin: true,
        events: [...seatEvents],
        fields: [
          { key: 'userId', label: 'userId', type: 'text', default: '', required: true },
        ],
        run: async ({ inputs }) => {
          const userId = String(inputs.userId || '').trim();
          if (!userId) throw new Error('userId is required');
          await seat.openRemoteMicrophone({ userId, policy: DeviceControlPolicy.UnlockOnly });
          return { userId, microphone: 'unlocked' };
        },
        successToast: {
          title: 'Microphone unlocked',
          description: 'The user can now turn on their microphone',
        },
        snippet: `import { DeviceControlPolicy } from 'tuikit-atomicx-vue3';
const { openRemoteMicrophone } = useLiveSeatState();
await openRemoteMicrophone({ userId: 'user123', policy: DeviceControlPolicy.UnlockOnly });`,
      },
      {
        id: 'live-seat.closeRemoteMicrophone',
        api: 'closeRemoteMicrophone',
        title: 'Close remote microphone',
        description: 'Forcefully close a seated user\'s microphone. Host / admin only.',
        signature: 'closeRemoteMicrophone(params: { userId: string }): Promise<void>',
        roles: [Role.Host, Role.Admin],
        requireLogin: true,
        events: [...seatEvents],
        fields: [
          { key: 'userId', label: 'userId', type: 'text', default: '', required: true },
        ],
        run: async ({ inputs }) => {
          const userId = String(inputs.userId || '').trim();
          if (!userId) throw new Error('userId is required');
          await seat.closeRemoteMicrophone({ userId });
          return { userId, microphone: 'closed' };
        },
        successToast: {
          title: 'Microphone closed',
          description: 'The user\'s microphone has been closed',
        },
        snippet: `const { closeRemoteMicrophone } = useLiveSeatState();
await closeRemoteMicrophone({ userId: 'user123' });`,
      },
      {
        id: 'live-seat.muteMicrophone',
        api: 'muteMicrophone',
        title: 'Mute local microphone',
        description: 'Mute your own microphone while on seat. Only affects local audio.',
        signature: 'muteMicrophone(): Promise<void>',
        roles: ALL_ROLES,
        requireLogin: true,
        events: [...seatEvents],
        run: async () => {
          await seat.muteMicrophone();
          return { muted: true };
        },
        successToast: {
          title: 'Microphone muted',
          description: 'Your microphone is now muted',
        },
        snippet: `const { muteMicrophone } = useLiveSeatState();
await muteMicrophone();`,
      },
      {
        id: 'live-seat.unmuteMicrophone',
        api: 'unmuteMicrophone',
        title: 'Unmute local microphone',
        description: 'Unmute your own microphone while on seat.',
        signature: 'unmuteMicrophone(): Promise<void>',
        roles: ALL_ROLES,
        requireLogin: true,
        events: [...seatEvents],
        run: async () => {
          await seat.unmuteMicrophone();
          return { muted: false };
        },
        successToast: {
          title: 'Microphone unmuted',
          description: 'Your microphone is now active',
        },
        snippet: `const { unmuteMicrophone } = useLiveSeatState();
await unmuteMicrophone();`,
      },
      {
        id: 'live-seat.startPlayStream',
        api: 'startPlayStream',
        title: 'Start play stream',
        description: 'Start playing the live mix-stream into a video container.',
        signature: 'startPlayStream(params: { view: string }): Promise<void>',
        roles: ALL_ROLES,
        requireLogin: true,
        events: [...seatEvents],
        fields: [
          {
            key: 'view',
            label: 'view (container id)',
            type: 'text',
            default: 'atomicx-live-stream-content',
          },
        ],
        run: async ({ inputs }) => {
          const view = String(inputs.view || '').trim();
          if (!view) throw new Error('view is required');
          await seat.startPlayStream({ view });
          return { view, playing: true };
        },
        successToast: {
          title: 'Stream started',
          description: 'The live stream is now playing',
        },
        snippet: `const { startPlayStream } = useLiveSeatState();
await startPlayStream({ view: 'atomicx-live-stream-content' });`,
      },
      {
        id: 'live-seat.stopPlayStream',
        api: 'stopPlayStream',
        title: 'Stop play stream',
        description: 'Stop playing the live mix-stream.',
        signature: 'stopPlayStream(): Promise<void>',
        roles: ALL_ROLES,
        requireLogin: true,
        events: [...seatEvents],
        run: async () => {
          await seat.stopPlayStream();
          return { playing: false };
        },
        successToast: {
          title: 'Stream stopped',
          description: 'The live stream has been stopped',
        },
        snippet: `const { stopPlayStream } = useLiveSeatState();
await stopPlayStream();`,
      },
      ...buildSubscriptionCards({
        groupSlug: 'live-seat',
        hookName: 'useLiveSeatState',
        eventEnumName: 'LiveSeatEvent',
        toggle: demoToggle,
      }),
    ],
  };
}

// ---------------------------------------------------------------------------
// Public surface (single re-export point per project convention).
// ---------------------------------------------------------------------------

export const meta = { state: 'live-seat', hook: 'useLiveSeatState', title: 'Seat management', category: '6.4', source: 'LiveSeatState/index.ts' };
export { useLiveSeatExamples, useLiveSeatExamples as factory };
