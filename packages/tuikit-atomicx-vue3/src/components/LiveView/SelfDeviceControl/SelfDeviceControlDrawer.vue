<template>
  <!--
    H5 / mobile bottom-sheet variant of the self-device control menu.
    Visually a floating card anchored near the bottom of the viewport
    (with side / bottom insets so the live stream behind stays visible),
    rendered through TUIDrawer for the slide-in animation + modal mask
    + close-on-outside-tap behavior. Same row contracts as the desktop
    popover (camera / microphone toggle, locked-by-admin disabled state,
    error state, leave-seat) — only the chrome differs.

    This component is intentionally presentational: identity (userId /
    userName / avatarUrl) and the leave-seat action come in via props /
    events from `SelfDeviceControlLayer`, which owns the SDK calls.
    Keeping the drawer free of `useLoginState` / `useLiveSeatState`
    side-channels makes it trivially mockable in tests and avoids a
    second SDK-write surface diverging from the popover's behavior.
  -->
  <TUIDrawer
    :modelValue="open"
    direction="btt"
    :size="drawerSize"
    :showClose="false"
    appendToBody
    customClass="self-device-drawer"
    @update:modelValue="onUpdateOpen"
  >
    <div class="self-device-drawer-card">
      <!-- Profile row: avatar + name + id. Mirrors the reference design;
           kept compact so the card stays within ~190px tall. -->
      <div class="profile-row">
        <div class="avatar">
          <img
            v-if="avatarUrl && !avatarFailed"
            :src="avatarUrl"
            :alt="userName"
            @error="avatarFailed = true"
          />
          <span v-else class="avatar-fallback">{{ userInitial }}</span>
        </div>
        <div class="profile-text">
          <div class="profile-name">{{ userName }}</div>
          <div v-if="userId" class="profile-id">ID: {{ userId }}</div>
        </div>
      </div>

      <!--
        Action row: horizontal icon buttons. Each action is a column of
        (icon chip + caption). Disabled-by-host states render the chip
        muted but still keep tappable target-size; the click handler
        bails out internally. The "leave seat" action mirrors the
        reference's red-tinted hangup affordance: only the icon is
        tinted (chip background stays neutral) so it reads as part of
        the same visual set with danger purely as a semantic accent.
      -->
      <div class="action-row">
        <button
          type="button"
          class="action-button"
          :class="{ 'is-disabled': microphoneDisabled }"
          @click="onMicrophoneClick"
        >
          <span class="icon-chip">
            <component :is="microphoneOn ? IconMicOn : IconMicrophoneMute" :size="22" />
          </span>
          <span class="caption">{{ microphoneLabel }}</span>
        </button>
        <button
          type="button"
          class="action-button"
          :class="{ 'is-disabled': cameraDisabled }"
          @click="onCameraClick"
        >
          <span class="icon-chip">
            <component :is="cameraOn ? IconCameraOn : IconCameraOff" :size="22" />
          </span>
          <span class="caption">{{ cameraLabel }}</span>
        </button>
        <button
          type="button"
          class="action-button is-danger"
          @click="onLeaveSeatClick"
        >
          <span class="icon-chip">
            <IconCallVoice :size="22" />
          </span>
          <span class="caption">{{ t('LiveView.SelfDeviceMenu.LeaveSeat') }}</span>
        </button>
      </div>
    </div>
  </TUIDrawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  IconCameraOn,
  IconCameraOff,
  IconMicOn,
  IconMicrophoneMute,
  IconCallVoice,
  TUIDrawer,
  useUIKit,
} from '@tencentcloud/uikit-base-component-vue3';
import { useCameraLabel, useMicrophoneLabel } from './useDeviceLabels';

interface Props {
  open: boolean;
  cameraOn: boolean;
  microphoneOn: boolean;
  cameraDisabled: boolean;
  microphoneDisabled: boolean;
  cameraLockedByAdmin?: boolean;
  microphoneLockedByAdmin?: boolean;
  // Identity for the profile header. Optional so tests / consumers can
  // omit them and the component still renders without identity chrome.
  userId?: string;
  userName?: string;
  avatarUrl?: string;
}

const props = withDefaults(defineProps<Props>(), {
  cameraLockedByAdmin: false,
  microphoneLockedByAdmin: false,
  userId: '',
  userName: '',
  avatarUrl: '',
});
const emit = defineEmits<{
  (event: 'update:open', value: boolean): void;
  (event: 'toggle-camera'): void;
  (event: 'toggle-microphone'): void;
  (event: 'leave-seat'): void;
}>();

const { t } = useUIKit();

// Drawer height. The card itself is shorter than this; TUIDrawer needs
// enough height to host the floating card + bottom safe-area inset.
const drawerSize = '220px';

// Track avatar load failures locally so a broken `avatarUrl` falls
// back to the initial-letter chip on the next render. Reset whenever
// `avatarUrl` changes so a subsequent valid URL gets a fresh attempt.
const avatarFailed = ref(false);
watch(() => props.avatarUrl, () => { avatarFailed.value = false; });

// Display name falls back to userId if no nickname is set; the initial
// chip uses the first character of whichever string was finally chosen.
const userName = computed(() => props.userName || props.userId || '');
const userInitial = computed(() => {
  const source = userName.value;
  return source ? source.charAt(0).toUpperCase() : '';
});

// Reuse the same label precedence rules as the desktop popover. Each
// device gets its own computed so a state change on one side never
// invalidates the other side's label cache.
const { label: cameraLabel } = useCameraLabel(() => ({
  cameraOn: props.cameraOn,
  cameraDisabled: props.cameraDisabled,
  cameraLockedByAdmin: props.cameraLockedByAdmin,
}));
const { label: microphoneLabel } = useMicrophoneLabel(() => ({
  microphoneOn: props.microphoneOn,
  microphoneDisabled: props.microphoneDisabled,
  microphoneLockedByAdmin: props.microphoneLockedByAdmin,
}));

function onUpdateOpen(value: boolean) {
  emit('update:open', value);
}

function onCameraClick() {
  if (props.cameraDisabled) return;
  emit('toggle-camera');
}

function onMicrophoneClick() {
  if (props.microphoneDisabled) return;
  emit('toggle-microphone');
}

function onLeaveSeatClick() {
  // No `disabled` gate: leave-seat must always be reachable, even if
  // the host has locked the user's devices.
  emit('leave-seat');
}
</script>

<style lang="scss">
// Drawer styles. We can't use `scoped` because TUIDrawer renders its
// content via Teleport, so scoped data-v attributes wouldn't reach the
// teleported nodes. We target a `.self-device-drawer` root class
// supplied through `customClass` so the rules don't leak into other
// drawers.
//
// Note: TUIDrawer's `customClass` is applied to the *overlay* (modal
// mask) wrapper, NOT the drawer container — descendant selectors below
// reach into `.tui-drawer-container` from there.
.self-device-drawer {
  // `customClass` lands on the modal overlay (mask) wrapper, so this
  // selector tints the mask itself. We use `--bg-color-mask` to match
  // other H5 surfaces in this app (e.g. the audience-list drawer at
  // `live/demos/web-vite-vue3/src/TUILiveKit/base-component/Drawer.vue`)
  // — the default `--uikit-color-black-8` from TUIDrawer is too faint
  // to read as "the rest of the screen is dimmed".
  &.tui-drawer-overlay-modal {
    background-color: var(--bg-color-mask) !important;
  }

  // Make the drawer container itself transparent and chrome-less so
  // the visible "card" is purely the inner element. This matches the
  // reference design where the floating card has bottom / side insets
  // and the live stream behind remains partially visible around it.
  .tui-drawer-container {
    background-color: transparent !important;
    box-shadow: none !important;
    // Default container has padding around content/header; reset so
    // our inner card controls all spacing.
    padding: 0 !important;
    // Let taps in the transparent area around the floating card pass
    // through to the overlay (which then closes the drawer via
    // `closeOnClickModal`). The card itself opts back in below.
    pointer-events: none;
  }

  // Hide the empty header (we don't pass title/header slot, but the
  // wrapper still renders an empty 1-row block by default, which would
  // create unwanted whitespace above the card).
  .tui-drawer-header {
    display: none !important;
  }

  .tui-drawer-content {
    // Push the card to the bottom of the drawer rectangle so it sits
    // visually above the safe-area edge, leaving the upper portion of
    // the drawer transparent (visually the live stream stays visible).
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    height: 100%;
    padding: 0 !important;
  }

  .self-device-drawer-card {
    margin: 0 12px calc(12px + env(safe-area-inset-bottom));
    padding: 16px;
    border-radius: 20px;
    background-color: var(--bg-color-operate);
    // A subtle shadow lifts the card off the (transparent) drawer
    // backdrop so it reads as floating, not pinned to a tray.
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
    color: var(--text-color-primary);
    // Re-enable pointer events for the card itself (the surrounding
    // container is `pointer-events: none` so taps outside the card
    // pass through to the overlay and dismiss the drawer).
    pointer-events: auto;
  }

  // Profile row -----------------------------------------------------
  .profile-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 4px 4px 16px;
  }

  .avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    background-color: var(--bg-color-function);
    display: inline-flex;
    align-items: center;
    justify-content: center;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .avatar-fallback {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-color-primary);
      // Keep a stable color so the initial doesn't read as a "real" name.
      opacity: 0.85;
    }
  }

  .profile-text {
    flex: 1;
    min-width: 0;
  }

  .profile-name {
    font-size: 16px;
    line-height: 22px;
    font-weight: 600;
    color: var(--text-color-primary);
    // Truncate long names instead of wrapping; the drawer card's
    // height is fixed, so wrapping would push the action row down.
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .profile-id {
    font-size: 12px;
    line-height: 18px;
    color: var(--text-color-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-top: 2px;
  }

  // Action row ------------------------------------------------------
  .action-row {
    display: flex;
    // Stretch each column to the same height so captions of different
    // line counts ("开启麦克风" vs "麦克风被禁用") don't make some
    // buttons taller than others — caption boxes fill the remaining
    // vertical space below the icon and stay vertically aligned across
    // the whole row.
    align-items: stretch;
    // Pack buttons left-to-right with a fixed gap; each button keeps
    // its intrinsic width (icon + capped caption) instead of being
    // stretched to fill the row. The remaining horizontal space sits
    // on the right, matching the reference design layout.
    justify-content: flex-start;
    gap: 24px;
    padding: 4px 0;
  }

  .action-button {
    // Reset native button chrome — we want a plain icon column.
    appearance: none;
    background: transparent;
    border: 0;
    padding: 0;
    margin: 0;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    // Suppress the gray flash that mobile browsers paint on tap. We
    // intentionally do NOT add a `:active` background style either,
    // so the press / release cycle is visually static — matching the
    // reference design.
    -webkit-tap-highlight-color: transparent;

    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    // Intrinsic-width column: width is driven by the icon chip (48px)
    // plus the capped caption (`max-width` below). Buttons sit
    // shoulder-to-shoulder from the left edge with the row's `gap`.
    flex: 0 0 auto;
    color: var(--text-color-primary);

    // Children are visual-only; let the button own the tap.
    > * { pointer-events: none; }

    // Keyboard-only focus ring (mouse / touch don't trigger it). This
    // preserves a11y without flashing on tap.
    &:focus { outline: none; }
    &:focus-visible {
      outline: 2px solid var(--text-color-link, #4086FF);
      outline-offset: 2px;
      border-radius: 4px;
    }

    &.is-disabled {
      cursor: not-allowed;
      color: var(--text-color-disabled);

      .icon-chip {
        opacity: 0.5;
      }
    }

    // Destructive variant — used by the "leave seat" action. Only the
    // icon is tinted with the shared hangup color; the chip background
    // stays neutral so the button reads as part of the same visual set
    // as the toggle buttons, with danger purely as a semantic accent.
    &.is-danger {
      .icon-chip {
        color: var(--button-color-hangup, #E54545);
      }
    }

    .icon-chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background-color: var(--bg-color-function);
      color: var(--icon-color-primary);
    }

    .caption {
      font-size: 12px;
      line-height: 18px;
      // Reserve exactly two lines of vertical space for every caption
      // so single-line captions ("下麦") sit at the same vertical
      // baseline as multi-line ones ("麦克风被禁用"). The icon row
      // above stays perfectly aligned across all columns.
      min-height: 36px;
      // Cap caption width so long i18n strings don't blow the action
      // column wider than its share of the row.
      max-width: 84px;
      text-align: center;
      // Clamp at 2 lines and ellipsize anything beyond that.
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      word-break: break-word;
    }
  }
}
</style>
