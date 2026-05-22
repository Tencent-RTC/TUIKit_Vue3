export type MonitorLiveInfo = {
  liveId: string;
  liveName: string;
  liveDescription: string;
  regionList: Array<MonitorRegionInfo>;
  categoryList?: Array<number>;
  coverUrl: string;
  backgroundUrl: string;
  liveOwner: string;                            // readonly
  currentViewerCount: number;                   // readonly
  createTime: number;                           // readonly
  totalViewerCount: number;                     // readonly
  orientation: 'landscape' | 'portrait' | '';   // readonly
  customInfo?: Record<string, any>;
};

export type MonitorRegionInfo = {
  liveId: string;
  userInfo: MonitorUserInfo;
  rect: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
};

export type MonitorUserInfo = {
  userId: string;
  userName?: string;
  avatarUrl?: string;
  microphoneStatus?: MonitorDeviceStatus;
  cameraStatus?: MonitorDeviceStatus;
};

export enum MonitorDeviceStatus {
  On = 'On',
  Off = 'Off',
}

export type MonitorMessage = {
  type: 'warning' | 'notice';
  content: string;
};

export type InitConfig = {
  baseUrl: string;
  account: {
    sdkAppId: number;
    userId: string;
    password: string;
  };
};

import type { ComputedRef } from 'vue';

export interface ILiveMonitorState {
  monitorLiveInfoList: ComputedRef<MonitorLiveInfo[]>;
  init: (config: InitConfig) => void;
  getLiveList: (page: number, pageSize: number) => Promise<MonitorLiveInfo[]>;
  closeRoom: (liveId: string) => Promise<void>;
  startPlay: (liveId: string, viewId: string) => Promise<void>;
  stopPlay: (liveId: string) => Promise<void>;
  muteLiveAudio: (liveId: string, mute: boolean) => Promise<void>;
}
