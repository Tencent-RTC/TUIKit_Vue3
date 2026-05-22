import type { ComputedRef, Ref } from 'vue';
import { TRTCVideoColorSpace, TRTCVideoColorRange } from 'trtc-electron-sdk';
import { TRTCMediaSource, TUIVideoQuality } from '@tencentcloud/tuiroom-engine-electron';


export type MediaSource = TRTCMediaSource & {
  name: string;
  width?: number;
  height?: number;
  camera?: {
    colorSpace?: TRTCVideoColorSpace;
    colorRange?: TRTCVideoColorRange;
  };
  localVideo?: {
    playoutVolume: number;
  };
  onlineVideo?: {
    networkCacheSizeKB: number;
    playoutVolume: number;
  };
};

export interface IVideoMixerState {
  isVideoMixerEnabled: Ref<boolean>;
  publishVideoQuality: Ref<TUIVideoQuality>;
  mediaSourceList: Ref<MediaSource[]>;
  activeMediaSource: ComputedRef<MediaSource | null>;
  enableLocalVideoMixer: () => Promise<void>;
  addMediaSource: (source: MediaSource) => Promise<void>;
  updateMediaSource: (source: MediaSource, config: Partial<MediaSource>) => Promise<void>;
  removeMediaSource: (source: MediaSource) => Promise<void>;
  clearMediaSource: () => Promise<void>;
}

/**
 * File object in Electron renderer process exposes a `path` property
 * pointing to the real OS file path, which is not part of the standard
 * Web File API. Used when selecting local files via `<input type="file">`.
 */
export interface ElectronFile extends File {
  path: string;
}
