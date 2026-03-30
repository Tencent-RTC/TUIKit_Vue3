/**
 * Unified scene configuration
 * Control scene visibility in one place - all pages will respect this configuration
 */

import { DOC_URLS } from './urls';

// Scene IDs
export const SCENE_IDS = {
  chatkit: 'chatkit',
  callkit: 'callkit',
  roomkit: 'roomkit',
  live: 'live',
} as const;

export type SceneId = (typeof SCENE_IDS)[keyof typeof SCENE_IDS];

// Product IDs (for analytics and internal use)
export const PRODUCT_IDS = {
  chat: 'chat',
  call: 'call',
  room: 'room',
  live: 'live',
} as const;

export type ProductId = (typeof PRODUCT_IDS)[keyof typeof PRODUCT_IDS];

/**
 * Scene configuration interface
 */
export interface SceneConfig {
  /** Scene identifier used in routing */
  scene: SceneId;
  /** Product identifier for analytics */
  productId: ProductId;
  /** Whether this scene is enabled/visible */
  enabled: boolean;
  /** Icon name for tab bar */
  icon: string;
  /** i18n key for scene label (short name) */
  labelKey: string;
  /** i18n key for scene title */
  titleKey: string;
  /** i18n key for scene description */
  descKey: string;
  /** Documentation URL */
  docsUrl: string;
  /** Image URL for home page card (will be set dynamically) */
  imageUrl?: string;
}

/**
 * Master scene configuration
 * To hide/show a scene, simply change the `enabled` property
 */
export const SCENE_CONFIGS: SceneConfig[] = [
  {
    scene: SCENE_IDS.chatkit,
    productId: PRODUCT_IDS.chat,
    enabled: true,
    icon: 'chat',
    labelKey: 'scenes.chat.label',
    titleKey: 'scenes.chat.title',
    descKey: 'scenes.chat.desc',
    docsUrl: DOC_URLS.chatkit.quickStart,
  },
  {
    scene: SCENE_IDS.callkit,
    productId: PRODUCT_IDS.call,
    enabled: true,
    icon: 'call',
    labelKey: 'scenes.call.label',
    titleKey: 'scenes.call.title',
    descKey: 'scenes.call.desc',
    docsUrl: DOC_URLS.callkit.quickStart,
  },
  {
    scene: SCENE_IDS.roomkit,
    productId: PRODUCT_IDS.room,
    enabled: false,
    icon: 'audio',
    labelKey: 'scenes.meeting.label',
    titleKey: 'scenes.meeting.title',
    descKey: 'scenes.meeting.desc',
    docsUrl: DOC_URLS.roomkit.quickStart,
  },
  {
    scene: SCENE_IDS.live,
    productId: PRODUCT_IDS.live,
    enabled: false,
    icon: 'signal',
    labelKey: 'scenes.live.label',
    titleKey: 'scenes.live.title',
    descKey: 'scenes.live.desc',
    docsUrl: DOC_URLS.live.platforms.web,
  },
];

/**
 * Get all enabled scenes
 */
export function getEnabledScenes(): SceneConfig[] {
  return SCENE_CONFIGS.filter((config) => config.enabled);
}

/**
 * Get scene config by scene ID
 */
export function getSceneConfig(sceneId: SceneId): SceneConfig | undefined {
  return SCENE_CONFIGS.find((config) => config.scene === sceneId);
}

/**
 * Get enabled scenes excluding specific scenes
 * Useful for capability recommend cards (exclude current scene)
 */
export function getEnabledScenesExcept(excludeScenes: SceneId[]): SceneConfig[] {
  return SCENE_CONFIGS.filter(
    (config) => config.enabled && !excludeScenes.includes(config.scene)
  );
}

/**
 * Get all scenes excluding specific scenes (regardless of enabled status)
 * Useful for capability recommend cards where we want to show all cards
 * but conditionally enable/disable the "experience demo" button
 */
export function getScenesExcept(excludeScenes: SceneId[]): SceneConfig[] {
  return SCENE_CONFIGS.filter(
    (config) => !excludeScenes.includes(config.scene)
  );
}

/**
 * Check if a scene is enabled
 */
export function isSceneEnabled(sceneId: SceneId): boolean {
  const config = getSceneConfig(sceneId);
  return config?.enabled ?? false;
}

/**
 * Get the default scene (first enabled scene)
 */
export function getDefaultScene(): SceneId {
  const enabledScenes = getEnabledScenes();
  return enabledScenes.length > 0 ? enabledScenes[0].scene : SCENE_IDS.chatkit;
}
