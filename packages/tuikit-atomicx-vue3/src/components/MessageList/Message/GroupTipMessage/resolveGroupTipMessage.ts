import { i18next } from '@tencentcloud/uikit-base-component-vue3';
import type { TipsMessageInfo } from '@atomicxcore/core';
import type { GroupTipsInfo } from '@atomicxcore/core';
import { GroupJoinOption, GroupInviteOption } from '@atomicxcore/core';

function memberName(member: { nickname?: string; userID: string }): string {
  const name = member.nickname || member.userID;
  return name.length > 12 ? `${name.slice(0, 12)}...` : name;
}

function memberNames(members: Array<{ nickname?: string; userID: string }>): string {
  return members.map(memberName).join(', ');
}

function describeTip(tip: GroupTipsInfo): string {
  const { t } = i18next;

  switch (tip.type) {
    case 'joinGroup':
      return `${memberName(tip.joinMember)} ${t('MessageList.joined_group')}`;

    case 'inviteToGroup':
      return `${memberName(tip.inviter)} ${t('MessageList.invited')} ${memberNames(tip.invitees)} ${t('MessageList.joined_group')}`;

    case 'quitGroup':
      return `${t('MessageList.group_member')}: ${memberName(tip.quitMember)} ${t('MessageList.left_group')}`;

    case 'kickedFromGroup':
      return `${t('MessageList.group_member')}: ${memberNames(tip.kickedMembers)} ${t('MessageList.was')} ${t('MessageList.kicked_out_of_group')}`;

    case 'setGroupAdmin':
      return `${t('MessageList.group_member')}: ${memberNames(tip.setAdminMembers)} ${t('MessageList.became_admin')}`;

    case 'cancelGroupAdmin':
      return `${t('MessageList.group_member')}: ${memberNames(tip.cancelAdminMembers)} ${t('MessageList.admin_privileges_revoked')}`;

    case 'changeGroupName':
      return `${memberName(tip.opUser)} ${t('MessageList.changed_group_name_to')} ${tip.groupName}`;

    case 'changeGroupAvatar':
      return `${memberName(tip.opUser)} ${t('MessageList.changed_group_avatar')}`;

    case 'changeGroupNotification':
      return `${memberName(tip.opUser)} ${t('MessageList.published_new_announcement')}`;

    case 'changeGroupIntroduction':
      return `${memberName(tip.opUser)} ${t('MessageList.changed_group_introduction')}`;

    case 'changeGroupOwner':
      return `${tip.groupOwner} ${t('MessageList.became_new_group_owner')}`;

    case 'changeGroupMuteAll':
      return tip.isMuteAll
        ? `${memberName(tip.opUser)} ${t('MessageList.enabled_mute_all_members')}`
        : `${memberName(tip.opUser)} ${t('MessageList.disabled_mute_all_members')}`;

    case 'changeGroupJoinOption': {
      const joinOptionKey = {
        [GroupJoinOption.Any]: 'join_option_any',
        [GroupJoinOption.Auth]: 'join_option_auth',
        [GroupJoinOption.Forbid]: 'join_option_forbid',
      }[tip.joinOption];
      return `${memberName(tip.opUser)} ${t('MessageList.changed_group_join_option')} "${t(`MessageList.${joinOptionKey}`)}"`;
    }

    case 'changeGroupInviteOption': {
      const inviteOptionKey = {
        [GroupInviteOption.Any]: 'invite_option_any',
        [GroupInviteOption.Auth]: 'invite_option_auth',
        [GroupInviteOption.Forbid]: 'invite_option_forbid',
      }[tip.inviteOption];
      return `${memberName(tip.opUser)} ${t('MessageList.changed_group_invite_option')} "${t(`MessageList.${inviteOptionKey}`)}"`;
    }

    case 'muteGroupMember':
      return tip.muteTime > 0
        ? `${memberNames(tip.mutedGroupMembers)} ${t('MessageList.was_muted')}`
        : `${memberNames(tip.mutedGroupMembers)} ${t('MessageList.was_unmuted')}`;

    case 'pinGroupMessage':
      return `${memberName(tip.opUser)} ${t('MessageList.pinned_a_message')}`;

    case 'unpinGroupMessage':
      return `${memberName(tip.opUser)} ${t('MessageList.unpinned_a_message')}`;

    case 'unknown':
      return `[${t('MessageList.group_tip_message')}]`;
  }
}

function resolveGroupTipMessage(message: TipsMessageInfo): { text: string } {
  const tips = message.messagePayload?.groupTips ?? [];
  const text = tips.map(describeTip).filter(Boolean).join('、') || `[${i18next.t('MessageList.group_tip_message')}]`;
  return { text };
}

export { resolveGroupTipMessage };
