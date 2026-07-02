import { computed, type ComputedRef } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';

/**
 * Per-device row state. Split into camera / microphone halves so each
 * computed below only depends on the three flags it actually reads —
 * preventing a microphone state change from invalidating camera label
 * cache (and vice versa).
 */
export interface CameraRowState {
  cameraOn: boolean;
  cameraDisabled: boolean;
  cameraLockedByAdmin: boolean;
}
export interface MicrophoneRowState {
  microphoneOn: boolean;
  microphoneDisabled: boolean;
  microphoneLockedByAdmin: boolean;
}

/**
 * Single source of truth for the camera / microphone row labels used by
 * both the desktop popover and the mobile drawer. Both surfaces only
 * diverge on chrome (popover anchored to a seat vs. bottom sheet); the
 * label semantics — including the "locked-by-admin > device error >
 * toggle" precedence — are identical.
 *
 * Label precedence (highest first):
 *   1. `*LockedByAdmin` → "Camera disabled" / "Microphone disabled".
 *      Surfaced when the host has explicitly turned the device off,
 *      so users see a clear, actionable cause instead of the generic
 *      device-error string.
 *   2. `*Disabled` (without lock) → "Camera unavailable" /
 *      "Microphone unavailable". Catch-all for hardware errors,
 *      missing permission, device busy, etc.
 *   3. Toggle copy → "Open / Close camera" / "Open / Close microphone",
 *      driven by the current `*On` flag.
 *
 * The `*Title` variants mirror the disabled-state label so desktop
 * hover tooltips can give the same hover-discoverable reason. They
 * are empty strings in the toggle case — the row already shows the
 * action verb, so a redundant tooltip is just visual noise.
 *
 * Each hook takes a getter so callers stay in control of how they
 * assemble reactive state (typically reading from `props` inside a
 * `<script setup>` block); each computed re-runs only when one of the
 * three flags it reads changes.
 */
export function useCameraLabel(getState: () => CameraRowState): {
  label: ComputedRef<string>;
  title: ComputedRef<string>;
} {
  const { t } = useUIKit();
  const label = computed(() => {
    const s = getState();
    if (s.cameraLockedByAdmin) return t('LiveView.SelfDeviceMenu.CameraLockedByAdmin');
    if (s.cameraDisabled) return t('LiveView.SelfDeviceMenu.CameraError');
    return s.cameraOn
      ? t('LiveView.SelfDeviceMenu.CloseCamera')
      : t('LiveView.SelfDeviceMenu.OpenCamera');
  });
  const title = computed(() => {
    const s = getState();
    if (s.cameraLockedByAdmin) return t('LiveView.SelfDeviceMenu.CameraLockedByAdmin');
    if (s.cameraDisabled) return t('LiveView.SelfDeviceMenu.CameraError');
    return '';
  });
  return { label, title };
}

export function useMicrophoneLabel(getState: () => MicrophoneRowState): {
  label: ComputedRef<string>;
  title: ComputedRef<string>;
} {
  const { t } = useUIKit();
  const label = computed(() => {
    const s = getState();
    if (s.microphoneLockedByAdmin) return t('LiveView.SelfDeviceMenu.MicrophoneLockedByAdmin');
    if (s.microphoneDisabled) return t('LiveView.SelfDeviceMenu.MicrophoneError');
    return s.microphoneOn
      ? t('LiveView.SelfDeviceMenu.CloseMicrophone')
      : t('LiveView.SelfDeviceMenu.OpenMicrophone');
  });
  const title = computed(() => {
    const s = getState();
    if (s.microphoneLockedByAdmin) return t('LiveView.SelfDeviceMenu.MicrophoneLockedByAdmin');
    if (s.microphoneDisabled) return t('LiveView.SelfDeviceMenu.MicrophoneError');
    return '';
  });
  return { label, title };
}
