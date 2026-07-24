<template>
  <div class="role-switcher">
    <span class="role-switcher__label">{{ t('Topbar.Role') }}</span>
    <!--
      Read-only badge. `role` is derived from real SDK state
      (currentLive.liveOwner + audienceList[me].userRole), not picked by
      the operator. The tooltip explains the derivation so it's obvious
      why the badge changed after startLive / setAdministrator.
    -->
    <span
      :class="['role-switcher__badge', `role-${modelValue}`]"
      :data-tooltip="tooltip"
      role="status"
    >
      {{ roleLabel(modelValue) }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { Role } from '../../lib/types';

const { t } = useUIKit();

/**
 * Localized role label. Goes through i18n so the badge text matches
 * the active locale (e.g. "未进房" / "Not in room"). Maps the runtime
 * enum value (lowercase) to the i18n key (PascalCase).
 */
function roleLabel(r: Role): string {
  const keyByValue: Record<Role, string> = {
    [Role.Unassigned]: 'Role.Unassigned',
    [Role.Host]: 'Role.Host',
    [Role.Audience]: 'Role.Audience',
    [Role.Admin]: 'Role.Admin',
  };
  return t(keyByValue[r]);
}

/**
 * `modelValue` remains the derived role for backward compatibility with
 * callers that pass `v-model`. It is treated as read-only here — no
 * `update:modelValue` is ever emitted, because role is derived from SDK
 * state rather than user input.
 *
 * `reason` (optional) is a short human-readable string describing WHY
 * the current derivation resolved to this role, passed from
 * `installDerivedRole()` in `derivedRole.ts`. Used as a debug fallback
 * in the tooltip.
 */
const props = defineProps<{ modelValue: Role; reason?: string }>();

/**
 * User-friendly tooltip that explains what each role means and how to
 * transition into it. Pure actionable guidance — the internal derivation
 * reason (`props.reason`) is intentionally NOT shown here because it
 * reads as developer jargon to operators (e.g. "currentLive.liveOwner"
 * and "useLiveListState"). Developers who need that detail can read it
 * from the Vue DevTools / source.
 */
const tooltip = computed<string>(() => {
  const r = props.modelValue;
  switch (r) {
    case Role.Unassigned:
      if (!props.reason || props.reason.includes('尚未登录')) {
        return t('Role.TooltipUnassignedLoggedOut');
      }
      return t('Role.TooltipUnassignedLoggedIn');
    case Role.Host:
      return t('Role.TooltipHost');
    case Role.Audience:
      return t('Role.TooltipAudience');
    case Role.Admin:
      return t('Role.TooltipAdmin');
    default:
      return '';
  }
});
</script>

<style scoped lang="scss">
.role-switcher {
  display: flex;
  align-items: center;
  gap: 8px;

  &__label {
    font-size: 13px;
    color: #4f586b;
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    height: 26px;
    padding: 0 12px;
    font-size: 13px;
    font-weight: 500;
    border-radius: 6px;
    cursor: help;

    // Default (unassigned): muted grey — signals "not in a room yet,
    // no role established". Deliberately low-visual-weight so
    // operators don't mistake it for a role they can act as.
    color: #6b7280;
    background: #f3f4f6;
    border: 1px solid #d1d5db;

    // Color palette matches the menu / ExampleCard role badges so the
    // visual language is consistent everywhere:
    //   host     → purple (filled in badges, soft in topbar badge)
    //   admin    → amber/orange
    //   audience → blue
    &.role-host {
      color: #5b3bdb;
      background: #ede9fe;
      border-color: #c4b5fd;
    }
    &.role-admin {
      color: #b45309;
      background: #fef3c7;
      border-color: #fcd34d;
    }
    &.role-audience {
      color: #1c66e5;
      background: #e1ecff;
      border-color: #b6d1fb;
    }

    // Custom tooltip via ::after — replaces native `title` attribute
    // so the tooltip appears instantly on hover instead of after the
    // browser's built-in delay (~1-2s). The text is injected from the
    // `data-tooltip` attribute; `white-space: pre-line` renders `\n`
    // as line breaks.
    &[data-tooltip]:hover::after {
      content: attr(data-tooltip);
      position: absolute;
      top: 100%;
      left: 50%;
      // Use translate3d for compositing; `width: max-content` keeps the
      // tooltip sized to its content rather than inherited from the
      // narrow badge, so multi-line text doesn't collapse to a
      // single-character column.
      width: max-content;
      max-width: 280px;
      transform: translateX(-50%);
      margin-top: 6px;
      padding: 8px 12px;
      font-size: 12px;
      font-weight: 400;
      line-height: 1.6;
      color: #1f2937;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      white-space: pre-line;
      pointer-events: none;
      z-index: 100;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    &[data-tooltip] {
      position: relative;
    }
  }
}
</style>
