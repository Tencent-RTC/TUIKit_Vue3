import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { Role } from '../../lib/types';

const { t } = useUIKit();

/**
 * Recommended follow-up action for an inbound SDK event.
 *
 * When the operator gets a toast like "co-guest · onGuestApplicationReceived",
 * the obvious next step is to call `acceptApplication`. Encoding that
 * "event → API" mapping declaratively here keeps:
 * - example files focused on a single API each (no cross-card jump logic),
 * - the toast UI generic (it just renders this descriptor),
 * - role gating in one place (only the host should see "go to acceptApplication").
 *
 * If multiple actions apply the first matching role wins.
 *
 * All exports are gathered at the bottom of the file for a single, easy-to-scan
 * public surface.
 */
interface EventAction {
  /** Group slug, e.g. `co-guest`. */
  state: string;
  /** Example `api` field, e.g. `acceptApplication`. */
  apiId: string;
  /** Short call-to-action shown in the toast footer. */
  label: string;
  /** i18n key for `label`; resolved via `t(labelKey, label)` so the CTA is bilingual. */
  labelKey: string;
  /** Roles this action is offered to (omit = any role). */
  roles?: Role[];
}

/**
 * Event-name → suggested action(s). Lookup is exact-match on the event name
 * (which is unique across our state groups today).
 */
const MAP: Record<string, EventAction[]> = {
  // ===== co-guest =====
  onGuestApplicationReceived: [
    { state: 'co-guest', apiId: 'acceptApplication', label: '同意上麦申请', labelKey: 'Toast.Action.AcceptGuestApplication', roles: [Role.Host, Role.Admin] },
  ],
  onHostInvitationReceived: [
    { state: 'co-guest', apiId: 'acceptInvitation', label: '接受连麦邀请', labelKey: 'Toast.Action.AcceptHostInvitation', roles: [Role.Audience] },
  ],
  onGuestApplicationResponded: [
    // After being accepted, audience usually wants to verify on-seat status.
    { state: 'live-seat', apiId: 'state', label: '查看麦位状态', labelKey: 'Toast.Action.ViewSeatState', roles: [Role.Audience, Role.Admin] },
  ],
  onKickedOffSeat: [
    { state: 'co-guest', apiId: 'state', label: '查看连麦状态', labelKey: 'Toast.Action.ViewCoGuestState', roles: [Role.Audience, Role.Admin] },
  ],

  // ===== live-seat (derived synthetic events) =====
  remoteOnSeat: [
    { state: 'live-seat', apiId: 'state', label: '查看麦位状态', labelKey: 'Toast.Action.ViewSeatState' },
  ],
  remoteOffSeat: [
    { state: 'live-seat', apiId: 'state', label: '查看麦位状态', labelKey: 'Toast.Action.ViewSeatState' },
  ],

  // ===== live-list =====
  onLiveEnded: [
    { state: 'live-list', apiId: 'fetchLiveList', label: '刷新直播列表', labelKey: 'Toast.Action.RefreshLiveList' },
  ],
  onKickedOutOfLive: [
    { state: 'live-list', apiId: 'fetchLiveList', label: '刷新直播列表', labelKey: 'Toast.Action.RefreshLiveList' },
  ],
};

/**
 * Resolve the suggested action for a given event under a given role.
 * Returns `undefined` if there is no actionable follow-up, in which case the
 * toast stays informational (click-to-dismiss only).
 *
 * `unassigned` (no live room joined) never has role-specific
 * follow-ups: without a room, none of the "go to acceptApplication"
 * class of suggestions make sense yet. We short-circuit before
 * touching the map so callers don't need to guard.
 */
function resolveEventAction(event: string, role: Role): EventAction | undefined {
  if (role === Role.Unassigned) {
    return undefined;
  }
  const actions = MAP[event];
  if (!actions || actions.length === 0) {
    return undefined;
  }
  const match = actions.find(a => !a.roles || a.roles.includes(role));
  // Resolve the CTA label through i18n; the original Chinese string is kept
  // as the fallback so the toast still reads correctly when the key is absent.
  return match ? { ...match, label: t(match.labelKey, match.label) } : undefined;
}

// ---------------------------------------------------------------------------
// Public surface (single re-export point per project convention).
// ---------------------------------------------------------------------------

export { resolveEventAction };
export type { EventAction };
