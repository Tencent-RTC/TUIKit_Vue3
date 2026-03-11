export const resource = {
  ChatErrorModal: {
    title: '错误',

    // Login
    login_invalid_sdk_app_id: '缺少正确的 SDKAppID，您可以通过<a target="_blank" href="https://console.cloud.tencent.com/im">即时通信 IM 控制台</a>获取。',
    login_invalid_user_id: '缺少正确的 userID，userID 格式为非空字符串。',
    login_invalid_secret_key: '缺少正确的 secretKey，您可以通过<a target="_blank" href="https://console.cloud.tencent.com/im">即时通信 IM 控制台</a>获取。',
    login_invalid_user_sig: '缺少正确的 userSig，您可以通过<a target="_blank" href="https://console.cloud.tencent.com/im/tool-usersig">即时通信 IM 控制台 > 开发工具 > UserSig生成&校验</a>获取。',
    login_user_sig_expired: 'userSig 已过期，您可以通过<a target="_blank" href="https://console.cloud.tencent.com/im/tool-usersig">即时通信 IM 控制台 > 开发工具 > UserSig生成&校验</a>重新获取。',
    login_user_sig_invalid: 'UserSig 非法，请使用官网提供的 API 重新生成 UserSig（<a target="_blank" href="https://cloud.tencent.com/document/product/269/32688">文档</a>）。',
    login_user_id_not_match_user_sig: '请求中的 UserID 与生成 UserSig 时使用的 UserID 不一致，您可以使用<a target="_blank" href="https://console.cloud.tencent.com/im/tool-usersig">即时通信 IM 控制台 > 开发工具 > UserSig生成&校验</a>校验 UserSig。',
    login_sdk_app_id_not_match_user_sig: '请求中的 SDKAppID 与生成 UserSig 时使用的 SDKAppID 不一致。您可以使用<a target="_blank" href="https://console.cloud.tencent.com/im/tool-usersig">即时通信 IM 控制台 > 开发工具 > UserSig生成&校验</a>校验 UserSig。',
    login_sdk_app_id_not_found: 'SDKAppID 未找到，请在<a target="_blank" href="https://console.cloud.tencent.com/im">即时通信 IM 控制台</a>确认应用信息。',

    // Package
    package_not_purchased: '您未购买套餐包，或套餐包已过期，或购买的套餐包正在配置中暂未生效。请登录<a target="_blank" href="https://buy.cloud.tencent.com/avc">即时通信 IM 购买页面</a>重新购买套餐包。购买后，将在5分钟后生效。',
    package_group_read_receipt_not_enabled: '您当前购买使用的套餐包暂未开通群消息已读回执功能，您可以升级到套餐为<a target="_blank" href="https://buy.cloud.tencent.com/avc">旗舰版</a>。',
    package_online_user_list_not_enabled: '您当前购买使用的套餐包暂未开通在线用户列表功能，您可以升级到套餐为<a target="_blank" href="https://buy.cloud.tencent.com/avc">旗舰版</a>。',
    package_cloud_search_not_enabled: '您当前购买使用的套餐包暂未开通云端搜索功能，您可以开通<a target="_blank" href="https://cloud.tencent.com/document/product/269/101046">云端搜索</a>。',
    package_text_translation_not_enabled: '您当前购买使用的套餐包暂未开通文本消息翻译功能，您可以开通<a target="_blank" href="https://cloud.tencent.com/document/product/269/92661">文本消息翻译</a>。',
    package_speech_to_text_not_enabled: '您当前购买使用的套餐包暂未开通语音转文字功能，您可以开通<a target="_blank" href="https://cloud.tencent.com/document/product/269/110626">语音转文字</a>。',

    // Call
    call_kit_not_integrated: '检测到您暂未集成TUICallKit，无法体验音视频通话功能，可以参考：<a target="_blank" href="https://cloud.tencent.com/document/product/269/79861">接入 TUICallKit</a>。',

    // Search
    search_cloud_rate_limit: '云端搜索请求超过后台频率限制，单用户一秒内允许2次搜索请求，请稍后再试。',

    // Message
    message_voice_size_exceeded: '语音大小超出了限制，如果上传语音，最大限制是 20MB。',
    message_image_invalid_format: '图片消息发送失败，无效的图片格式，图片格式支持：jpg、jpeg、gif、png、bmp、image、webp。',
    message_image_size_exceeded: '图片大小超出了限制，如果上传文件，最大限制是 20MB。',
    message_image_sensitive_content: '消息中图片存在敏感内容，发送失败。',
    message_video_invalid_format: '视频消息发送失败，无效的视频格式，视频格式支持：mp4、quicktime、mov。',
    message_video_size_exceeded: '视频大小超出了限制，如果上传视频，最大限制是 100MB。',
    message_file_not_exist: '文件不存在，请检查文件路径是否正确。',
    message_file_size_exceeded: '文件大小超出了限制，如果上传文件，最大限制是 100MB。',
    message_file_sending_banned: '文件消息失败，禁止发送违规封禁的文件。',
    message_text_sensitive_content: '消息或者资料中文本存在敏感内容，发送失败。',
    message_length_exceeded: '消息长度超出限制，消息长度不要超过 12K。',
    message_local_audit_blocked: '文本包含本地审核拦截词。',
    message_recall_time_exceeded: '超过撤回时间限制。消息撤回超过了时间限制（默认2分钟）。',

    // Reaction
    reaction_emoji_limit_reached: '已达到表情回应上限数量。',

    // Profile
    profile_remark_length_exceeded: '修改备注失败：备注长度不得超过 96 字节。',

    // Group
    group_announcement_length_exceeded: '群公告字数超出限制，最大长度为 150。',
    group_name_invalid: '群名称仅限中文、字母、数字和下划线，2-20个字。',
    group_id_already_used: '群组 ID 已被使用。请选择其他的群组 ID。',
  },
};
