import { i18next } from '@tencentcloud/uikit-base-component-vue3';
import { UIKitModal } from '../UIKitModal';

enum ChatErrorModalId {
  // Login related errors (30000-30009)
  LOGIN_INVALID_SDK_APP_ID = 30000,
  LOGIN_INVALID_USER_ID = 30001,
  LOGIN_INVALID_SECRET_KEY = 30004,
  LOGIN_INVALID_USER_SIG = 30005,
  LOGIN_USER_SIG_EXPIRED = 30006,
  LOGIN_USER_SIG_INVALID = 30042,
  LOGIN_USER_ID_NOT_MATCH_USER_SIG = 30007,
  LOGIN_SDK_APP_ID_NOT_MATCH_USER_SIG = 30008,
  LOGIN_SDK_APP_ID_NOT_FOUND = 30041,

  // Package/Feature not enabled errors (30002, 30014-30019)
  PACKAGE_NOT_PURCHASED = 30002,
  PACKAGE_GROUP_READ_RECEIPT_NOT_ENABLED = 30014,
  PACKAGE_ONLINE_USER_LIST_NOT_ENABLED = 30015,
  PACKAGE_CLOUD_SEARCH_NOT_ENABLED = 30016,
  PACKAGE_TEXT_TRANSLATION_NOT_ENABLED = 30018,
  PACKAGE_SPEECH_TO_TEXT_NOT_ENABLED = 30019,

  // Call related errors (30010)
  CALL_KIT_NOT_INTEGRATED = 30010,

  // Search related errors (30017)
  SEARCH_CLOUD_RATE_LIMIT = 30017,

  // Message sending errors (30020-30031)
  MESSAGE_VOICE_SIZE_EXCEEDED = 30020,
  MESSAGE_IMAGE_INVALID_FORMAT = 30021,
  MESSAGE_IMAGE_SIZE_EXCEEDED = 30022,
  MESSAGE_IMAGE_SENSITIVE_CONTENT = 30023,
  MESSAGE_VIDEO_INVALID_FORMAT = 30024,
  MESSAGE_VIDEO_SIZE_EXCEEDED = 30025,
  MESSAGE_FILE_NOT_EXIST = 30026,
  MESSAGE_FILE_SIZE_EXCEEDED = 30027,
  MESSAGE_FILE_SENDING_BANNED = 30028,
  MESSAGE_TEXT_SENSITIVE_CONTENT = 30029,
  MESSAGE_LENGTH_EXCEEDED = 30030,
  MESSAGE_LOCAL_AUDIT_BLOCKED = 30031,
  MESSAGE_RECALL_TIME_EXCEEDED = 30039,

  // Reaction related errors (30033)
  REACTION_EMOJI_LIMIT_REACHED = 30033,

  // Profile related errors (30034)
  PROFILE_REMARK_LENGTH_EXCEEDED = 30034,

  // Group related errors (30035-30036, 30040)
  GROUP_ANNOUNCEMENT_LENGTH_EXCEEDED = 30035,
  GROUP_NAME_INVALID = 30036,
  GROUP_ID_ALREADY_USED = 30040,
}

interface ModalConfig {
  i18nKey: string;
}

const MODAL_CONFIG_MAP: Record<number, ModalConfig> = {
  // Login
  [ChatErrorModalId.LOGIN_INVALID_SDK_APP_ID]: { i18nKey: 'login_invalid_sdk_app_id' },
  [ChatErrorModalId.LOGIN_INVALID_USER_ID]: { i18nKey: 'login_invalid_user_id' },
  [ChatErrorModalId.LOGIN_INVALID_SECRET_KEY]: { i18nKey: 'login_invalid_secret_key' },
  [ChatErrorModalId.LOGIN_INVALID_USER_SIG]: { i18nKey: 'login_invalid_user_sig' },
  [ChatErrorModalId.LOGIN_USER_SIG_EXPIRED]: { i18nKey: 'login_user_sig_expired' },
  [ChatErrorModalId.LOGIN_USER_SIG_INVALID]: { i18nKey: 'login_user_sig_invalid' },
  [ChatErrorModalId.LOGIN_USER_ID_NOT_MATCH_USER_SIG]: { i18nKey: 'login_user_id_not_match_user_sig' },
  [ChatErrorModalId.LOGIN_SDK_APP_ID_NOT_MATCH_USER_SIG]: { i18nKey: 'login_sdk_app_id_not_match_user_sig' },
  [ChatErrorModalId.LOGIN_SDK_APP_ID_NOT_FOUND]: { i18nKey: 'login_sdk_app_id_not_found' },

  // Package
  [ChatErrorModalId.PACKAGE_NOT_PURCHASED]: { i18nKey: 'package_not_purchased' },
  [ChatErrorModalId.PACKAGE_GROUP_READ_RECEIPT_NOT_ENABLED]: { i18nKey: 'package_group_read_receipt_not_enabled' },
  [ChatErrorModalId.PACKAGE_ONLINE_USER_LIST_NOT_ENABLED]: { i18nKey: 'package_online_user_list_not_enabled' },
  [ChatErrorModalId.PACKAGE_CLOUD_SEARCH_NOT_ENABLED]: { i18nKey: 'package_cloud_search_not_enabled' },
  [ChatErrorModalId.PACKAGE_TEXT_TRANSLATION_NOT_ENABLED]: { i18nKey: 'package_text_translation_not_enabled' },
  [ChatErrorModalId.PACKAGE_SPEECH_TO_TEXT_NOT_ENABLED]: { i18nKey: 'package_speech_to_text_not_enabled' },

  // Call
  [ChatErrorModalId.CALL_KIT_NOT_INTEGRATED]: { i18nKey: 'call_kit_not_integrated' },

  // Search
  [ChatErrorModalId.SEARCH_CLOUD_RATE_LIMIT]: { i18nKey: 'search_cloud_rate_limit' },

  // Message
  [ChatErrorModalId.MESSAGE_VOICE_SIZE_EXCEEDED]: { i18nKey: 'message_voice_size_exceeded' },
  [ChatErrorModalId.MESSAGE_IMAGE_INVALID_FORMAT]: { i18nKey: 'message_image_invalid_format' },
  [ChatErrorModalId.MESSAGE_IMAGE_SIZE_EXCEEDED]: { i18nKey: 'message_image_size_exceeded' },
  [ChatErrorModalId.MESSAGE_IMAGE_SENSITIVE_CONTENT]: { i18nKey: 'message_image_sensitive_content' },
  [ChatErrorModalId.MESSAGE_VIDEO_INVALID_FORMAT]: { i18nKey: 'message_video_invalid_format' },
  [ChatErrorModalId.MESSAGE_VIDEO_SIZE_EXCEEDED]: { i18nKey: 'message_video_size_exceeded' },
  [ChatErrorModalId.MESSAGE_FILE_NOT_EXIST]: { i18nKey: 'message_file_not_exist' },
  [ChatErrorModalId.MESSAGE_FILE_SIZE_EXCEEDED]: { i18nKey: 'message_file_size_exceeded' },
  [ChatErrorModalId.MESSAGE_FILE_SENDING_BANNED]: { i18nKey: 'message_file_sending_banned' },
  [ChatErrorModalId.MESSAGE_TEXT_SENSITIVE_CONTENT]: { i18nKey: 'message_text_sensitive_content' },
  [ChatErrorModalId.MESSAGE_LENGTH_EXCEEDED]: { i18nKey: 'message_length_exceeded' },
  [ChatErrorModalId.MESSAGE_LOCAL_AUDIT_BLOCKED]: { i18nKey: 'message_local_audit_blocked' },
  [ChatErrorModalId.MESSAGE_RECALL_TIME_EXCEEDED]: { i18nKey: 'message_recall_time_exceeded' },

  // Reaction
  [ChatErrorModalId.REACTION_EMOJI_LIMIT_REACHED]: { i18nKey: 'reaction_emoji_limit_reached' },

  // Profile
  [ChatErrorModalId.PROFILE_REMARK_LENGTH_EXCEEDED]: { i18nKey: 'profile_remark_length_exceeded' },

  // Group
  [ChatErrorModalId.GROUP_ANNOUNCEMENT_LENGTH_EXCEEDED]: { i18nKey: 'group_announcement_length_exceeded' },
  [ChatErrorModalId.GROUP_NAME_INVALID]: { i18nKey: 'group_name_invalid' },
  [ChatErrorModalId.GROUP_ID_ALREADY_USED]: { i18nKey: 'group_id_already_used' },
};

const ERROR_CODE_TO_MODAL_ID: Record<number, ChatErrorModalId> = {
  // Login
  2000: ChatErrorModalId.LOGIN_INVALID_SDK_APP_ID,
  2002: ChatErrorModalId.LOGIN_INVALID_USER_ID,
  2003: ChatErrorModalId.LOGIN_INVALID_USER_SIG,
  70001: ChatErrorModalId.LOGIN_USER_SIG_EXPIRED,
  70003: ChatErrorModalId.LOGIN_USER_SIG_INVALID,
  70013: ChatErrorModalId.LOGIN_USER_ID_NOT_MATCH_USER_SIG,
  70014: ChatErrorModalId.LOGIN_SDK_APP_ID_NOT_MATCH_USER_SIG,
  70020: ChatErrorModalId.LOGIN_SDK_APP_ID_NOT_FOUND,

  // Search
  60018: ChatErrorModalId.SEARCH_CLOUD_RATE_LIMIT,

  // Message
  2301: ChatErrorModalId.MESSAGE_VOICE_SIZE_EXCEEDED,
  2252: ChatErrorModalId.MESSAGE_IMAGE_INVALID_FORMAT,
  2253: ChatErrorModalId.MESSAGE_IMAGE_SIZE_EXCEEDED,
  2352: ChatErrorModalId.MESSAGE_VIDEO_INVALID_FORMAT,
  2351: ChatErrorModalId.MESSAGE_VIDEO_SIZE_EXCEEDED,
  2401: ChatErrorModalId.MESSAGE_FILE_NOT_EXIST,
  2402: ChatErrorModalId.MESSAGE_FILE_SIZE_EXCEEDED,
  3123: ChatErrorModalId.MESSAGE_LOCAL_AUDIT_BLOCKED,
  20016: ChatErrorModalId.MESSAGE_RECALL_TIME_EXCEEDED,
  10031: ChatErrorModalId.MESSAGE_RECALL_TIME_EXCEEDED,

  // Group
  10021: ChatErrorModalId.GROUP_ID_ALREADY_USED,
};

/**
 * Show modal by ChatErrorModalId
 * Use this method when you know exactly which modal to show
 * @param modalId - The ChatErrorModalId to show
 * @example
 * // When sending image and got 80004 error
 * showChatErrorModalById(ChatErrorModalId.MESSAGE_IMAGE_SENSITIVE_CONTENT);
 *
 * // When calling cloud search and got 60020 error
 * showChatErrorModalById(ChatErrorModalId.PACKAGE_CLOUD_SEARCH_NOT_ENABLED);
 */
function showChatErrorModalById(modalId: ChatErrorModalId): void {
  const config = MODAL_CONFIG_MAP[modalId];
  if (config) {
    UIKitModal.openModal({
      id: modalId,
      title: i18next.t('ChatErrorModal.title'),
      content: i18next.t(`ChatErrorModal.${config.i18nKey}`),
      type: 'error',
    });
  }
}

/**
 * Handle SDK error and show modal automatically
 * Only works for errorCodes with unique 1:1 mapping
 * For ambiguous errorCodes, this method will do nothing - use showChatErrorModalById instead
 * @param error - Error object with code property
 * @returns boolean - true if modal was shown, false if errorCode is ambiguous or unknown
 * @example
 * try {
 *   await sendMessage();
 * } catch (error) {
 *   // Will show modal for unique errorCodes like 2000, 70001, etc.
 *   // Will return false for ambiguous codes like -1, 80004, 3122, 60020
 *   const handled = handleChatErrorWithModal(error);
 *   if (!handled) {
 *     // Handle ambiguous error manually based on context
 *     showChatErrorModalById(ChatErrorModalId.MESSAGE_IMAGE_SENSITIVE_CONTENT);
 *   }
 * }
 */
function handleChatErrorWithModal(error: { code?: number }): boolean {
  const errorCode = error.code;
  if (errorCode === undefined || errorCode === null) {
    return false;
  }

  const modalId = ERROR_CODE_TO_MODAL_ID[errorCode];
  if (modalId !== undefined) {
    showChatErrorModalById(modalId);
    return true;
  }

  return false;
}

export {
  showChatErrorModalById,
  handleChatErrorWithModal,
  ChatErrorModalId,
};
