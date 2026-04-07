import { resource as roomParticipantResource } from '../../../RoomParticipantList/i18n/zh-CN/index';

export const resource = {
  ParticipantList: {
    ...roomParticipantResource.ParticipantList,
    StageFull: '舞台已满',
    AcceptedInviteToStage: '接受了上台邀请',
    DeclinedInviteToStage: '拒绝了上台邀请',
    InviteStageTimeout: '邀请{{name}}上台已超时',
    DuplicateStageInvite: '该成员已收到相同请求，请稍后重试',
    CancelStage: '取消邀请上台',
    InviteStage: '邀请上台',
    AgreeToStage: '同意上台',
    RefuseStage: '拒绝上台',
    StepDown: '下台',
  },
  'Call all': '呼叫全部',
};
