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

import type { Ref } from 'vue';

export interface ILoginState {
  loginUserInfo: Ref<LoginUserInfo | null>;
  login: (options: LoginParams) => Promise<void>;
  logout: () => Promise<void>;
  setSelfInfo: (options: SetSelfInfoParams) => Promise<void>;
}
