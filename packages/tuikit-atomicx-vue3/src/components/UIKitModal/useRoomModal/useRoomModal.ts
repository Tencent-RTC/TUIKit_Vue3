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

interface ErrorMatcher {
  code: number;
  /** When provided, this matcher only applies when the error message matches the pattern. */
  messagePattern?: RegExp;
  /** When provided, this matcher only applies when called from this specific API. */
  apiName?: string;
  config: ErrorConfig;
}

const ERROR_MATCHERS: ErrorMatcher[] = [
  // Custom ErrorCode
  { code: ErrorCode.ERR_REQUIRE_PAYMENT_CONTENT, config: { id: 20003, i18nKey: 'Modal.RequirePaymentContent' } },
  { code: ErrorCode.DEVICE_FAILED, config: { id: 20008, i18nKey: 'Modal.DeviceFailed' } },
  { code: ErrorCode.DEVICE_NOT_DETECTED, config: { id: 20009, i18nKey: 'Modal.DeviceNotDetected' } },
  { code: ErrorCode.DEVICE_PERMISSION_DENIED, config: { id: 20010, i18nKey: 'Modal.DevicePermissionDenied' } },
  { code: ErrorCode.USER_SIG_EXPIRED, config: { id: 20004, i18nKey: 'Modal.UserSigExpired' } },
  { code: ErrorCode.INVALID_SIGNATURE, config: { id: 20005, i18nKey: 'Modal.InvalidSignature' } },
  { code: ErrorCode.USER_ID_NOT_MATCH_USER_SIG, config: { id: 20006, i18nKey: 'Modal.UserIdNotMatchUserSig' } },
  { code: ErrorCode.SDKAppID_NOT_MATCH_USER_SIG, config: { id: 20007, i18nKey: 'Modal.SdkAppIdNotMatchUserSig' } },
  // TUIErrorCode from SDK
  { code: TUIErrorCode.ERR_REQUIRE_PAYMENT, config: { id: 20011, i18nKey: 'Modal.RequirePaymentContent' } },
  { code: TUIErrorCode.ERR_CAMERA_NOT_AUTHORIZED, config: { id: 20012, i18nKey: 'Modal.CameraPermissionDenied' } },
  { code: TUIErrorCode.ERR_MICROPHONE_NOT_AUTHORIZED, config: { id: 20013, i18nKey: 'Modal.MicrophonePermissionDenied' } },
  { code: TUIErrorCode.ERR_CAMERA_START_FAILED, config: { id: 20014, i18nKey: 'Modal.CameraStartFailed' } },
  { code: TUIErrorCode.ERR_MICROPHONE_START_FAILED, config: { id: 20015, i18nKey: 'Modal.MicrophoneStartFailed' } },
  // roomManager error code — all three are API-specific so apiName is required for them to match
  { code: TUIErrorCode.ERR_INVALID_PARAMETER, apiName: 'endRoom', messagePattern: /the room identifier is null, please check room is created/, config: { id: 20016, i18nKey: 'Modal.PleaseCreateOrJoinRoomBeforeDismiss' } },
  { code: TUIErrorCode.ERR_ROOM_ID_OCCUPIED, apiName: 'createAndJoinRoom', config: { id: 20017, i18nKey: 'Modal.PleaseCreateRoomByOtherRoomId' } },
  { code: TUIErrorCode.ERR_ROOM_ID_NOT_EXIST, apiName: 'joinRoom', config: { id: 20018, i18nKey: 'Modal.PleaseCreateRoomFirst' } },
];

/**
 * Resolve ErrorConfig by matching code, then narrowing by apiName and messagePattern.
 * Priority (highest to lowest):
 *   1. code + apiName + messagePattern
 *   2. code + apiName (no messagePattern)
 *   3. code + messagePattern (no apiName)
 *   4. code only (generic fallback)
 * Matchers with apiName set will never match when a different (or no) apiName is passed.
 */
function resolveConfig(code: number, message?: string, apiName?: string): ErrorConfig | undefined {
  const candidates = ERROR_MATCHERS.filter(m => m.code === code);
  if (!candidates.length) {
    return undefined;
  }

  if (apiName) {
    const apiCandidates = candidates.filter(m => m.apiName === apiName);
    if (apiCandidates.length) {
      if (message) {
        const specific = apiCandidates.find(m => m.messagePattern?.test(message));
        if (specific) {
          return specific.config;
        }
      }
      const generic = apiCandidates.find(m => !m.messagePattern);
      if (generic) {
        return generic.config;
      }
    }
  }

  // Fall through to matchers that have no apiName restriction
  const noApiCandidates = candidates.filter(m => !m.apiName);
  if (message) {
    const specific = noApiCandidates.find(m => m.messagePattern?.test(message));
    if (specific) {
      return specific.config;
    }
  }
  return noApiCandidates.find(m => !m.messagePattern)?.config;
}

/**
 * Handle error and show UIKitModal
 * @param error - Error object with code and optional message properties
 * @param apiName - The state API name that triggered the error (e.g. 'createAndJoinRoom')
 */
function handleErrorWithModal(error: { code?: number; message?: string }, apiName?: string): void {
  const { t } = useUIKit();

  const { code, message } = error;
  if (!code) {
    return;
  }

  const config = resolveConfig(code, message, apiName);
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
