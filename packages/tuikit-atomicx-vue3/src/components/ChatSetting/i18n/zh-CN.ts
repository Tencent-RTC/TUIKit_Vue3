const ChatSetting = {
  // SettingItem
  cancel: '取消',
  confirm: '确认',
  not_set: '未设置',

  // C2CChatSetting
  user_id: '用户ID',
  nickname: '昵称',
  nickname_placeholder: '未设置昵称',
  signature: '个性签名',
  remark: '备注',
  remark_placeholder: '未设置备注',
  remark_update_success: '备注修改成功',
  remark_update_failed: '备注修改失败',
  you_are_not_friend: '对方和您未成为好友',
  pin_conversation: '会话置顶',
  mute_conversation: '会话免打扰',
  copied: '已复制',

  // GroupChatSetting
  remove_member_dialog_title: '移除群成员',
  add_member_dialog_title: '添加群成员',
  failed_to_load_more_members: '加载更多成员失败',
  failed_to_remove_member: '移除成员失败',
  me: '我',

  // GroupInfo
  group_id: '群ID',
  group_name: '群名称',
  group_name_placeholder: '未设置群名称',
  group_introduction: '群简介',
  group_introduction_placeholder: '暂无群简介',
  group_notification: '群公告',
  group_notification_placeholder: '暂无群公告',
  my_name_card: '我的群名片',
  my_name_card_placeholder: '未设置我的群名片',
  group_type: '群类型',
  group_type_work: '好友工作群',
  group_type_public: '陌生人社交群',
  group_type_meeting: '临时会议群',
  group_type_community: '社群',
  group_type_avchatroom: '直播群',
  group_type_unknown: '未知类型',

  // Validation messages
  group_name_required_string: '群名称必须是字符串',
  group_name_required: '群名称不能为空',
  group_name_max_length: '群名称不能超过30个字符',
  group_name_unchanged: '请修改群名称后再提交',
  group_introduction_required_string: '群简介必须是字符串',
  group_introduction_max_length: '群简介不能超过130个字符',
  group_introduction_unchanged: '请修改群简介后再提交',
  group_notification_required_string: '群公告必须是字符串',
  group_notification_max_length: '群公告不能超过130个字符',
  group_notification_unchanged: '请修改群公告后再提交',
  group_name_card_required_string: '群名片必须是字符串',
  group_name_card_unchanged: '请修改群名片后再提交',

  // Success/Error messages
  group_name_update_success: '群名称修改成功',
  group_name_update_failed: '群名称修改失败',
  group_introduction_update_success: '群简介修改成功',
  group_introduction_update_failed: '群简介修改失败',
  group_notification_update_success: '群公告修改成功',
  group_notification_update_failed: '群公告修改失败',
  group_name_card_update_success: '群名片修改成功',
  group_name_card_update_failed: '群名片修改失败',
  group_member_add_success: '群成员添加成功',
  group_member_add_failed: '群成员添加失败',
  group_member_add_partially_failed: '部分群成员添加失败',
  group_member_remove_success: '群成员移除成功',
  group_member_remove_failed: '群成员移除失败',

  // GroupMembers
  group_members: '群成员',
  add: '添加',
  remove: '移除',
  loading: '加载中...',
  all_members_shown: '已显示全部成员',
  collapse: '收起',

  // GroupActions
  transfer_group_owner: '转让群主',
  quit_group: '退出群聊',
  dismiss_group: '解散群聊',
  confirm_quit_group: '确定要退出群聊吗？',
  select_new_owner_error: '请选择新的群主',
  only_one_owner_error: '只能选择一个成员作为新群主',
  transfer_owner_success: '群主转让成功',
  transfer_owner_failed: '群主转让失败',
  quit_group_success: '已退出群聊',
  quit_group_failed: '退出群聊失败',

  // GroupManagement
  group_management: '群管理',
  set_admin: '设置管理员',
  unset_admin: '取消管理员',
  mute_members: '禁言成员',
  unmute_members: '取消禁言',
  operation_success: '操作成功',
  operation_failed: '操作失败',
  all_members_muted: '已开启全员禁言',
  all_members_unmuted: '已关闭全员禁言',
  mute_all_failed: '设置全员禁言失败',
  group_admin: '群管理员',
  mute_management: '禁言管理',
  mute_all_members: '全员禁言',
  mute_all_members_description: '开启后，除群主和管理员外，其他成员将无法发言',

  // GroupMemberRole
  group_member_role_owner: '群主',
  group_member_role_admin: '管理员',
  group_member_role_member: '群成员',
};

export default ChatSetting;
