export const resource = {
  'ChatErrorModal.title': 'Developer Tip',

  // Login
  'ChatErrorModal.login_invalid_sdk_app_id': 'Missing correct SDKAppID. You can obtain it via the <a target="_blank" href="https://console.trtc.io/">Chat Console</a>.',
  'ChatErrorModal.login_invalid_user_id': 'Missing correct userID. The userID format should be a non-empty string.',
  'ChatErrorModal.login_invalid_secret_key': 'Missing correct secretKey. You can obtain it via the <a target="_blank" href="https://console.trtc.io/">Chat Console</a>.',
  'ChatErrorModal.login_invalid_user_sig': 'Missing correct userSig. You can obtain it via <a target="_blank" href="https://console.trtc.io/">Chat > Auxiliary Tools > UserSig Tools</a>.',
  'ChatErrorModal.login_user_sig_expired': 'userSig has expired. You can regenerate it via <a target="_blank" href="https://console.trtc.io/">Chat > Auxiliary Tools > UserSig Tools</a>.',
  'ChatErrorModal.login_user_sig_invalid': 'Invalid UserSig. Please use the official API to regenerate UserSig (<a target="_blank" href="https://cloud.tencent.com/document/product/269/32688">Documentation</a>).',
  'ChatErrorModal.login_user_id_not_match_user_sig': 'The UserID in the request does not match the UserID used to generate the userSig. You can use <a target="_blank" href="https://console.trtc.io/">Chat > Auxiliary Tools > UserSig Tools</a>.',
  'ChatErrorModal.login_sdk_app_id_not_match_user_sig': 'The SDKAppID in the request does not match the SDKAppID used to generate the userSig. You can use <a target="_blank" href="https://console.trtc.io/">Chat > Auxiliary Tools > UserSig Tools</a>.',
  'ChatErrorModal.login_sdk_app_id_not_found': 'SDKAppID not found. Please confirm the application information in the <a target="_blank" href="https://console.trtc.io/">Chat Console</a>.',

  // Package
  'ChatErrorModal.package_not_purchased': 'You have not purchased a plan package, or the package has expired, or the purchased package is being configured and not yet effective. Please log in to the <a target="_blank" href="https://console.trtc.io/subscription/buy/chat?packType=pro">Chat Purchase Page</a> to repurchase the package. It will take effect 5 minutes after purchase.',
  'ChatErrorModal.package_group_read_receipt_not_enabled': 'The plan package you are currently using has not enabled the group message read receipt feature. You can upgrade to the <a target="_blank" href="https://console.trtc.io/subscription/buy/chat?packType=pro">Pro</a>.',
  'ChatErrorModal.package_online_user_list_not_enabled': 'The plan package you are currently using has not enabled the online user list feature. You can upgrade to the <a target="_blank" href="https://console.trtc.io/subscription/buy/chat?packType=pro">Pro</a>.',
  'ChatErrorModal.package_cloud_search_not_enabled': 'The plan package you are currently using has not enabled the cloud search feature. You can enable <a target="_blank" href="https://console.trtc.io/chat/plugin/TUICloudSearch">Cloud Search</a>.',
  'ChatErrorModal.package_text_translation_not_enabled': 'The text message translation feature is currently offered for free. You can contact us through the <a target="_blank" href="https://t.me/+EPk6TMZEZMM5OGY1">Telegram technical exchange group</a> to enable and experience the full feature.',
  'ChatErrorModal.package_speech_to_text_not_enabled': 'The plan package you are currently using has not enabled the speech-to-text feature. You can enable <a target="_blank" href="https://cloud.tencent.com/document/product/269/110626">Speech-to-Text</a>.',

  // Call
  'ChatErrorModal.call_kit_not_integrated': 'It is detected that you have not integrated TUICallKit, so you cannot experience the audio and video call functionality. You can refer to: <a target="_blank" href="https://trtc.io/zh/document/64468?product=chat&menulabel=uikit&platform=react">integrate TUICallKit</a>.',

  // Search
  'ChatErrorModal.search_cloud_rate_limit': 'Cloud search request exceeds the backend frequency limit. Each user is allowed 2 search requests per second. Please try again later.',

  // Message
  'ChatErrorModal.message_voice_size_exceeded': 'The voice size exceeds the limit. The maximum size for uploading a voice message is 20MB.',
  'ChatErrorModal.message_image_invalid_format': 'Image message sending failed. Invalid image format. Supported image formats are: jpg, jpeg, gif, png, bmp, image, webp.',
  'ChatErrorModal.message_image_size_exceeded': 'The image size exceeds the limit. The maximum size for uploading an image is 20MB.',
  'ChatErrorModal.message_image_sensitive_content': 'The image in the message contains sensitive content. Sending failed.',
  'ChatErrorModal.message_video_invalid_format': 'Video message sending failed. Invalid video format. Supported video formats are: mp4, quicktime, mov.',
  'ChatErrorModal.message_video_size_exceeded': 'The video size exceeds the limit. The maximum size for uploading a video is 100MB.',
  'ChatErrorModal.message_file_not_exist': 'The file does not exist. Please check if the file path is correct.',
  'ChatErrorModal.message_file_size_exceeded': 'The file size exceeds the limit. The maximum size for uploading a file is 100MB.',
  'ChatErrorModal.message_file_sending_banned': 'File message failed. Sending prohibited or banned files is not allowed.',
  'ChatErrorModal.message_text_sensitive_content': 'The text in the message or profile contains sensitive content. Sending failed.',
  'ChatErrorModal.message_length_exceeded': 'The message length exceeds the limit. The message length should not exceed 12K.',
  'ChatErrorModal.message_local_audit_blocked': 'The text contains locally blocked words for review.',
  'ChatErrorModal.message_recall_time_exceeded': 'Exceeded the recall time limit. Message recall has exceeded the time limit (default 2 minutes).',

  // Reaction
  'ChatErrorModal.reaction_emoji_limit_reached': 'The maximum number of emoji reactions has been reached.',

  // Profile
  'ChatErrorModal.profile_remark_length_exceeded': 'Failed to modify the remark: the remark length must not exceed 96 bytes.',

  // Group
  'ChatErrorModal.group_announcement_length_exceeded': 'The group announcement word count exceeds the limit. The maximum length is 150.',
  'ChatErrorModal.group_name_invalid': 'The group name can only contain Chinese characters, letters, numbers, and underscores, and must be 2-20 characters long.',
  'ChatErrorModal.group_id_already_used': 'The group ID is already in use. Please choose another group ID.',
};
