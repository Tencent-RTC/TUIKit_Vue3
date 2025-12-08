import { TUIErrorCode } from '@tencentcloud/tuiroom-engine-js';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { UIKitModal } from '../UIKitModal';

export enum ErrorCode {
  ERR_REQUIRE_PAYMENT_CONTENT = 100007,
  USER_SIG_EXPIRED = 70001,
  INVALID_SIGNATURE = 70003,
  USER_ID_NOT_MATCH_USER_SIG = 70013,
  SDKAppID_NOT_MATCH_USER_SIG = 70014,
  DEVICE_FAILED = 5300,
  DEVICE_NOT_DETECTED = 5301,
  DEVICE_PERMISSION_DENIED = 5302,
}

interface ErrorConfig {
  id: number;
  i18nKey: string;
}

const ERROR_CONFIG_MAP: Record<number, ErrorConfig> = {
  // Custom ErrorCode
  [ErrorCode.ERR_REQUIRE_PAYMENT_CONTENT]: {
    id: 20003,
    i18nKey: 'Modal.RequirePaymentContent',
  },
  [ErrorCode.DEVICE_FAILED]: {
    id: 20008,
    i18nKey: 'Modal.DeviceFailed',
  },
  [ErrorCode.DEVICE_NOT_DETECTED]: {
    id: 20009,
    i18nKey: 'Modal.DeviceNotDetected',
  },
  [ErrorCode.DEVICE_PERMISSION_DENIED]: {
    id: 20010,
    i18nKey: 'Modal.DevicePermissionDenied',
  },
  [ErrorCode.USER_SIG_EXPIRED]: {
    id: 20004,
    i18nKey: 'Modal.UserSigExpired',
  },
  [ErrorCode.INVALID_SIGNATURE]: {
    id: 20005,
    i18nKey: 'Modal.InvalidSignature',
  },
  [ErrorCode.USER_ID_NOT_MATCH_USER_SIG]: {
    id: 20006,
    i18nKey: 'Modal.UserIdNotMatchUserSig',
  },
  [ErrorCode.SDKAppID_NOT_MATCH_USER_SIG]: {
    id: 20007,
    i18nKey: 'Modal.SdkAppIdNotMatchUserSig',
  },
  // TUIErrorCode from SDK
  [TUIErrorCode.ERR_REQUIRE_PAYMENT]: {
    id: 20011,
    i18nKey: 'Modal.RequirePaymentContent',
  },
  [TUIErrorCode.ERR_CAMERA_NOT_AUTHORIZED]: {
    id: 20012,
    i18nKey: 'Modal.CameraPermissionDenied',
  },
  [TUIErrorCode.ERR_MICROPHONE_NOT_AUTHORIZED]: {
    id: 20013,
    i18nKey: 'Modal.MicrophonePermissionDenied',
  },
  [TUIErrorCode.ERR_CAMERA_START_FAILED]: {
    id: 20014,
    i18nKey: 'Modal.CameraStartFailed',
  },
  [TUIErrorCode.ERR_MICROPHONE_START_FAILED]: {
    id: 20015,
    i18nKey: 'Modal.MicrophoneStartFailed',
  },
};

/**
 * Handle error and show UIKitModal
 * @param error - Error object with code property
 */
function handleErrorWithModal(error: { code?: number }): void {
  const { t } = useUIKit();

  const errorCode = error.code;
  if (!errorCode) {
    return;
  }

  const config = ERROR_CONFIG_MAP[errorCode];
  if (config) {
    UIKitModal.openModal({
      id: config.id,
      title: t('Room.Modal.Title'),
      content: t(`Room.${config.i18nKey}`),
      type: 'error',
    });
  }
}

export const useRoomModal = () => ({
  handleErrorWithModal,
});
