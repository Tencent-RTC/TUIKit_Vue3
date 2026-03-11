
import type {
  TUISeatRegion } from '@tencentcloud/tuiroom-engine-electron';
import type { Rect, TRTCUserStream, TRTCVideoFillMode } from 'trtc-electron-sdk';

export type TUIVideoResolutionType = Record<string | number, {
  width: number;
  height: number;
}>;

export type TUIUserOnSeatInfo = TRTCUserStream & TUISeatRegion & {
  rect: Rect;
  zOrder: number;
  fillMode: TRTCVideoFillMode;
};

export enum TUISeatLayoutTemplate {
  None = 0,
  LandscapeDynamic_1v3 = 200,
  PortraitDynamic_Grid9 = 600,
  PortraitDynamic_1v6 = 601,
  PortraitFixed_Grid9 = 800,
  PortraitFixed_1v6 = 801,
  PortraitFixed_6v6 = 802,
}

export enum TUICoHostLayoutTemplate {
  HostDynamicGrid = 600,
  HostDynamic1v6 = 601,
}
