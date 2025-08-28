const ChatSetting = {
  // SettingItem
  cancel: 'Cancel',
  confirm: 'Confirm',
  not_set: 'Not Set',

  // C2CChatSetting
  user_id: 'User ID',
  nickname: 'Nickname',
  nickname_placeholder: 'No nickname set',
  signature: 'Signature',
  remark: 'Remark',
  remark_placeholder: 'No remark set',
  remark_update_success: 'Remark updated successfully',
  pin_conversation: 'Pin Conversation',
  mute_conversation: 'Mute Conversation',
  copied: 'Copied',

  // GroupChatSetting
  remove_member_dialog_title: 'Remove Group Member',
  add_member_dialog_title: 'Add Group Member',
  failed_to_load_more_members: 'Failed to load more members',
  failed_to_remove_member: 'Failed to remove member',
  me: 'Me',

  // GroupInfo
  group_id: 'Group ID',
  group_name: 'Group Name',
  group_name_placeholder: 'No group name set',
  group_introduction: 'Group Introduction',
  group_introduction_placeholder: 'No group introduction',
  group_notification: 'Group Notification',
  group_notification_placeholder: 'No group notification',
  my_name_card: 'My Name Card',
  my_name_card_placeholder: 'No name card set',
  group_type: 'Group Type',
  group_type_work: 'Work Group',
  group_type_public: 'Public Group',
  group_type_meeting: 'Meeting Group',
  group_type_community: 'Community',
  group_type_avchatroom: 'Live Group',
  group_type_unknown: 'Unknown Type',

  // Validation messages
  group_name_required_string: 'Group name must be a string',
  group_name_required: 'Group name cannot be empty',
  group_name_max_length: 'Group name cannot exceed 30 characters',
  group_name_unchanged: 'Please modify the group name before submitting',
  group_introduction_required_string: 'Group introduction must be a string',
  group_introduction_max_length: 'Group introduction cannot exceed 130 characters',
  group_introduction_unchanged: 'Please modify the group introduction before submitting',
  group_notification_required_string: 'Group notification must be a string',
  group_notification_max_length: 'Group notification cannot exceed 130 characters',
  group_notification_unchanged: 'Please modify the group notification before submitting',
  group_name_card_required_string: 'Name card must be a string',
  group_name_card_unchanged: 'Please modify the name card before submitting',

  // Success/Error messages
  group_name_update_success: 'Group name updated successfully',
  group_name_update_failed: 'Failed to update group name',
  group_introduction_update_success: 'Group introduction updated successfully',
  group_introduction_update_failed: 'Failed to update group introduction',
  group_notification_update_success: 'Group notification updated successfully',
  group_notification_update_failed: 'Failed to update group notification',
  group_name_card_update_success: 'Name card updated successfully',
  group_name_card_update_failed: 'Failed to update name card',
  group_member_add_success: 'Member added successfully',
  group_member_add_failed: 'Failed to add member',
  group_member_add_partially_failed: 'Partially member added failed',
  group_member_remove_success: 'Member removed successfully',
  group_member_remove_failed: 'Failed to remove member',

  // GroupMembers
  group_members: 'Group Members',
  add: 'Add',
  remove: 'Remove',
  loading: 'Loading...',
  all_members_shown: 'All members shown',
  collapse: 'Collapse',

  // GroupActions
  transfer_group_owner: 'Transfer Group Owner',
  quit_group: 'Quit Group',
  dismiss_group: 'Dismiss Group',
  confirm_quit_group: 'Are you sure you want to quit the group?',
  select_new_owner_error: 'Please select a new owner',
  only_one_owner_error: 'Only one member can be selected as the new owner',
  transfer_owner_success: 'Ownership transferred successfully',
  transfer_owner_failed: 'Failed to transfer ownership',
  quit_group_success: 'Successfully left the group',
  quit_group_failed: 'Failed to leave the group',

  // GroupManagement
  group_management: 'Group Management',
  set_admin: 'Set Admin',
  unset_admin: 'Remove Admin',
  mute_members: 'Mute Members',
  unmute_members: 'Unmute Members',
  operation_success: 'Operation completed successfully',
  operation_failed: 'Operation failed',
  all_members_muted: 'All members muted',
  all_members_unmuted: 'All members unmuted',
  mute_all_failed: 'Failed to update mute all setting',
  group_admin: 'Group Admin',
  mute_management: 'Mute Management',
  mute_all_members: 'Mute All Members',
  mute_all_members_description: 'When enabled, only the group owner and admins can speak',

  // GroupMemberRole
  group_member_role_owner: 'Group Owner',
  group_member_role_admin: 'Admin',
  group_member_role_member: 'Member',
};

export default ChatSetting;
