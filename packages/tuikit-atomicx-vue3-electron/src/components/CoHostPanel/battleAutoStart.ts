import { ref, computed } from 'vue';

// ----------------------------------------------------------------------------
// Shared "battle auto-start in progress" signal between BattlePanel and
// ConnectionPanel.
//
// Background:
//   A PK initiated from the Battle tab is a two-phase flow. An "Invite battle"
//   first establishes a plain co-host connection (`withBattle: true`), and only
//   AFTER every accepter has actually connected does BattlePanel fire ONE
//   aggregated `requestBattle` (`needResponse: false`) to truly start the PK.
//   Between "connection established" and "onBattleStarted" the CoHostPanel
//   auto-switches to the Connection tab, whose footer shows a "Start battle"
//   button. Clicking it in that window issues a SECOND `requestBattle` for the
//   same round, which the SDK rejects as a duplicate and surfaces a
//   "Request battle failed" toast.
//
// Fix:
//   BattlePanel owns the auto-start lifecycle and keeps this flag in sync at
//   every transition of its round bookkeeping (invites pending, accepters
//   waiting to connect, the connection-ready safety timer armed, or the
//   aggregated requestBattle in flight). ConnectionPanel reads it to disable
//   its "Start battle" button (and to guard the handler) for the whole
//   auto-start window, so the two `requestBattle` paths can never collide.
//   Note: this intentionally does NOT block sending more "Invite battle"
//   invitations to other hosts — multiple hosts may be invited at once and
//   every accepter joins the same aggregated PK.
//
// Why module-level + reactive:
//   The CoHostPanel dialog uses an internal `v-if`, so both panels mount and
//   unmount together; a module-level Vue `ref` is the single source of truth
//   that survives those cycles and is shared across both panels. Mirrors the
//   same pattern used by `inviteMutex.ts`.
//
// Mirrors the identical module in
// `uikit-component-vue3/.../battleAutoStart.ts` to keep the three-end
// (Web kit / Mac kit / Win demo) PK invite flow behavior aligned.
// ----------------------------------------------------------------------------

const battleAutoStartInProgress = ref(false);

// Set by BattlePanel at every transition of its auto-start bookkeeping.
export const setBattleAutoStartInProgress = (value: boolean) => {
  battleAutoStartInProgress.value = value;
};

// Defensive reset, called when the local host leaves the co-host connection or
// the live room (and when a battle starts/ends), so a stale flag can never
// leave "Start battle" disabled into the next session.
export const resetBattleAutoStart = () => {
  battleAutoStartInProgress.value = false;
};

export const useBattleAutoStart = () => {
  const isBattleAutoStartInProgress = computed(() => battleAutoStartInProgress.value);
  return { isBattleAutoStartInProgress };
};
