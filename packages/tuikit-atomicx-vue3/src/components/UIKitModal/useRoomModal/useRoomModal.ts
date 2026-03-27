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
  code?: number;
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
  { messagePattern: /Please login firstly by useLoginState/, apiName: 'createAndJoinRoom', config: { id: 20016, i18nKey: 'Modal.PleaseLoginFirstBeforeCreateAndJoinRoom' } },
  { messagePattern: /Please login firstly by useLoginState/, apiName: 'joinRoom', config: { id: 20017, i18nKey: 'Modal.PleaseLoginFirstBeforeJoinRoom' } },
  { messagePattern: /Please login firstly by useLoginState/, apiName: 'getScheduledRoomList', config: { id: 20018, i18nKey: 'Modal.PleaseLoginFirstBeforeGetScheduledRoomList' } },
  { messagePattern: /Please login firstly by useLoginState/, apiName: 'scheduleRoom', config: { id: 20019, i18nKey: 'Modal.PleaseLoginFirstBeforeScheduleRoom' } },
  { code: TUIErrorCode.ERR_ROOM_ID_NOT_EXIST, apiName: 'joinRoom', config: { id: 20020, i18nKey: 'Modal.PleaseCreateRoomFirst' } },
  { code: TUIErrorCode.ERR_INVALID_PARAMETER, apiName: 'endRoom', messagePattern: /the room identifier is null, please check room is created/, config: { id: 20021, i18nKey: 'Modal.PleaseCreateOrJoinRoomBeforeDismiss' } },
];

/**
 * Returns the number of defined constraint fields on a matcher.
 * More constraints = higher specificity = should be preferred over general matchers.
 */
function matcherSpecificity(m: ErrorMatcher): number {
  return (m.code !== undefined ? 1 : 0)
    + (m.apiName !== undefined ? 1 : 0)
    + (m.messagePattern !== undefined ? 1 : 0);
}

/**
 * Pre-sorted copy of ERROR_MATCHERS: higher-specificity matchers come first so that
 * resolveConfig always prefers the most-specific rule regardless of declaration order.
 * Declaration order within the same specificity level is preserved (stable sort).
 */
const SORTED_ERROR_MATCHERS = [...ERROR_MATCHERS].sort(
  (a, b) => matcherSpecificity(b) - matcherSpecificity(a),
);

/**
 * Resolve ErrorConfig by finding the most-specific matcher where every defined field matches.
 * A field that is undefined on the matcher acts as a wildcard.
 */
function resolveConfig(code?: number, message?: string, apiName?: string): ErrorConfig | undefined {
  return SORTED_ERROR_MATCHERS.find(m =>
    (m.code === undefined || m.code === code)
    && (m.apiName === undefined || m.apiName === apiName)
    && (m.messagePattern === undefined || (!!message && m.messagePattern.test(message))),
  )?.config;
}

/**
 * Handle error and show UIKitModal.
 * When a matching ErrorConfig is found, the localized message is shown.
 * @param error - Error object with optional code and message properties
 * @param apiName - The state API name that triggered the error (e.g. 'createAndJoinRoom')
 */
function handleErrorWithModal(error: { code?: number; message?: string }, apiName?: string): void {
  const { t } = useUIKit();

  const { code, message } = error;
  if (!code && !message) {
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
    return;
  }
}

export const useRoomModal = () => ({
  handleErrorWithModal,
});
