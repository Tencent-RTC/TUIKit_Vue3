import type { FillMode } from '../../../types';

export enum VideoStreamQuality {
  HD = 'HD',
  LD = 'LD',
}

export interface StreamInfo {
  views: (string | HTMLDivElement)[];
  isPlaying: boolean;
  videoQuality?: VideoStreamQuality;
  fillMode?: FillMode;
}
