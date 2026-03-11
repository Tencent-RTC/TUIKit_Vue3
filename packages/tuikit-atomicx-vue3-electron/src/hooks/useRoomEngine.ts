import TUIRoomEngine from '@tencentcloud/tuiroom-engine-electron';
import type { TUIRoomDeviceManager } from '@tencentcloud/tuiroom-engine-electron';

const roomEngine: Record<string, TUIRoomEngine | null> = { instance: null };
const deviceManager: { instance: TUIRoomDeviceManager | null | undefined } = {
  instance: null,
};

TUIRoomEngine.once('ready', () => {
  roomEngine.instance = TUIRoomEngine.getInstance();
  deviceManager.instance = roomEngine.instance?.getMediaDeviceManager();

  TUIRoomEngine.callExperimentalAPI(JSON.stringify({
    api: 'setFramework',
    params: {
      component: 'TUILiveKit',
      language: 'vue3',
    },
  }));
});

export function useDeviceManager() {
  return deviceManager;
}

export function useRoomEngine() {
  return roomEngine;
}

export default useRoomEngine;
