import type { FillMode } from '../../../types';

export enum VideoStreamQuality {
  HD = 'HD',
  LD = 'LD',
}

export interface StreamInfo {
  views: Map<HTMLDivElement, { isVisible: boolean }>;
  isPlaying: boolean;
  videoQuality?: VideoStreamQuality;
  fillMode?: FillMode;
}
