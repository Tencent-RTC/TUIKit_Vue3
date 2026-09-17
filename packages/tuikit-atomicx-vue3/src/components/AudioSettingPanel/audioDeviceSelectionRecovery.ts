export type MicrophonePermissionState = PermissionState | 'unsupported';

export function getRecoveredDeviceId(
  currentDeviceId: string | undefined,
  devices: Array<{ deviceId: string }>,
): string {
  if (currentDeviceId && devices.some(device => device.deviceId === currentDeviceId)) {
    return currentDeviceId;
  }
  return devices[0]?.deviceId || '';
}

export function shouldRefreshMicrophoneBeforeTest(
  permission: MicrophonePermissionState,
): boolean {
  return permission !== 'denied';
}

type MicrophoneDeviceSyncResult =
  | { success: true }
  | {
    success: false;
    reason: 'permission-denied' | 'no-device' | 'sync-failed' | 'cancelled';
  };

export async function syncMicrophoneDeviceSelection(options: {
  permission: MicrophonePermissionState;
  refreshDevices: () => Promise<void>;
  getCurrentDeviceId: () => string | undefined;
  getDevices: () => Array<{ deviceId: string }>;
  selectDevice: (deviceId: string) => Promise<void>;
  isActive?: () => boolean;
}): Promise<MicrophoneDeviceSyncResult> {
  const isActive = options.isActive ?? (() => true);
  if (!isActive()) {
    return { success: false, reason: 'cancelled' };
  }
  if (!shouldRefreshMicrophoneBeforeTest(options.permission)) {
    return { success: false, reason: 'permission-denied' };
  }

  try {
    await options.refreshDevices();
    if (!isActive()) {
      return { success: false, reason: 'cancelled' };
    }
    const currentDeviceId = options.getCurrentDeviceId();
    const deviceId = getRecoveredDeviceId(currentDeviceId, options.getDevices());
    if (!deviceId) {
      return { success: false, reason: 'no-device' };
    }
    if (deviceId !== currentDeviceId) {
      await options.selectDevice(deviceId);
    }
    return { success: true };
  } catch {
    return { success: false, reason: 'sync-failed' };
  }
}
