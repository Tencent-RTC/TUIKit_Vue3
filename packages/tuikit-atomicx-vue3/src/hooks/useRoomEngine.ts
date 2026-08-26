import TUIRoomEngine, { TRTCCloud } from '@tencentcloud/tuiroom-engine-js';
import type { TUIRoomDeviceManager } from '@tencentcloud/tuiroom-engine-js';

const roomEngine: Record<string, TUIRoomEngine | null> = { instance: null };
const deviceManager: { instance: TUIRoomDeviceManager | null | undefined } = {
  instance: null,
};

TRTCCloud.callExperimentalAPI(
  JSON.stringify({
    api: 'enableSEI',
    params: {
      enable: true,
    },
  }),
);
TUIRoomEngine.once('ready', () => {
  roomEngine.instance = TUIRoomEngine.getInstance();
  deviceManager.instance = roomEngine.instance?.getMediaDeviceManager();
});

export function useDeviceManager() {
  return deviceManager;
}

export function useRoomEngine() {
  return roomEngine;
}

export function logInfo(...args: unknown[]) {
  roomEngine.instance?.logger.info(...args);
}

export function logDebug(...args: unknown[]) {
  roomEngine.instance?.logger.debug(...args);
}

export function logError(...args: unknown[]) {
  roomEngine.instance?.logger.error(...args);
}

export function logWarning(...args: unknown[]) {
  roomEngine.instance?.logger.warn(...args);
}

export default useRoomEngine;
