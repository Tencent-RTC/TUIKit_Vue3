import { TUIChatEngine } from '@tencentcloud/chat-uikit-engine';
import { i18next } from '@tencentcloud/uikit-base-component-vue3';
import type { IMessageModel as MessageModel } from '@tencentcloud/chat-uikit-engine';

function substringByLength(str: string, len = 12) {
  return str.length > len ? `${str.slice(0, len)}...` : str;
}

function handleGroupProfileUpdated(message: MessageModel) {
  const { t } = i18next;
  const { nick, payload } = message;
  const { newGroupProfile, memberList, operatorID } = payload;
  let text = '';

  const showName: string = nick || operatorID;
  const key: string = Object.keys(newGroupProfile)[0];
  switch (key) {
    case 'muteAllMembers':
      if (newGroupProfile[key]) {
        text = `${t('MessageList.administrator')} ${showName} ${t('MessageList.enabled_mute_all_members')}`;
      } else {
        text = `${t('MessageList.administrator')} ${showName} ${t('MessageList.disabled_mute_all_members')}`;
      }
      break;
    case 'ownerID':
      text = `${memberList[0].nick || memberList[0].userID} ${t('MessageList.became_new_group_owner')}`;
      break;
    case 'groupName':
      text = `${showName} ${t('MessageList.changed_group_name_to')} ${newGroupProfile[key]}`;
      break;
    case 'notification':
      text = `${showName} ${t('MessageList.published_new_announcement')}`;
      break;
    default:
      break;
  }
  return text;
}

function resolveGroupTipMessage(message: MessageModel) {
  const ret: {
    text: string;
  } = {
    text: '',
  };

  const { t } = i18next;

  let showName: string = message?.nick || message?.payload?.userIDList?.join(',');
  if (message?.payload?.memberList?.length > 0) {
    showName = '';
    message?.payload?.memberList?.map((user: any) => {
      const _showName = user?.nick || user?.userID;
      showName += `${substringByLength(_showName)},`;
      return user;
    });
    showName = showName?.slice(0, -1);
  }

  switch (message.payload.operationType) {
    case TUIChatEngine.TYPES.GRP_TIP_MBR_JOIN:
      ret.text = `${showName} ${t('MessageList.joined_group')}`;
      break;
    case TUIChatEngine.TYPES.GRP_TIP_MBR_QUIT:
      ret.text = `${t('MessageList.group_member')}: ${showName} ${t('MessageList.left_group')}`;
      break;
    case TUIChatEngine.TYPES.GRP_TIP_MBR_KICKED_OUT:
      ret.text = `${t('MessageList.group_member')}: ${showName} ${t('MessageList.was')} ${t('MessageList.kicked_out_of_group')}`;
      break;
    case TUIChatEngine.TYPES.GRP_TIP_MBR_SET_ADMIN:
      ret.text = `${t('MessageList.group_member')}: ${showName} ${t('MessageList.became_admin')}`;
      break;
    case TUIChatEngine.TYPES.GRP_TIP_MBR_CANCELED_ADMIN:
      ret.text = `${t('MessageList.group_member')}: ${showName} ${t('MessageList.admin_privileges_revoked')}`;
      break;
    case TUIChatEngine.TYPES.GRP_TIP_GRP_PROFILE_UPDATED:
      ret.text = handleGroupProfileUpdated(message);
      break;
    case TUIChatEngine.TYPES.GRP_TIP_MBR_PROFILE_UPDATED:
      message.payload.memberList.forEach((member: any) => {
        if (member.muteTime > 0) {
          ret.text = `${t('MessageList.group_member')}: ${showName} ${t('MessageList.was_muted')}`;
        } else {
          ret.text = `${t('MessageList.group_member')}: ${showName} ${t('MessageList.was_unmuted')}`;
        }
      });
      break;
    default:
      ret.text = `[${t('MessageList.group_tip_message')}]`;
      break;
  }
  return ret;
}

export {
  resolveGroupTipMessage,
};
