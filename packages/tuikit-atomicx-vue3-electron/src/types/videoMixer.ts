import { TRTCVideoColorSpace, TRTCVideoColorRange } from 'trtc-electron-sdk';
import { TRTCMediaSource, TRTCVideoResolution } from '@tencentcloud/tuiroom-engine-electron';

export type MediaSource = TRTCMediaSource & {
  name: string;
  text?: {
    content: string;
    fontSize?: number;
    fontColor?: string;
    fontFamily?: string;
    fontWeight?: number;
  };
  camera?: {
    cameraId: string;
    resolution: TRTCVideoResolution;
  };
  width?: number;
  height?: number;
  colorSpace?: TRTCVideoColorSpace;
  colorRange?: TRTCVideoColorRange;
};
