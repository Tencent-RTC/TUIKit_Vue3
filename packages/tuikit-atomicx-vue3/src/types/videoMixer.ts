import { TRTCMediaSource, TRTCVideoResolution } from '@tencentcloud/tuiroom-engine-js';

export type MediaSource = TRTCMediaSource & {
  name: string;
  camera?: {
    cameraId: string;
    resolution: TRTCVideoResolution | { width: number; height: number };
    fps: number;
    videoTrack?: MediaStreamTrack;
  };
  text?: {
    content: string;
    fontSize?: number;
    fontColor?: string;
    fontFamily?: string;
    fontWeight?: number;
  };
};
