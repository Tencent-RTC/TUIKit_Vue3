import { resource as roomParticipantResource } from '../../../RoomParticipantList/i18n/en-US/index';

export const resource = {
  ParticipantList: {
    ...roomParticipantResource.ParticipantList,
    StageFull: 'The stage is full',
    AcceptedInviteToStage: 'accepted the invitation to the stage',
    DeclinedInviteToStage: 'declined the invitation to the stage',
    InviteStageTimeout: 'The invitation to {{name}} to go on stage has timed out',
    DuplicateStageInvite: 'This member has already received the same request, please try again later',
    CancelStage: 'Cancel stage',
    InviteStage: 'Invite stage',
    AgreeToStage: 'Agree to the stage',
    RefuseStage: 'Refuse stage',
    StepDown: 'Step down',
  },
  'Call all': 'Call all',
};
