import { TUILogin } from '@tencentcloud/tui-core-lite';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { addI18n } from '../../../i18n';
import { resource as enResource } from './i18n/en-US/index';
import { resource as zhResource } from './i18n/zh-CN/index';
import { UIKitModal } from '../UIKitModal';

addI18n('en-US', { translation: enResource });
addI18n('zh-CN', { translation: zhResource });

const IM_CONSOLE_CN_URL = 'https://console.cloud.tencent.com/im/e';
const IM_CONSOLE_INTL_URL = 'https://console.trtc.io/chat/login-message';
const LIVE_ACTIVATE_DOC_CN_URL = 'https://cloud.tencent.com/document/product/647/105439';
const LIVE_TRIAL_CONSOLE_CN_URL = 'https://console.cloud.tencent.com/trtc/app';
const LIVE_PURCHASE_CN_URL = 'https://buy.cloud.tencent.com/trtc?tab=uikit&type=live';
const LIVE_ACTIVATE_DOC_INTL_URL = 'https://trtc.io/document/60033?product=live&menulabel=uikit&platform=electron';
const LIVE_OVERVIEW_INTL_URL = 'https://console.trtc.io/live/overview';

enum LiveErrorModalId {
  DEVICE_PERMISSION_DENIED = 41001,
  MICROPHONE_UNAVAILABLE = 41002,
  CAMERA_UNAVAILABLE = 41003,
  INVALID_USER_ID = 41004,
  USER_ID_NOT_MATCH_USERSIG = 41005,
  USERSIG_INVALID = 41006,
  ROOM_NOT_EXIST = 41007,
  PACKAGE_NOT_PURCHASED = 41008,
  PACKAGE_LIMIT_OR_FREQ_LIMIT = 41009,
  SDK_NOT_INITIALIZED = 41010,
  USERSIG_INVALID_LOGIN = 41011,
  USERSIG_EXPIRED = 41012,
  MULTI_LOGIN_KICKED_OFFLINE = 41013,
  CAMERA_PERMISSION_DENIED = 41014,
}

interface ModalConfig {
  i18nKey: string;
}

interface LiveErrorModalOptions {
  onConfirm?: () => void;
}

interface NormalizedLiveError {
  code?: number;
  message: string;
  sdkAppId?: number;
}

const MODAL_CONFIG_MAP: Record<LiveErrorModalId, ModalConfig> = {
  [LiveErrorModalId.DEVICE_PERMISSION_DENIED]: { i18nKey: 'message_device_permission_denied' },
  [LiveErrorModalId.CAMERA_PERMISSION_DENIED]: { i18nKey: 'message_camera_permission_denied' },
  [LiveErrorModalId.MICROPHONE_UNAVAILABLE]: { i18nKey: 'message_microphone_unavailable' },
  [LiveErrorModalId.CAMERA_UNAVAILABLE]: { i18nKey: 'message_camera_unavailable' },
  [LiveErrorModalId.INVALID_USER_ID]: { i18nKey: 'message_invalid_user_id' },
  [LiveErrorModalId.USER_ID_NOT_MATCH_USERSIG]: { i18nKey: 'message_user_id_not_match_usersig' },
  [LiveErrorModalId.USERSIG_INVALID]: { i18nKey: 'message_usersig_invalid' },
  [LiveErrorModalId.USERSIG_INVALID_LOGIN]: { i18nKey: 'message_usersig_invalid_login_intl' },
  [LiveErrorModalId.USERSIG_EXPIRED]: { i18nKey: 'message_usersig_expired_intl' },
  [LiveErrorModalId.MULTI_LOGIN_KICKED_OFFLINE]: { i18nKey: 'message_multi_login_kicked_offline_intl' },
  [LiveErrorModalId.ROOM_NOT_EXIST]: { i18nKey: 'message_room_not_exist' },
  [LiveErrorModalId.PACKAGE_NOT_PURCHASED]: { i18nKey: 'message_package_not_purchased_intl' },
  [LiveErrorModalId.PACKAGE_LIMIT_OR_FREQ_LIMIT]: { i18nKey: 'message_package_limit_or_freq_limit' },
  [LiveErrorModalId.SDK_NOT_INITIALIZED]: { i18nKey: 'message_sdk_not_initialized' },
};

const ERROR_CODE_TO_MODAL_ID: Record<number, LiveErrorModalId> = {
  // 41010 SDK 未初始化
  [-1002]: LiveErrorModalId.SDK_NOT_INITIALIZED,

  // 41001 设备权限被拒绝
  [10004]: LiveErrorModalId.DEVICE_PERMISSION_DENIED,
  [20013]: LiveErrorModalId.DEVICE_PERMISSION_DENIED,
  [-1003]: LiveErrorModalId.DEVICE_PERMISSION_DENIED,
  [-1105]: LiveErrorModalId.DEVICE_PERMISSION_DENIED,

  // 41014 摄像头权限被拒绝
  [-5]: LiveErrorModalId.CAMERA_PERMISSION_DENIED,

  // 41002 麦克风不可用
  [10005]: LiveErrorModalId.MICROPHONE_UNAVAILABLE,
  [20015]: LiveErrorModalId.MICROPHONE_UNAVAILABLE,
  [-1104]: LiveErrorModalId.MICROPHONE_UNAVAILABLE,
  [-1106]: LiveErrorModalId.MICROPHONE_UNAVAILABLE,
  [-1107]: LiveErrorModalId.MICROPHONE_UNAVAILABLE,

  // 41003 摄像头不可用
  [20014]: LiveErrorModalId.CAMERA_UNAVAILABLE,
  [-1100]: LiveErrorModalId.CAMERA_UNAVAILABLE,
  [-1102]: LiveErrorModalId.CAMERA_UNAVAILABLE,
  [-1103]: LiveErrorModalId.CAMERA_UNAVAILABLE,

  // 41004 userID 缺失或格式非法
  [2002]: LiveErrorModalId.INVALID_USER_ID,
  [30001]: LiveErrorModalId.INVALID_USER_ID,

  // 41005 userID 与 userSig 不匹配
  [70013]: LiveErrorModalId.USER_ID_NOT_MATCH_USERSIG,
  [20006]: LiveErrorModalId.USER_ID_NOT_MATCH_USERSIG,
  [30007]: LiveErrorModalId.USER_ID_NOT_MATCH_USERSIG,

  // 41006 userSig 非法
  [70003]: LiveErrorModalId.USERSIG_INVALID_LOGIN,
  [70005]: LiveErrorModalId.USERSIG_INVALID,
  [70009]: LiveErrorModalId.USERSIG_INVALID,
  [70014]: LiveErrorModalId.USERSIG_INVALID,
  [70016]: LiveErrorModalId.USERSIG_INVALID,
  [70020]: LiveErrorModalId.USERSIG_INVALID,
  [70052]: LiveErrorModalId.USERSIG_INVALID,
  [20004]: LiveErrorModalId.USERSIG_INVALID,
  [30006]: LiveErrorModalId.USERSIG_INVALID,
  [30042]: LiveErrorModalId.USERSIG_INVALID,

  // 41012 userSig 过期
  [70001]: LiveErrorModalId.USERSIG_EXPIRED,

  // 41013 多端登录被踢下线
  [41013]: LiveErrorModalId.MULTI_LOGIN_KICKED_OFFLINE,

  // 41007 房间不存在
  [100004]: LiveErrorModalId.ROOM_NOT_EXIST,
  [20018]: LiveErrorModalId.ROOM_NOT_EXIST,
  [40019]: LiveErrorModalId.ROOM_NOT_EXIST,

  // 41008 套餐未购买或欠费
  [-1004]: LiveErrorModalId.PACKAGE_NOT_PURCHASED,
  [100007]: LiveErrorModalId.PACKAGE_NOT_PURCHASED,
  [20003]: LiveErrorModalId.PACKAGE_NOT_PURCHASED,
  [40002]: LiveErrorModalId.PACKAGE_NOT_PURCHASED,
  [40010]: LiveErrorModalId.PACKAGE_NOT_PURCHASED,

  // 41009 套餐额度上限或请求频控
  [40023]: LiveErrorModalId.PACKAGE_LIMIT_OR_FREQ_LIMIT,
  [100012]: LiveErrorModalId.PACKAGE_LIMIT_OR_FREQ_LIMIT,
  [100013]: LiveErrorModalId.PACKAGE_LIMIT_OR_FREQ_LIMIT,
  [101011]: LiveErrorModalId.PACKAGE_LIMIT_OR_FREQ_LIMIT,
};

const MESSAGE_RULES: Array<{ modalId: LiveErrorModalId; keywords: string[] }> = [
  {
    modalId: LiveErrorModalId.SDK_NOT_INITIALIZED,
    keywords: ['sdk not initialized', 'sdk 未初始化', 'please call login'],
  },
  {
    modalId: LiveErrorModalId.PACKAGE_LIMIT_OR_FREQ_LIMIT,
    keywords: ['too many requests', '请求频繁', 'upper limit', 'max limit', '达到上限', '超过上限'],
  },
  {
    modalId: LiveErrorModalId.PACKAGE_NOT_PURCHASED,
    keywords: ['未购买套餐', '欠费', 'no active package', 'not support seat', 'please purchase'],
  },
  {
    modalId: LiveErrorModalId.USER_ID_NOT_MATCH_USERSIG,
    keywords: ['does not match the usersig', 'user id 与用户签名不匹配', 'userid 与生成 usersig'],
  },
  {
    modalId: LiveErrorModalId.USERSIG_EXPIRED,
    keywords: ['usersig expired', 'usersig has expired', 'usersig 已过期', '签名已过期'],
  },
  {
    modalId: LiveErrorModalId.USERSIG_INVALID,
    keywords: ['usersig invalid', 'invalid usersig', 'usersig 非法', '用户签名非法', '签名无效'],
  },
  {
    modalId: LiveErrorModalId.ROOM_NOT_EXIST,
    keywords: ['room is not existed', 'room does not exist', '房间不存在', '请先创建房间'],
  },
  {
    modalId: LiveErrorModalId.CAMERA_PERMISSION_DENIED,
    keywords: [
      'camera permission denied',
      'camera not authorized',
      'camera permission',
      '摄像头权限',
      '摄像头未授权',
      '相机权限',
    ],
  },
  {
    modalId: LiveErrorModalId.DEVICE_PERMISSION_DENIED,
    keywords: ['权限被拒绝', 'permission denied', 'not authorized'],
  },
  {
    modalId: LiveErrorModalId.MICROPHONE_UNAVAILABLE,
    keywords: ['麦克风', 'microphone'],
  },
  {
    modalId: LiveErrorModalId.CAMERA_UNAVAILABLE,
    keywords: ['摄像头', 'camera'],
  },
  {
    modalId: LiveErrorModalId.INVALID_USER_ID,
    keywords: ['invalid userid', '缺少正确的 userid', 'userid 格式'],
  },
  {
    modalId: LiveErrorModalId.MULTI_LOGIN_KICKED_OFFLINE,
    keywords: ['kicked off line', 'kicked offline', 'onkickedoffline', '被踢下线', '挤下线'],
  },
];

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && /^-?\d+$/.test(value.trim())) {
    return Number(value);
  }
  return undefined;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object';
}

function readNumberFromRecord(record: Record<string, unknown>, key: string): number | undefined {
  return toNumber(record[key]);
}

function readStringFromRecord(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
}

function firstDefinedNumber(values: Array<number | undefined>): number | undefined {
  return values.find(value => value !== undefined);
}

function firstDefinedString(values: Array<string | undefined>): string | undefined {
  return values.find(value => typeof value === 'string');
}

function getContextSdkAppId(): number | undefined {
  const loginContext = TUILogin.getContext() as {
    SDKAppID?: number | string;
    sdkAppId?: number | string;
  };
  return toNumber(loginContext?.SDKAppID) ?? toNumber(loginContext?.sdkAppId);
}

function normalizeLiveError(error: unknown): NormalizedLiveError {
  const contextSdkAppId = getContextSdkAppId();

  if (typeof error === 'string') {
    return {
      message: error,
      sdkAppId: contextSdkAppId,
    };
  }

  if (!isObjectRecord(error)) {
    return {
      message: '',
      sdkAppId: contextSdkAppId,
    };
  }

  const nestedData = isObjectRecord(error.data) ? error.data : null;
  const nestedError = isObjectRecord(error.error) ? error.error : null;

  const code = firstDefinedNumber([
    readNumberFromRecord(error, 'code'),
    readNumberFromRecord(error, 'errorCode'),
    nestedData ? readNumberFromRecord(nestedData, 'code') : undefined,
    nestedData ? readNumberFromRecord(nestedData, 'errorCode') : undefined,
    nestedError ? readNumberFromRecord(nestedError, 'code') : undefined,
    nestedError ? readNumberFromRecord(nestedError, 'errorCode') : undefined,
  ]);

  const message = firstDefinedString([
    readStringFromRecord(error, 'message'),
    readStringFromRecord(error, 'msg'),
    readStringFromRecord(error, 'errMsg'),
    readStringFromRecord(error, 'reason'),
    nestedData ? readStringFromRecord(nestedData, 'message') : undefined,
    nestedError ? readStringFromRecord(nestedError, 'message') : undefined,
  ]) || '';

  const sdkAppId = firstDefinedNumber([
    readNumberFromRecord(error, 'sdkAppId'),
    readNumberFromRecord(error, 'SDKAppID'),
    nestedData ? readNumberFromRecord(nestedData, 'sdkAppId') : undefined,
    nestedData ? readNumberFromRecord(nestedData, 'SDKAppID') : undefined,
    nestedError ? readNumberFromRecord(nestedError, 'sdkAppId') : undefined,
    nestedError ? readNumberFromRecord(nestedError, 'SDKAppID') : undefined,
    contextSdkAppId,
  ]);

  return {
    code,
    message,
    sdkAppId,
  };
}

function extractSubErrorCode(message: string): number | undefined {
  const patterns = [
    /error_code\s*[:=]\s*(-?\d+)/i,
    /"code"\s*:\s*(-?\d+)/i,
    /\bcode\s*[:=]\s*(-?\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      return toNumber(match[1]);
    }
  }

  return undefined;
}

function matchByMessage(error: NormalizedLiveError): LiveErrorModalId | null {
  if (!error.message) {
    return null;
  }
  const normalizedMessage = error.message.toLowerCase();
  const matchedRule = MESSAGE_RULES.find(rule => rule.keywords.some(keyword => normalizedMessage.includes(keyword.toLowerCase())));
  return matchedRule ? matchedRule.modalId : null;
}

function resolveLiveErrorModalId(error: NormalizedLiveError): LiveErrorModalId | null {
  const subErrorCode = error.message ? extractSubErrorCode(error.message) : undefined;
  const candidates: number[] = [];
  if (subErrorCode !== undefined) {
    candidates.push(subErrorCode);
  }
  if (error.code !== undefined) {
    candidates.push(error.code);
  }

  for (const code of candidates) {
    const modalId = ERROR_CODE_TO_MODAL_ID[code];
    if (modalId !== undefined) {
      return modalId;
    }
  }

  return matchByMessage(error);
}

function isDomesticSdkAppId(sdkAppId?: number): boolean {
  if (!sdkAppId) {
    return false;
  }
  const normalizedSdkAppId = String(sdkAppId);
  return normalizedSdkAppId.startsWith('1400')
    || normalizedSdkAppId.startsWith('1600')
    || normalizedSdkAppId.startsWith('1700');
}

function resolveModalI18nKey(modalId: LiveErrorModalId, error: NormalizedLiveError): string | null {
  const config = MODAL_CONFIG_MAP[modalId];
  if (!config) {
    return null;
  }

  if (modalId === LiveErrorModalId.USERSIG_EXPIRED) {
    return isDomesticSdkAppId(error.sdkAppId)
      ? 'message_usersig_expired_cn'
      : 'message_usersig_expired_intl';
  }

  if (modalId === LiveErrorModalId.USERSIG_INVALID_LOGIN) {
    return isDomesticSdkAppId(error.sdkAppId)
      ? 'message_usersig_invalid_login_cn'
      : 'message_usersig_invalid_login_intl';
  }

  if (modalId === LiveErrorModalId.MULTI_LOGIN_KICKED_OFFLINE) {
    return isDomesticSdkAppId(error.sdkAppId)
      ? 'message_multi_login_kicked_offline_cn'
      : 'message_multi_login_kicked_offline_intl';
  }

  if (modalId === LiveErrorModalId.PACKAGE_NOT_PURCHASED) {
    return isDomesticSdkAppId(error.sdkAppId)
      ? 'message_package_not_purchased_cn'
      : 'message_package_not_purchased_intl';
  }

  return config.i18nKey;
}

function resolveMultiLoginConsoleLink(error: NormalizedLiveError): { href: string; textKey: string } {
  if (isDomesticSdkAppId(error.sdkAppId)) {
    return {
      href: IM_CONSOLE_CN_URL,
      textKey: 'multi_login_console_link_cn',
    };
  }
  return {
    href: IM_CONSOLE_INTL_URL,
    textKey: 'multi_login_console_link_intl',
  };
}

function resolvePackageGuidanceLinks(
  error: NormalizedLiveError,
): {
  isDomestic: boolean;
  activateDocHref: string;
  activateDocTextKey: string;
  trialHref?: string;
  purchaseHref?: string;
  trialTextKey?: string;
  purchaseTextKey?: string;
  overviewHref?: string;
  overviewTextKey?: string;
} {
  if (isDomesticSdkAppId(error.sdkAppId)) {
    return {
      isDomestic: true,
      activateDocHref: LIVE_ACTIVATE_DOC_CN_URL,
      trialHref: LIVE_TRIAL_CONSOLE_CN_URL,
      purchaseHref: LIVE_PURCHASE_CN_URL,
      activateDocTextKey: 'package_activate_doc_link_cn',
      trialTextKey: 'package_trial_link_cn',
      purchaseTextKey: 'package_purchase_link_cn',
    };
  }

  return {
    isDomestic: false,
    activateDocHref: LIVE_ACTIVATE_DOC_INTL_URL,
    activateDocTextKey: 'package_activate_doc_link_intl',
    overviewHref: LIVE_OVERVIEW_INTL_URL,
    overviewTextKey: 'package_overview_link_intl',
  };
}

function buildAnchor(href: string, text: string): string {
  // NOTE: href/text must come from trusted static constants and i18n resources only.
  return `<a href="${href}">${text}</a>`;
}

function resolveModalContent(
  modalId: LiveErrorModalId,
  i18nKey: string,
  error: NormalizedLiveError,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const baseContent = String(t(`LiveErrorModal.${i18nKey}`));
  if (modalId === LiveErrorModalId.MULTI_LOGIN_KICKED_OFFLINE) {
    const { href, textKey } = resolveMultiLoginConsoleLink(error);
    const linkText = String(t(`LiveErrorModal.${textKey}`));
    const consoleLink = buildAnchor(href, linkText);
    return baseContent.replace('{consoleLink}', consoleLink);
  }

  if (modalId === LiveErrorModalId.PACKAGE_NOT_PURCHASED) {
    const guidanceLinks = resolvePackageGuidanceLinks(error);
    const activateDocLink = buildAnchor(
      guidanceLinks.activateDocHref,
      String(t(`LiveErrorModal.${guidanceLinks.activateDocTextKey}`)),
    );
    if (guidanceLinks.isDomestic) {
      const trialLink = buildAnchor(
        guidanceLinks.trialHref || '',
        String(t(`LiveErrorModal.${guidanceLinks.trialTextKey}`)),
      );
      const purchaseLink = buildAnchor(
        guidanceLinks.purchaseHref || '',
        String(t(`LiveErrorModal.${guidanceLinks.purchaseTextKey}`)),
      );

      return baseContent
        .replace('{activateDocLink}', activateDocLink)
        .replace('{trialLink}', trialLink)
        .replace('{purchaseLink}', purchaseLink);
    }

    const overviewLink = buildAnchor(
      guidanceLinks.overviewHref || '',
      String(t(`LiveErrorModal.${guidanceLinks.overviewTextKey}`)),
    );
    return baseContent
      .replace('{activateDocLink}', activateDocLink)
      .replace('{overviewLink}', overviewLink);
  }

  return baseContent;
}

function readEnv(key: string): string | undefined {
  if (typeof process === 'undefined' || !process.env) {
    return undefined;
  }
  return process.env[key];
}

function isLocalDevHost(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const { hostname } = window.location;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
}

function isLiveDevErrorModalEnabled(): boolean {
  const flag = readEnv('VITE_ENABLE_LIVE_DEV_ERROR_MODAL') || readEnv('LIVE_DEV_ERROR_MODAL');
  if (flag === 'true' || flag === '1') {
    return true;
  }
  if (flag === 'false' || flag === '0') {
    return false;
  }

  const nodeEnv = readEnv('NODE_ENV');
  if (nodeEnv) {
    return nodeEnv !== 'production';
  }

  return isLocalDevHost();
}

function showLiveErrorModalById(
  modalId: LiveErrorModalId,
  error: NormalizedLiveError,
  options: LiveErrorModalOptions = {},
): void {
  const i18nKey = resolveModalI18nKey(modalId, error);
  if (!i18nKey) {
    return;
  }

  const { t } = useUIKit();
  const content = resolveModalContent(modalId, i18nKey, error, t);
  UIKitModal.openModal({
    id: modalId,
    title: t('LiveErrorModal.title'),
    content,
    type: 'error',
    showCancelButton: false,
    confirmText: t('LiveErrorModal.confirm'),
    onConfirm: options.onConfirm,
  });
}

function handleErrorWithModal(error: unknown, options: LiveErrorModalOptions = {}): boolean {
  if (!isLiveDevErrorModalEnabled()) {
    return false;
  }

  const normalizedError = normalizeLiveError(error);
  const modalId = resolveLiveErrorModalId(normalizedError);
  if (!modalId) {
    return false;
  }

  showLiveErrorModalById(modalId, normalizedError, options);
  return true;
}

export const useLiveErrorModal = () => ({
  handleErrorWithModal,
});
