import { ref } from 'vue';
import { i18next } from '@tencentcloud/uikit-base-component-vue3';
import { buildChatOfflinePushInfo } from './utils';
import type {
  OfflinePushInfoConfig,
  OfflinePushInfoContext,
  ChatOfflinePushInfo,
  ChatOfflinePushInfoStaticConfig,
  CallOfflinePushInfo,
} from './types';

// Module-level reactive config storage (singleton pattern)
const offlinePushConfig = ref<OfflinePushInfoConfig | null>(null);

/**
 * Composable for managing offline push info configuration and generation
 * Internal use only - users access via useMessageInputState
 */
export function useOfflinePushInfo() {
  /**
   * Set or clear offline push configuration
   * @param config - Config object with chatOfflinePushInfo and/or callOfflinePushInfo, null to disable
   */
  function setOfflinePushInfo(config: OfflinePushInfoConfig | null): void {
    offlinePushConfig.value = config;
  }

  /**
   * Create offlinePushInfo for CHAT scene based on current config
   * @param context - Message context (conversation, messageType, payload)
   * @returns Generated offlinePushInfo or undefined if not configured
   */
  function createChatOfflinePushInfo(context: OfflinePushInfoContext): ChatOfflinePushInfo | undefined {
    const config = offlinePushConfig.value;

    // Not configured - return undefined (opt-in)
    if (!config?.chatOfflinePushInfo) {
      return undefined;
    }

    // Static config mode - auto-generate title/desc/extension
    const chatConfig = config.chatOfflinePushInfo as ChatOfflinePushInfoStaticConfig;
    const t = (key: string) => i18next.t(key);

    return buildChatOfflinePushInfo(
      context.conversation,
      context.messageType,
      context.payload || {},
      t,
      chatConfig.androidInfo,
      chatConfig.apnsInfo,
    );
  }

  /**
   * Get offlinePushInfo for CALL scene
   * @returns CallOfflinePushInfo or undefined if not configured
   */
  function createCallOfflinePushInfo(): CallOfflinePushInfo | undefined {
    const config = offlinePushConfig.value;
    return config?.callOfflinePushInfo;
  }

  /**
   * Check if offline push is enabled
   * @returns true if config is set
   */
  function isEnabled(): boolean {
    return offlinePushConfig.value !== null;
  }

  return {
    setOfflinePushInfo,
    createChatOfflinePushInfo,
    createCallOfflinePushInfo,
    isEnabled,
  };
}
