export interface LoginUserInfo {
  userId: string;
  userName: string;
  avatarUrl: string;
  customInfo?: Record<string, any>;
}

export interface SetSelfInfoParams {
  userName?: string;
  avatarUrl?: string;
  customInfo?: Record<string, any>;
}

export interface LoginParams {
  userId: string;
  userSig: string;
  sdkAppId: number;
  [key: string]: any;
}

export interface LoginOptions {
  userId: string;
  userSig: string;
  sdkAppId: number;
  [key: string]: any;
}

export enum LoginEvent {
  onLoginExpired = 'onLoginExpired',
  onKickedOffline = 'onKickedOffline',
}

export enum LoginStatus {
  UNKNOWN = 0,
  LOGINED = 1,
}

/**
 * Event callback function type
 * @template T - The type of data passed to the callback
 */
export type EventCallback<T = any> = (data?: T) => void;
