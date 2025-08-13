export type BasicUserInfo = {
  sdkAppId: number,
  userId: string,
  userSig: string,
  userName: string,
  avatarUrl: string,
}

export enum ErrorCode {
  LOGIN_TIMEOUT = -70001,
}