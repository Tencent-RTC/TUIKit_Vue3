export type CoGuestRequestInfo = {
  timestamp: number;
  requestId: string;
  userId: string;
  userName: string;
  nameCard: string;
  avatarUrl: string;
};

export enum CoGuestStatus {
  Connected = 'Connected',
  Disconnected = 'Disconnected', //  不在连线中
  AdminInviting = 'AdminInviting', // 主持人/管理员邀请连线中
  UserApplying = 'UserApplying', // 普通成员申请连线中
}
