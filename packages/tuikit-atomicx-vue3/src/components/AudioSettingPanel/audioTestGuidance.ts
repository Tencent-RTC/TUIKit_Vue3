import { DeviceError } from '../../types/device';

export function getMicrophoneTestFailureGuidanceKey(error: DeviceError): string {
  switch (error) {
    case DeviceError.NoSystemPermission:
      return 'AudioSettingPanel.Microphone permission is unavailable. Allow it in browser or system settings, then test again.';
    case DeviceError.NoDeviceDetected:
      return 'AudioSettingPanel.No microphone device detected. Check the connection, then test again.';
    case DeviceError.OccupiedError:
      return 'AudioSettingPanel.Microphone is being used by another application. Close that application, then test again.';
    case DeviceError.NotSupportCapture:
      return 'AudioSettingPanel.This microphone does not support capture.';
    case DeviceError.UnknownError:
    case DeviceError.NoError:
    default:
      return 'AudioSettingPanel.Unable to test microphone. Please try again.';
  }
}

export function getSpeakerTestFailureGuidanceKey(): string {
  return 'AudioSettingPanel.Unable to test speaker. Check the output device, then try again.';
}
