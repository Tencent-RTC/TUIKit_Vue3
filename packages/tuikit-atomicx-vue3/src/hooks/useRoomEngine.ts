import TUIRoomEngine, { TRTCCloud } from '@tencentcloud/tuiroom-engine-js';
import type { TUIRoomDeviceManager } from '@tencentcloud/tuiroom-engine-js';

const roomEngine: Record<string, TUIRoomEngine | null> = { instance: null };
const deviceManager: { instance: TUIRoomDeviceManager | null | undefined } = {
  instance: null,
};

TUIRoomEngine.once('ready', () => {
  // todo: 这里的 enableSEI 确认有没有优化方式
  TRTCCloud.callExperimentalAPI(
    JSON.stringify({
      api: 'enableSEI',
      params: {
        enable: true,
      },
    }),
  );
  roomEngine.instance = TUIRoomEngine.getInstance();
  deviceManager.instance = roomEngine.instance?.getMediaDeviceManager();
});

export function useDeviceManager() {
  return deviceManager;
}

export function useRoomEngine() {
  return roomEngine;
}

export default useRoomEngine;
