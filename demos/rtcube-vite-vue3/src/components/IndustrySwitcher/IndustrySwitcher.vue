<script lang="ts" setup>
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { MessageSquare, Stethoscope, Sparkles } from 'lucide-vue-next';
// Aegis data reporting (remove for GitHub demo)
import { reportIndustrySwitcherClick } from '@/utils/aegis';

const { t } = useUIKit();

interface Scenario {
  id: string;
  icon: typeof MessageSquare;
  labelKey: string;
  shortDescKey: string;
}

const scenarios: Scenario[] = [
  {
    id: 'general',
    icon: MessageSquare,
    labelKey: 'scenes.chat.subScenes.general.label',
    shortDescKey: 'scenes.chat.subScenes.general.shortDesc',
  },
  {
    id: 'medical',
    icon: Stethoscope,
    labelKey: 'scenes.chat.subScenes.medical.label',
    shortDescKey: 'scenes.chat.subScenes.medical.shortDesc',
  },
];

const props = defineProps<{
  active: string;
}>();

const emit = defineEmits<{
  change: [subScene: string];
  back: [];
}>();

/**
 * Report industry switcher click event and emit change (remove for GitHub demo)
 * ext1 format: "detail | chat | subScene" (e.g., "detail | chat | medical")
 */
const handleScenarioClick = (id: string) => {
  reportIndustrySwitcherClick(id);
  emit('change', id);
};
</script>

<template>
  <div class="industry-switcher">
    <!-- Header -->
    <div class="industry-switcher__header">
      <div class="industry-switcher__header-content">
        <div class="industry-switcher__title">
          <Sparkles :size="16" class="industry-switcher__title-icon" />
          <span>{{ t('scenes.chat.switcher.title') }}</span>
        </div>
        <div class="industry-switcher__subtitle">
          {{ t('scenes.chat.switcher.subtitle') }}
        </div>
      </div>
    </div>

    <!-- Scenario List -->
    <div class="industry-switcher__list">
      <button
        v-for="s in scenarios"
        :key="s.id"
        class="industry-switcher__item"
        :class="{ 'industry-switcher__item--active': props.active === s.id }"
        @click="handleScenarioClick(s.id)"
      >
        <div class="industry-switcher__icon">
          <component :is="s.icon" :size="20" />
        </div>
        <div class="industry-switcher__text">
          <span class="industry-switcher__label">{{ t(s.labelKey) }}</span>
          <span class="industry-switcher__desc">{{ t(s.shortDescKey) }}</span>
        </div>
        <div v-if="props.active === s.id" class="industry-switcher__dot" />
      </button>
    </div>

    <!-- Footer -->
    <div class="industry-switcher__footer">
      {{ t('scenes.chat.switcher.moreComingSoon') }}
    </div>
  </div>
</template>

<style scoped>
.industry-switcher {
  width: 220px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 20px;
  padding: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f1f3;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Header */
.industry-switcher__header {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 20px 16px 12px;
}

.industry-switcher__back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #374151;
  cursor: pointer;
  flex-shrink: 0;
  padding: 0;
  margin-top: 1px;
  transition: background-color 0.2s;
}

.industry-switcher__back:hover {
  background: #f3f4f6;
}

.industry-switcher__header-content {
  flex: 1;
  min-width: 0;
}

.industry-switcher__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  line-height: 1.4;
}

.industry-switcher__title-icon {
  color: #2174fd;
  flex-shrink: 0;
}

.industry-switcher__subtitle {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
  line-height: 1.4;
}

/* Scenario List */
.industry-switcher__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 12px;
}

.industry-switcher__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid var(--stroke-color-primary);;
  background: transparent;
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
  text-align: left;
  font-family: inherit;
  color: #4b5563;
  outline: none;
}

.industry-switcher__item:hover:not(.industry-switcher__item--active) {
  background: #f5f6f8;
}

.industry-switcher__item--active {
  background: #2174fd;
  color: #fff;
  box-shadow: 0 4px 14px rgba(33, 116, 253, 0.3);
}

/* Icon */
.industry-switcher__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  flex-shrink: 0;
  transition: all 0.25s ease;
}

.industry-switcher__item:not(.industry-switcher__item--active) .industry-switcher__icon {
  background: #f9fafb;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  border: 1px solid #f0f1f3;
  color: #9ca3af;
}

.industry-switcher__item:hover:not(.industry-switcher__item--active) .industry-switcher__icon {
  color: #374151;
  border-color: #e5e7eb;
}

.industry-switcher__item--active .industry-switcher__icon {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

/* Text */
.industry-switcher__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.industry-switcher__label {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
}

.industry-switcher__desc {
  font-size: 12px;
  opacity: 0.7;
  line-height: 1.3;
}

.industry-switcher__item--active .industry-switcher__desc {
  opacity: 0.85;
}

/* Active dot */
.industry-switcher__dot {
  position: absolute;
  right: 12px;
  top: 12px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  animation: pulse 2s ease-in-out infinite;
}

/* Footer */
.industry-switcher__footer {
  margin-top: auto;
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: #c0c4cc;
  border-top: 1px solid #f3f4f6;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
