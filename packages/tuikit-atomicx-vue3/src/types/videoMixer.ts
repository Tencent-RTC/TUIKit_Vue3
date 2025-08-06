import { TRTCMediaSource } from '@tencentcloud/tuiroom-engine-js';

export type MediaSource = TRTCMediaSource & {
  name: string;
  text?: {
    content: string;
    fontSize?: number;
    fontColor?: string;
    fontFamily?: string;
    fontWeight?: number;
  };
};
