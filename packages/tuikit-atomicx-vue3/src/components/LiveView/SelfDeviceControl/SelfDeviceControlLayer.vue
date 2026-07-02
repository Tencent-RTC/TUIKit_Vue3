<template>
  <!--
    Self device control overlay. Two presentations share the same row
    contracts (camera / microphone toggle, leave-seat, locked-by-admin
    disabled state, error state); only the chrome differs:
      - Desktop (`!isMobile`): floating popover anchored to the local
        seat, layer fills the stream-view container and computes
        placement / arrow offset against the seat geometry.
      - Mobile (`isMobile`): bottom-sheet drawer rendered via
        Teleport-to-body, so layer geometry is irrelevant in that case.
    Visibility (`visible`) gates the whole component; `open` controls
    whether the menu / drawer is currently showing.

    The parent (`LiveView`) only mounts this layer for the local
    audience member who is currently on a seat (anchor / mixer mode
    are filtered out via `showSelfDeviceMenu`), so we never have to
    worry about a host accidentally invoking `leaveSeat` here.

    All SDK writes (camera / microphone toggle, leaveSeat) live here so
    both presentations stay pure UI components. Errors are surfaced via
    `TUIToast` from a single place to keep error UX consistent.
  -->
  <div
    v-if="visible && !isMobile"
    ref="layerRef"
    class="self-seat-menu-layer"
  >
    <!--
      Desktop popover variant. Layer is `pointer-events: none` so empty
      regions never block underlying UI; only the menu itself opts back
      in via its scoped `pointer-events: auto`. Outside dismissal is
      handled by a document-level `pointerdown` listener (see
      `handleOutsidePointer`).
    -->
    <SelfDeviceControlMenu
      v-if="open"
      ref="menuRef"
      class="positioned-menu"
      :style="menuStyle"
      :placement="placement"
      :arrowOffset="arrowOffset"
      :cameraOn="cameraOn"
      :microphoneOn="microphoneOn"
      :cameraDisabled="cameraDisabled"
      :microphoneDisabled="microphoneDisabled"
      :cameraLockedByAdmin="cameraLockedByAdmin"
      :microphoneLockedByAdmin="microphoneLockedByAdmin"
      @toggle-camera="onToggleCamera"
      @toggle-microphone="onToggleMicrophone"
      @leave-seat="onLeaveSeat"
    />
  </div>
  <!--
    Mobile bottom-sheet variant. TUIDrawer self-teleports to body and
    has its own modal mask + close-on-overlay-click semantics, so we
    don't need the layer wrapper / outside-pointer plumbing here.
  -->
  <SelfDeviceControlDrawer
    v-if="visible && isMobile"
    :open="open"
    :cameraOn="cameraOn"
    :microphoneOn="microphoneOn"
    :cameraDisabled="cameraDisabled"
    :microphoneDisabled="microphoneDisabled"
    :cameraLockedByAdmin="cameraLockedByAdmin"
    :microphoneLockedByAdmin="microphoneLockedByAdmin"
    :userId="localUserId"
    :userName="localUserName"
    :avatarUrl="localAvatarUrl"
    @update:open="emit('update:open', $event)"
    @toggle-camera="onToggleCamera"
    @toggle-microphone="onToggleMicrophone"
    @leave-seat="onLeaveSeat"
  />
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useDeviceState } from '../../../states/DeviceState';
import { useLoginState } from '../../../states/LoginState';
import { useLiveSeatState } from '../../../states/LiveSeatState';
import { DeviceStatus, DeviceError } from '../../../types';
import { isMobile } from '../../../utils/env';
import SelfDeviceControlMenu from './SelfDeviceControlMenu.vue';
import SelfDeviceControlDrawer from './SelfDeviceControlDrawer.vue';

interface Props {
  // Whether the layer should mount at all (local user on a seat, etc.).
  visible: boolean;
  // Whether the menu is currently open (parent-controlled).
  open: boolean;
  // Opaque token whose value changes whenever the local seat geometry
  // changes. We don't actually read this — it's purely a re-measure
  // trigger for the watcher below.
  seatTrigger?: string;
  // Lock flags from the local user's seat (set by the host via
  // `closeRemoteDeviceByAdmin` / `lockSeatByAdmin`). When true, the SDK
  // will reject `openLocalCamera` / `unmuteLocalAudio` with errors like
  // `the seat camera is locked` (-2370). The menu uses these flags to
  // proactively disable the corresponding row and surface a clear
  // "disabled by host" message instead of letting the call fail.
  //
  // Naming uses the user-facing "camera/microphone" vocabulary (rather
  // than the SDK's "video/audio") to stay consistent with the menu's
  // own props and reduce mental translation at the prop boundary.
  cameraLockedByAdmin?: boolean;
  microphoneLockedByAdmin?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  seatTrigger: '',
  cameraLockedByAdmin: false,
  microphoneLockedByAdmin: false,
});
const emit = defineEmits<{
  (event: 'update:open', value: boolean): void;
}>();

// All hook calls grouped first, then derived computeds — keeps the
// dependency graph easy to scan top-to-bottom.
const { t } = useUIKit();
const { loginUserInfo } = useLoginState();
const { leaveSeat } = useLiveSeatState();
const {
  cameraStatus,
  microphoneStatus,
  cameraLastError,
  microphoneLastError,
  openLocalCamera,
  closeLocalCamera,
  openLocalMicrophone,
  muteLocalAudio,
  unmuteLocalAudio,
} = useDeviceState();

// Local user identity, surfaced to the H5 drawer's profile header.
// Exposed as separate computeds (rather than passing `loginUserInfo`
// directly) so the drawer stays a pure UI component with no dependency
// on the LoginState shape.
const localUserId = computed(() => loginUserInfo.value?.userId ?? '');
const localUserName = computed(() => loginUserInfo.value?.userName ?? '');
const localAvatarUrl = computed(() => loginUserInfo.value?.avatarUrl ?? '');

// "Locked by admin" exposes a host-driven kill switch for the local
// device. Once locked, the SDK rejects any attempt to (re)open the
// device until the host lifts the lock, so we treat lock as a strict
// gate around the camera / microphone controls — separate from the
// generic device-error path (camera in use, no permission, etc.).
const cameraLockedByAdmin = computed(() => props.cameraLockedByAdmin);
const microphoneLockedByAdmin = computed(() => props.microphoneLockedByAdmin);

const cameraOn = computed(() => cameraStatus.value === DeviceStatus.On);
// When the host mutes a guest, the SDK keeps `microphoneStatus === On`
// (mic device session is preserved) but flips the audio to muted via
// `muteLocalAudio('by admin')`. From the user's mental model the mic is
// effectively off, so we coerce `microphoneOn` to false in the locked
// case — this also flips the menu label from "Close" to "Open" and
// keeps the row in the "lockedByAdmin" disabled visual.
const microphoneOn = computed(() => microphoneStatus.value === DeviceStatus.On && !microphoneLockedByAdmin.value);

// A row is disabled if either:
//   1. the host has locked the matching device (UX: surface a clear
//      "disabled by host" reason and never call the SDK), or
//   2. the local device itself errored out (no permission, hardware
//      busy, etc.) — we keep the existing `*LastError` check for this.
const cameraDisabled = computed(() => cameraLockedByAdmin.value || cameraLastError.value !== DeviceError.NoError);
const microphoneDisabled = computed(() => microphoneLockedByAdmin.value || microphoneLastError.value !== DeviceError.NoError);

const layerRef = ref<HTMLDivElement | null>(null);
const menuRef = ref<InstanceType<typeof SelfDeviceControlMenu> | null>(null);

// Menu placement state. `placement` controls which side of the seat the
// menu is rendered on (and thus the arrow direction).
const placement = ref<'top' | 'bottom'>('top');
const menuLeft = ref(0);
const menuTop = ref(0);
// Arrow offset relative to the menu's own left edge (px). The arrow
// always points at the seat's horizontal center, even when the menu has
// been horizontally clamped against the container edge.
const arrowOffset = ref(24);

const menuStyle = computed(() => ({
  left: `${menuLeft.value}px`,
  top: `${menuTop.value}px`,
}));

// Visual constants kept here so the placement math and the menu's own
// SCSS can be reasoned about side by side.
const EDGE_PADDING = 8;       // Min distance from menu to container edge.
const SEAT_GAP = 8;           // Gap between menu box and seat edge.
const ARROW_SIZE = 6;         // Triangle height (must match menu SCSS).
const ARROW_EDGE_INSET = 14;  // Keep arrow off the menu's rounded corners.
// Fallback dimensions used only on the very first measurement frame
// before the menu DOM has laid out. Must stay in rough sync with the
// menu's SCSS to avoid the placement flipping (top<->bottom) between
// phase 1 and phase 2 on space-constrained viewports:
//   width  = menu min-width
//   height = menu padding × 2 + row count × (row padding × 2 + line-height)
// Current menu has 3 rows (camera, microphone, leave-seat), each
// 8px*2 padding + 20px line-height = 36px → 12 + 3*36 = 120px.
const FALLBACK_MENU_W = 168;
const FALLBACK_MENU_H = 120;

// Locate the local user's seat element. We scope the search to the
// current layer's parent (the LiveView container) so that having
// multiple LiveView instances on the same page (e.g. a primary feed
// and a small-window preview) doesn't accidentally pick up the wrong
// seat element. We deliberately do NOT fall back to a document-wide
// query: returning null lets the next placement frame retry once the
// DOM is ready, instead of risking a wrong-instance match.
function findSelfSeatElement(): HTMLElement | null {
  const scope = layerRef.value?.parentElement;
  if (!scope) return null;
  return scope.querySelector<HTMLElement>('.self-seat-clickable');
}

// Pure geometry calculation extracted so it can run synchronously before
// the menu DOM exists (with fallback dimensions) and again with measured
// dimensions after layout. Returns null when the seat element is not
// reachable yet.
function computePlacement(useMeasuredMenu: boolean): {
  placement: 'top' | 'bottom';
  menuLeft: number;
  menuTop: number;
  arrowOffset: number;
} | null {
  if (!layerRef.value) return null;
  const seatEl = findSelfSeatElement();
  if (!seatEl) return null;

  const layerRect = layerRef.value.getBoundingClientRect();
  const seatRect = seatEl.getBoundingClientRect();
  const containerW = layerRect.width;
  const containerH = layerRect.height;
  const seatLeft = seatRect.left - layerRect.left;
  const seatTop = seatRect.top - layerRect.top;
  const seatW = seatRect.width;
  const seatH = seatRect.height;
  if (seatW === 0 || seatH === 0) return null;

  // Use measured menu only after it's laid out; otherwise fall back to
  // the constants so the very first paint is already in the right
  // ballpark (avoids the "menu flashes at 0,0 then jumps" artifact).
  const menuEl = useMeasuredMenu ? ((menuRef.value?.$el as HTMLElement | undefined) ?? null) : null;
  const menuW = menuEl?.offsetWidth || FALLBACK_MENU_W;
  const menuH = menuEl?.offsetHeight || FALLBACK_MENU_H;

  const seatCenterX = seatLeft + seatW / 2;
  const seatBottom = seatTop + seatH;
  const spaceAbove = seatTop;
  const spaceBelow = containerH - seatBottom;
  const menuFootprint = menuH + ARROW_SIZE + SEAT_GAP + EDGE_PADDING;

  let placementOut: 'top' | 'bottom' = 'top';
  if (spaceAbove < menuFootprint && spaceBelow >= menuFootprint) {
    placementOut = 'bottom';
  } else if (spaceAbove < menuFootprint && spaceBelow < menuFootprint) {
    placementOut = spaceBelow > spaceAbove ? 'bottom' : 'top';
  }

  let topPx = placementOut === 'top'
    ? seatTop - menuH - ARROW_SIZE - SEAT_GAP
    : seatBottom + ARROW_SIZE + SEAT_GAP;
  topPx = Math.max(EDGE_PADDING, Math.min(topPx, containerH - menuH - EDGE_PADDING));

  let leftPx = seatCenterX - menuW / 2;
  leftPx = Math.max(EDGE_PADDING, Math.min(leftPx, containerW - menuW - EDGE_PADDING));

  const rawArrow = seatCenterX - leftPx;
  const arrow = Math.max(ARROW_EDGE_INSET, Math.min(rawArrow, menuW - ARROW_EDGE_INSET));

  return { placement: placementOut, menuLeft: leftPx, menuTop: topPx, arrowOffset: arrow };
}

// Apply a freshly-computed placement to the reactive refs that drive
// the template. Splitting this out keeps the watcher logic compact.
function applyPlacement(p: ReturnType<typeof computePlacement>) {
  if (!p) return;
  placement.value = p.placement;
  menuLeft.value = p.menuLeft;
  menuTop.value = p.menuTop;
  arrowOffset.value = p.arrowOffset;
}

// Two-phase placement to avoid the visual jitter that made click hits
// unreliable:
//   Phase 1 (sync): compute with FALLBACK menu dimensions, BEFORE the
//     menu element is even mounted. This means the first frame the
//     menu is visible it already lands at the correct position.
//   Phase 2 (post-paint): re-measure with the actual rendered menu
//     size and adjust if needed. Most of the time both phases agree;
//     the tiny correction only happens once and is invisible.
async function recomputePlacement() {
  if (!props.open || !props.visible || !layerRef.value) return;
  // Phase 1 — synchronous, runs before the menu is even painted.
  applyPlacement(computePlacement(false));
  // Phase 2 — after the menu has laid out, refine with measured size.
  await nextTick();
  if (!props.open) return;
  applyPlacement(computePlacement(true));
}

async function onToggleCamera() {
  // `cameraDisabled` already covers `cameraLockedByAdmin` and the
  // device-error path. Bailing out here matches the menu's visual
  // disabled state and prevents fire-and-forget SDK calls that would
  // be rejected with `the seat camera is locked` (-2370).
  if (cameraDisabled.value) {
    return;
  }
  try {
    if (cameraOn.value) {
      await closeLocalCamera();
    } else {
      await openLocalCamera();
    }
  } catch (e) {
    // Errors are surfaced via cameraLastError; menu reflects disabled state on next render.
    console.warn('[SelfDeviceControl] toggleCamera failed:', e);
  }
}

async function onToggleMicrophone() {
  // Same gating logic as the camera path: skip the SDK call entirely
  // when the host has locked the seat audio, otherwise the SDK rejects
  // unmute / open with `seat audio is locked`.
  if (microphoneDisabled.value) {
    return;
  }
  try {
    if (microphoneOn.value) {
      // Align with MicButton: only mute (do not close mic device) to keep the
      // takeSeat audio session alive and avoid re-prompting system permissions.
      await muteLocalAudio();
    } else {
      await openLocalMicrophone();
      await unmuteLocalAudio();
    }
  } catch (e) {
    console.warn('[SelfDeviceControl] toggleMicrophone failed:', e);
  }
}

// Leave-seat is the only terminal action in the menu — once it
// resolves the parent will unmount the layer (visible flips false on
// `isOnSeat`). Closing the menu first makes the success path feel
// instantaneous; on failure we re-open it so the user has a chance to
// retry, and surface the reason via Toast.
//
// Toggle actions (camera / microphone), in contrast, deliberately keep
// the menu open so users can perform multiple adjustments in a row.
async function onLeaveSeat() {
  emit('update:open', false);
  try {
    await leaveSeat();
  } catch (e) {
    console.warn('[SelfDeviceControl] leaveSeat failed:', e);
    TUIToast.error({ message: t('LiveView.SelfDeviceMenu.LeaveSeatFailed') });
    // Re-open ONLY if the layer is still alive. During the
    // `await leaveSeat()` window the user may have e.g. tapped a
    // different seat or been kicked out, in which case `visible`
    // already flipped false and we don't want to force the menu
    // back into a stale state.
    if (props.visible) {
      emit('update:open', true);
    }
  }
}

// ---------------------------------------------------------------------
// Desktop-only behavior below. Mobile uses TUIDrawer which has its own
// modal mask + close-on-tap, and never uses seat-relative placement,
// so we early-return on mobile from each watcher / observer to keep
// the dependency graph tight on H5.
// ---------------------------------------------------------------------

// Outside dismissal ---------------------------------------------------
//
// Single document-level listener handles every dismissal case:
//   - Tap inside the menu (`.self-device-menu`) → ignore (menu rows
//     handle their own actions).
//   - Tap on the local user's own seat (`.self-seat-clickable`) →
//     ignore here; the seat <div>'s `handleSeatClick` in the parent
//     toggles the menu (so a second tap on the seat closes it).
//   - Anything else (other seats, LiveView background, host page UI)
//     → close the menu.
//
// We listen on `pointerdown` (snappier than `click` and fires before
// the click sequence) in the bubbling phase, so the seat <div>'s click
// handler in the parent can still run normally. We do NOT call
// preventDefault — outside clicks should stay functional for the host
// page (chat input focus, gift buttons, etc.); we only dismiss the menu.
function handleOutsidePointer(event: Event) {
  const target = event.target as Element | null;
  if (target?.closest('.self-device-menu')) return;
  if (target?.closest('.self-seat-clickable')) return;
  emit('update:open', false);
}

// Auto-close when the layer becomes invisible (parent flipped `visible`
// to false, e.g. user left the seat by some external path).
watch(
  () => props.visible,
  (v) => {
    if (!v && props.open) {
      emit('update:open', false);
    }
  },
);

// Recompute placement when the menu transitions from closed to open.
// We deliberately do NOT recompute on every `seatTrigger` change while
// the menu is open: seat regions can wobble by sub-pixel amounts as
// streams render, and re-positioning the menu under the user's cursor
// makes hit-targets feel "slippery" (clicks miss because the row moved
// out from under the pointer between mousedown and mouseup). The menu
// is short-lived UI; freezing its position once opened is the right
// trade-off.
watch(
  () => props.open,
  (isOpen) => {
    if (isMobile) return;
    if (isOpen) void recomputePlacement();
  },
);

// Observe layer (== container) resizes for orientation / fullscreen
// transitions. We debounce updates while the menu is open so a chain
// of resize ticks (e.g. iOS landscape rotate) doesn't keep nudging
// the menu under the user's finger. A single delayed update at the
// end of a resize burst is enough: by then the layout has settled.
let resizeObserver: ResizeObserver | null = null;
let resizeDebounceTimer: number | null = null;
watch(
  layerRef,
  (el, _old, onCleanup) => {
    if (isMobile || !el) return;
    resizeObserver = new ResizeObserver(() => {
      if (!props.open) {
        // While closed, no-op — the next open will recompute fresh.
        return;
      }
      if (resizeDebounceTimer !== null) {
        window.clearTimeout(resizeDebounceTimer);
      }
      resizeDebounceTimer = window.setTimeout(() => {
        resizeDebounceTimer = null;
        void recomputePlacement();
      }, 120);
    });
    resizeObserver.observe(el);
    onCleanup(() => {
      resizeObserver?.disconnect();
      resizeObserver = null;
      if (resizeDebounceTimer !== null) {
        window.clearTimeout(resizeDebounceTimer);
        resizeDebounceTimer = null;
      }
    });
  },
);

// Mount/unmount the dismissal listener in lockstep with `open`.
watch(
  () => props.open,
  (open) => {
    if (isMobile) return;
    if (open) {
      document.addEventListener('pointerdown', handleOutsidePointer);
    } else {
      document.removeEventListener('pointerdown', handleOutsidePointer);
    }
  },
);

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleOutsidePointer);
  resizeObserver?.disconnect();
  if (resizeDebounceTimer !== null) {
    window.clearTimeout(resizeDebounceTimer);
    resizeDebounceTimer = null;
  }
});
</script>

<style scoped lang="scss">
.self-seat-menu-layer {
  // Full-bleed overlay over the stream view container. Coordinates used
  // by the placement math are relative to this element.
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  // Above `.live-core-ui` (1) and `.center-overlay` (5), below modal
  // overlays (`.entering-room-loading`/`.voice-chat-overlay`/
  // `.anchor-away-overlay` at 10, `.autoplay-prompt-overlay` at 11).
  z-index: 6;
}

// Position the menu in absolute coordinates against the layer. The menu's
// own scoped style owns `pointer-events: auto` so clicks land on rows.
// The layer itself stays `pointer-events: none`, so taps that visually
// land outside the menu pass through to whatever is underneath (usually
// the local seat or surrounding UI), and the document-level outside
// listener handles dismissal.
:deep(.positioned-menu) {
  position: absolute;
  z-index: 1;
}
</style>
