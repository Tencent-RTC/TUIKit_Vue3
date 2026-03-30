<template>
  <div class="capability-recommend">
    <!-- Welcome Section -->
    <div class="welcome-section">
      <div class="welcome-title">
        {{ t("Home.欢迎使用") }}
        <IconLogo class="logo" :size="40" />
        {{ t("即时通信") }}
      </div>
      <div class="welcome-content">
        {{
          t(
            "Home.我们为您默认提供了一位\"示例好友\"和一个\"示例客服群\"您不用额外添加好友和群聊就可完整体验腾讯云 IM 单聊、群聊的所有功能。"
          )
        }}
        <br />
        {{ t("Home.随时随地") }}
      </div>
    </div>

    <!-- Capability Cards Section -->
    <div class="capability-cards">
      <div class="cards-title">{{ t('capabilityRecommend.title') }}</div>
      <div class="cards-container">
        <div 
          v-for="card in capabilityCards" 
          :key="card.id"
          class="capability-card"
        >
          <div class="card-header">
            <component :is="card.icon" class="card-icon" />
            <span class="card-name">{{ t(card.nameKey) }}</span>
          </div>
          <div class="card-desc">{{ t(card.descKey) }}</div>
          <div class="card-actions">
            <!-- Only show "Experience Demo" button when scene is enabled -->
            <TUIButton
              v-if="card.enabled"
              type="primary"
              size="small"
              @click="handleExperienceDemo(card.id, card.scene)"
            >
              {{ t('capabilityRecommend.experienceDemo') }}
            </TUIButton>
            <TUIButton
              type="default"
              size="small"
              @click="handleViewDocs(card.id, card.docsUrl)"
            >
              {{ t('capabilityRecommend.viewDocs') }}
            </TUIButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, type Component } from 'vue';
import { IconLogo, TUIButton } from '@tencentcloud/uikit-base-component-vue3';
import { useUIKit } from '@tencentcloud/chat-uikit-vue3';
import { getScenesExcept, SCENE_IDS, PRODUCT_IDS, type SceneConfig } from '@/constants';
import IconCall from '@/components/Icon/IconCall.vue';
import IconAudio from '@/components/Icon/IconAudio.vue';
import IconSignal from '@/components/Icon/IconSignal.vue';
// Aegis data reporting (remove for GitHub demo)
import { reportDiversionClick } from '@/utils/aegis';

const { t } = useUIKit();

const emit = defineEmits<{
  (e: 'switchScene', scene: string): void;
}>();

// Product icon mapping (by productId)
const productIconMap: Record<string, Component> = {
  [PRODUCT_IDS.call]: markRaw(IconCall),
  [PRODUCT_IDS.room]: markRaw(IconAudio),
  [PRODUCT_IDS.live]: markRaw(IconSignal),
};

// i18n key mapping for capability recommend cards
const capabilityNameKeyMap: Record<string, string> = {
  [PRODUCT_IDS.call]: 'capabilityRecommend.call',
  [PRODUCT_IDS.room]: 'capabilityRecommend.room',
  [PRODUCT_IDS.live]: 'capabilityRecommend.live',
};

const capabilityDescKeyMap: Record<string, string> = {
  [PRODUCT_IDS.call]: 'capabilityRecommend.callDesc',
  [PRODUCT_IDS.room]: 'capabilityRecommend.roomDesc',
  [PRODUCT_IDS.live]: 'capabilityRecommend.liveDesc',
};

// Get capability cards from unified scene configuration (exclude chat scene)
// Show all cards (call, room, live), but only enable "Experience Demo" button for enabled scenes
const capabilityCards = computed(() =>
  getScenesExcept([SCENE_IDS.chatkit]).map((config: SceneConfig) => ({
    id: config.productId,
    nameKey: capabilityNameKeyMap[config.productId] || config.labelKey,
    descKey: capabilityDescKeyMap[config.productId] || config.descKey,
    scene: config.scene,
    docsUrl: config.docsUrl,
    icon: productIconMap[config.productId],
    enabled: config.enabled, // Pass enabled status to control button visibility
  }))
);

const handleExperienceDemo = (cardId: string, scene: string) => {
  // Report capability card demo click
  reportDiversionClick('capability_demo_click', cardId, scene);
  emit('switchScene', scene);
};

const handleViewDocs = (cardId: string, url: string) => {
  // Report capability card docs click
  reportDiversionClick('capability_docs_click', cardId, url);
  window.open(url, '_blank');
};
</script>

<style lang="scss" scoped>
:root[tui-theme-mode='light'] {
  --welcome-background: url("../../../../assets/images/login-background.png") no-repeat;
}

:root[tui-theme-mode='dark'] {
  --welcome-background: var(--bg-color-topbar);
}

.capability-recommend {
  flex: 1;
  box-sizing: border-box;
  padding: 32px 40px;
  display: flex;
  flex-direction: column;
  background: var(--welcome-background);
  background-size: cover;
  background-position-x: -17px;
  background-position-y: 173px;
  overflow-y: auto;
}

.welcome-section {
  margin-bottom: 32px;
}

.welcome-title {
  font-size: 1.75rem;
  display: flex;
  align-items: center;
  font-family: PingFangSC-Medium;
  font-weight: 500;
  color: var(--text-color-primary);
  
  .logo {
    margin: 0 0.98rem;
  }
}

.welcome-content {
  padding-top: 1.88rem;
  max-width: 500px;
  font-size: 16px;
  line-height: 24px;
  font-family: PingFangSC-Regular;
  font-weight: 400;
  color: var(--text-color-secondary);
}

.capability-cards {
  margin-top: 16px;
}

.cards-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color-primary);
  margin-bottom: 16px;
}

.cards-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.capability-card {
  background: var(--bg-color-float);
  border: 1px solid var(--stroke-color-primary);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border-color: var(--primary-color, #1c66e5);
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.card-icon {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
}

.card-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-color-primary);
}

.card-desc {
  font-size: 13px;
  color: var(--text-color-secondary);
  line-height: 1.5;
  margin-bottom: 12px;
}

.card-actions {
  display: flex;
  gap: 8px;
}
</style>
