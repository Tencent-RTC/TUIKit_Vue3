import { ref, computed, type Ref, type ComputedRef } from 'vue';
import type { SeatUserInfo } from '../../types';

// ----------------------------------------------------------------------------
// Mutual exclusion between the two CoHost invite kinds: "Invite battle" (PK)
// and "Invite connection" (plain co-host).
//
// Background:
//   Both invites are issued through the SAME SDK call (`requestHostConnection`)
//   and are only distinguished by `extensionInfo.withBattle`. Both pending
//   invites land in the SAME authoritative, reactive `invitees` list, which
//   does NOT carry the `withBattle` flag. So the invite kind cannot be told
//   apart from `invitees` alone and must be recorded separately.
//
// Rule:
//   Once a PK invite is outstanding, ALL "Invite connection" buttons are
//   disabled (but more PK invites may still be sent), and vice-versa. The two
//   kinds are mutually exclusive globally; the same kind may be sent multiple
//   times. When every invite of a kind settles (accept / reject / cancel /
//   timeout / join), `invitees` empties out and the mutual exclusion lifts
//   automatically.
//
// Why module-level + reactive:
//   The parent CoHostPanel dialog mounts BattlePanel and ConnectionPanel at the
//   same time but uses an internal `v-if`, so both tabs must share one source
//   of truth that also survives the dialog's mount/unmount cycles. A
//   module-level Vue `ref` satisfies both.
// ----------------------------------------------------------------------------

export type InviteType = 'battle' | 'connection';

// Module-level reactive map: liveId -> the invite kind last sent to it.
// Created once on module evaluation and shared by every panel instance.
const inviteTypeByLiveId = ref<Map<string, InviteType>>(new Map());

// Record the invite kind sent to a given liveId. We replace the whole Map so
// Vue reactivity reliably observes the mutation. Stale entries are harmless:
// the derived flags below intersect this map with the authoritative `invitees`
// list, so an entry whose invite has already settled is naturally filtered out.
export const markInviteType = (liveId: string, type: InviteType) => {
  const next = new Map(inviteTypeByLiveId.value);
  next.set(liveId, type);
  inviteTypeByLiveId.value = next;
};

// Derive the two mutual-exclusion flags from the authoritative, reactive
// `invitees` list. A pending invite counts as a battle (resp. connection)
// invite only when its liveId was tagged accordingly.
export const useInviteMutex = (
  invitees: Ref<SeatUserInfo[]> | ComputedRef<SeatUserInfo[]>
) => {
  const hasPendingBattleInvite = computed(() =>
    invitees.value.some(user => inviteTypeByLiveId.value.get(user.liveId) === 'battle')
  );
  const hasPendingConnectionInvite = computed(() =>
    invitees.value.some(user => inviteTypeByLiveId.value.get(user.liveId) === 'connection')
  );
  return { hasPendingBattleInvite, hasPendingConnectionInvite };
};
