export enum CameraGuidanceState {
  None = 'none',
  Unavailable = 'unavailable',
  OpenFailed = 'open-failed',
  SwitchFailed = 'switch-failed',
}

export type CameraPermissionState = PermissionState | 'unsupported';

export function resolveCameraGuidanceState(input: {
  cameraCount: number;
  permission: CameraPermissionState;
  previewFailure: CameraGuidanceState;
}): CameraGuidanceState {
  if (input.cameraCount === 0 || input.permission === 'denied') {
    return CameraGuidanceState.Unavailable;
  }
  return input.previewFailure;
}

export function getCameraGuidanceKeys(state: CameraGuidanceState): {
  titleKey: string;
  descKey: string;
} | null {
  switch (state) {
    case CameraGuidanceState.Unavailable:
      return {
        titleKey: 'LiveScenePanel.No available camera detected',
        descKey: 'LiveScenePanel.Check the camera is connected and allowed in the browser or system settings, then close this dialog and add again, or refresh the page.',
      };
    case CameraGuidanceState.OpenFailed:
      return {
        titleKey: 'LiveScenePanel.Unable to open camera',
        descKey: 'LiveScenePanel.Check camera permission, close any app using the camera, then close this dialog and add again, or refresh the page.',
      };
    case CameraGuidanceState.SwitchFailed:
      return {
        titleKey: 'LiveScenePanel.Unable to switch camera',
        descKey: 'LiveScenePanel.Check camera permission, close any app using the camera, then close this dialog and add again, or refresh the page.',
      };
    case CameraGuidanceState.None:
    default:
      return null;
  }
}
