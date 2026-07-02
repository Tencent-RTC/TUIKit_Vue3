<template>
  <!--
    Document-level outside-pointer listener in `SelfDeviceControlLayer`
    already exempts taps inside `.self-device-menu` from dismissal, so
    no per-element `@click.stop` is needed on this root.
  -->
  <div
    class="self-device-menu"
    :class="`placement-${placement}`"
  >
    <div
      class="menu-row"
      :class="{ 'is-disabled': cameraDisabled }"
      :title="cameraTitle"
      @click="onCameraClick"
    >
      <span class="icon-chip">
        <component :is="cameraOn ? IconCameraOn : IconCameraOff" :size="16" />
      </span>
      <span class="label">{{ cameraLabel }}</span>
    </div>
    <div
      class="menu-row"
      :class="{ 'is-disabled': microphoneDisabled }"
      :title="microphoneTitle"
      @click="onMicrophoneClick"
    >
      <span class="icon-chip">
        <component :is="microphoneOn ? IconMicOn : IconMicrophoneMute" :size="16" />
      </span>
      <span class="label">{{ microphoneLabel }}</span>
    </div>
    <!--
      Destructive row: leave seat. Pinned at the bottom of the menu and
      visually distinguished by tinting the icon (only) with the shared
      hangup color, so users recognize it as the same affordance shown
      on H5 / SeatApplicationButtonH5. Layer owns the actual SDK call.
    -->
    <div
      class="menu-row is-danger"
      :title="t('LiveView.SelfDeviceMenu.LeaveSeat')"
      @click="onLeaveSeatClick"
    >
      <span class="icon-chip">
        <IconCallVoice :size="16" />
      </span>
      <span class="label">{{ t('LiveView.SelfDeviceMenu.LeaveSeat') }}</span>
    </div>
    <!--
      Triangle arrow pointing at the anchor seat. Two stacked CSS triangles:
      an outer one painted in the menu's stroke color (1px hairline), and a
      slightly smaller inner one in the menu's surface color so the seam
      between menu body and arrow is invisible.
    -->
    <span
      class="arrow"
      :style="{ left: `${arrowOffset}px` }"
    >
      <span class="arrow-outer" />
      <span class="arrow-inner" />
    </span>
  </div>
</template>

<script setup lang="ts">
import {
  IconCameraOn,
  IconCameraOff,
  IconMicOn,
  IconMicrophoneMute,
  IconCallVoice,
  useUIKit,
} from '@tencentcloud/uikit-base-component-vue3';
import { useCameraLabel, useMicrophoneLabel } from './useDeviceLabels';

interface Props {
  cameraOn: boolean;
  microphoneOn: boolean;
  cameraDisabled: boolean;
  microphoneDisabled: boolean;
  // Locked-by-admin is a stricter sub-state of `*Disabled`. When true,
  // the row is still disabled, but we surface a dedicated "Disabled by
  // host" label/title to make the cause unambiguous to the user.
  cameraLockedByAdmin?: boolean;
  microphoneLockedByAdmin?: boolean;
  // Which side of the seat the menu is rendered on. Drives arrow direction.
  placement?: 'top' | 'bottom';
  // Arrow offset in px from the menu's left edge.
  arrowOffset?: number;
}

const props = withDefaults(defineProps<Props>(), {
  cameraLockedByAdmin: false,
  microphoneLockedByAdmin: false,
  placement: 'top',
  arrowOffset: 24,
});
const emit = defineEmits<{
  (event: 'toggle-camera'): void;
  (event: 'toggle-microphone'): void;
  (event: 'leave-seat'): void;
}>();

const { t } = useUIKit();

// Shared label / title computeds — same precedence rules as the H5 drawer.
// Camera and microphone get their own hooks so a microphone state change
// never invalidates the camera label cache (and vice versa).
const { label: cameraLabel, title: cameraTitle } = useCameraLabel(() => ({
  cameraOn: props.cameraOn,
  cameraDisabled: props.cameraDisabled,
  cameraLockedByAdmin: props.cameraLockedByAdmin,
}));
const { label: microphoneLabel, title: microphoneTitle } = useMicrophoneLabel(() => ({
  microphoneOn: props.microphoneOn,
  microphoneDisabled: props.microphoneDisabled,
  microphoneLockedByAdmin: props.microphoneLockedByAdmin,
}));

function onCameraClick() {
  if (props.cameraDisabled) {
    return;
  }
  emit('toggle-camera');
}

function onMicrophoneClick() {
  if (props.microphoneDisabled) {
    return;
  }
  emit('toggle-microphone');
}

function onLeaveSeatClick() {
  // Leave-seat has no `disabled` gate: it should always be reachable
  // (even if devices are locked by the host, the user can still exit).
  emit('leave-seat');
}
</script>

<style scoped lang="scss">
// All colors below resolve from the design system's CSS variable tokens
// (defined in `@tencentcloud/uikit-base-component-vue3`'s theme files),
// so the menu automatically picks up light / dark / business / education
// presets via `:root[tui-theme-mode]` without any per-theme overrides.
//
// Token mapping:
//   --floating-color-default  → menu surface (light: white, dark: gray-3)
//   --stroke-color-primary    → menu border / arrow hairline
//   --stroke-color-secondary  → row divider
//   --text-color-primary      → row text + icon
//   --text-color-disabled     → disabled row text
//   --dropdown-color-hover    → row hover background (matches base Dropdown)
//   --dropdown-color-active   → row pressed background
//   --bg-color-function       → icon chip background
//   --shadow-color            → drop shadow tint
//   --button-color-hangup     → destructive (leave-seat) icon tint

$arrow-size: 9px;
$arrow-inner-size: 8px;

.self-device-menu {
  position: relative;
  background: var(--floating-color-default);
  color: var(--text-color-primary);
  border: 1px solid var(--stroke-color-primary);
  border-radius: 12px;
  padding: 6px;
  min-width: 168px;
  // Multi-layer shadow gives the panel a credible "lift" against busy
  // video content. Both layers tint via --shadow-color so the strength
  // adapts to the active theme.
  box-shadow:
    0 16px 32px 0 var(--shadow-color),
    0 4px 12px 0 var(--shadow-color);
  user-select: none;
  -webkit-user-select: none;
  // Re-enable pointer events for the menu (parent layer is none).
  pointer-events: auto;
  // Fade-only entrance: avoid `transform` during the animation so the
  // hit-test box matches the visual box exactly. A scale + translate
  // animation feels nice but during the ~140ms intro the painted menu
  // is offset from its DOM rect, which made click targets feel
  // "slippery" — clicks in the visually-correct spot would miss the
  // (slightly different) layout-correct spot. Opacity-only is safe.
  animation: menu-enter 120ms ease-out both;

  .menu-row {
    display: flex;
    align-items: center;
    gap: 10px;
    // Vertical padding includes the per-row breathing room AND half of
    // the inter-row gap, so the row's clickable area extends right up
    // to the next row. There is no separate divider element competing
    // for hits — the rule below paints a 1px line on the bottom of all
    // but the last row, inside the row's hit area.
    padding: 8px 10px;
    cursor: pointer;
    font-size: 13px;
    line-height: 20px;
    font-weight: 500;
    color: var(--text-color-primary);
    white-space: nowrap;
    // Smaller row radius than the menu's outer 12px so the hover fill's
    // corners stay safely inside the menu's border, never overlapping it.
    border-radius: 6px;
    transition: background-color 120ms ease, color 120ms ease;
    // Make sure rows always own their click — protects against any
    // accidental child intercepting the hit (icons inside `.icon-chip`,
    // SVG paths, etc.).
    > * { pointer-events: none; }

    @media (hover: hover) {
      &:hover:not(.is-disabled) {
        background-color: var(--dropdown-color-hover);
      }
    }

    &:active:not(.is-disabled) {
      background-color: var(--dropdown-color-active);
    }

    &.is-disabled {
      color: var(--text-color-disabled);
      cursor: not-allowed;

      .icon-chip {
        opacity: 0.5;
      }
    }

    // Destructive variant — only tint the icon (not the row text or
    // chip background) so the row still reads as part of the same
    // visual set as the toggle rows above.
    &.is-danger {
      .icon-chip {
        color: var(--button-color-hangup, #E54545);
      }
    }

    .label {
      flex: 1;
    }

    // Soft chip behind each icon. Keeps row layout consistent and gives
    // the base library's red-stroke "Off" icons a calmer container so
    // they read as a status indicator rather than the dominant element.
    .icon-chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 6px;
      background-color: var(--bg-color-function);
      color: var(--icon-color-primary);
      flex-shrink: 0;
    }
  }

  // 1px separator drawn between rows via inset box-shadow on the upper
  // row's bottom edge. This avoids claiming any pixels of layout
  // (margin/border would create a hit-test dead zone between rows),
  // so the entire menu interior belongs to one row or the next with no
  // gap. Hidden on hover/active so the highlight reads as a clean fill.
  .menu-row:not(:last-of-type) {
    box-shadow: inset 0 -1px 0 0 var(--stroke-color-secondary);

    @media (hover: hover) {
      &:hover:not(.is-disabled) {
        box-shadow: none;
      }
    }
    &:active:not(.is-disabled) {
      box-shadow: none;
    }
  }

  // Arrow stack -----------------------------------------------------
  .arrow {
    position: absolute;
    width: 0;
    height: 0;
    pointer-events: none;
    transform: translateX(-50%);
  }

  .arrow-outer,
  .arrow-inner {
    position: absolute;
    width: 0;
    height: 0;
    border-style: solid;
    transform: translateX(-50%);
  }

  // Both placements layer two triangles: an outer one painted in the
  // menu's stroke color, and a slightly smaller inner one in the menu's
  // surface color. CSS triangles are rendered as borders and therefore
  // don't pick up backdrop-filter (irrelevant here since we no longer
  // use one) or any gradient — a flat surface token gives a seamless
  // join between the menu body and the arrow tip.
  &.placement-top {
    .arrow { bottom: -$arrow-size; }
    .arrow-outer {
      bottom: 0;
      border-width: $arrow-size $arrow-size 0 $arrow-size;
      border-color: var(--stroke-color-primary) transparent transparent transparent;
    }
    .arrow-inner {
      bottom: 1px;
      border-width: $arrow-inner-size $arrow-inner-size 0 $arrow-inner-size;
      border-color: var(--floating-color-default) transparent transparent transparent;
      // Subtle drop shadow keeps the arrow legible over bright frames.
      filter: drop-shadow(0 2px 2px var(--shadow-color));
    }
  }

  &.placement-bottom {
    .arrow { top: -$arrow-size; }
    .arrow-outer {
      top: 0;
      border-width: 0 $arrow-size $arrow-size $arrow-size;
      border-color: transparent transparent var(--stroke-color-primary) transparent;
    }
    .arrow-inner {
      top: 1px;
      border-width: 0 $arrow-inner-size $arrow-inner-size $arrow-inner-size;
      border-color: transparent transparent var(--floating-color-default) transparent;
      filter: drop-shadow(0 -2px 2px var(--shadow-color));
    }
  }
}

// Opacity-only entrance keeps the hit-test rect identical to the
// painted rect, so clicks during the (~120ms) intro never land on a
// stale position. Scale / translate animations look nice but cause
// "slippery" click targets at small sizes.
@keyframes menu-enter {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
