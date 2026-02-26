import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';

export interface SceneConfig {
  key: string;
  label: string;
  title: string;
  description: string;
  accent?: string;
  enabled: boolean;
  icon?: string;
  children?: SceneConfig[];
}

interface BaseSceneConfig {
  key: string;
  label: string;
  titleKey?: string;
  descriptionKey?: string;
  accent?: string;
  enabled: boolean;
  icon?: string;
  children?: BaseSceneConfig[];
}

// 基础场景配置（不包含翻译）
const BASE_SCENES: BaseSceneConfig[] = [
  {
    key: 'chat',
    label: 'Chat',
    titleKey: 'scenes.chat.title',
    descriptionKey: 'scenes.chat.description',
    accent: '#4F8EF7',
    enabled: true,
    icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>',
    children: [],
  },
  // {
  //   key: 'call',
  //   label: 'Call',
  //   titleKey: 'scenes.call.title',
  //   descriptionKey: 'scenes.call.description',
  //   accent: '#10B981',
  //   enabled: true,
  //   icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/></svg>',
  //   children: [],
  // },
  // {
  //   key: 'live',
  //   label: 'Live',
  //   titleKey: 'scenes.live.title',
  //   descriptionKey: 'scenes.live.description',
  //   accent: '#F59E0B',
  //   enabled: true,
  //   icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4zM14 13h-3v3H9v-3H6v-2h3V8h2v3h3v2z"/></svg>',
  //   children: [
  //     {
  //       key: 'live-list',
  //       label: 'Live List',
  //       titleKey: 'scenes.liveList.title',
  //       descriptionKey: 'scenes.liveList.description',
  //       enabled: true,
  //     },
  //     {
  //       key: 'live-pusher',
  //       label: 'Live Pusher',
  //       titleKey: 'scenes.livePusher.title',
  //       descriptionKey: 'scenes.livePusher.description',
  //       enabled: true,
  //     },
  //     {
  //       key: 'live-player',
  //       label: 'Live Player',
  //       titleKey: 'scenes.livePlayer.title',
  //       descriptionKey: 'scenes.livePlayer.description',
  //       enabled: true,
  //     },
  //   ],
  // },
];

const translateScene = (scene: BaseSceneConfig, t: any): SceneConfig => ({
  key: scene.key,
  label: scene.label,
  title: scene.titleKey ? t(scene.titleKey) : scene.label,
  description: scene.descriptionKey ? t(scene.descriptionKey) : '',
  accent: scene.accent,
  enabled: scene.enabled,
  icon: scene.icon,
  children: scene.children?.map((childrenScene: BaseSceneConfig) => translateScene(childrenScene, t)) || [],
});

export const getScenes = (): SceneConfig[] => {
  const { t } = useUIKit();
  return BASE_SCENES.map((scene: BaseSceneConfig) => translateScene(scene, t));
};

export const getEnabledScenes = (): SceneConfig[] => {
  return getScenes().filter(scene => scene.enabled);
};

export const getSceneByKey = (key: string): SceneConfig | undefined => {
  return getScenes().find((scene: SceneConfig) => scene.key === key);
};

export const getDefaultScene = (): SceneConfig => {
  return getEnabledScenes()[0] || getScenes()[0];
};

export const isSceneEnabled = (key: string): boolean => {
  const baseScene = BASE_SCENES.find(scene => scene.key === key);
  return baseScene ? baseScene.enabled : false;
};
