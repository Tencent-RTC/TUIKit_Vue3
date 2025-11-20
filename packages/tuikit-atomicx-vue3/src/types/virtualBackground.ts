export interface VirtualBackgroundConfig {
  enable?: boolean;
  type?: VirtualBackgroundType;
  blurLevel?: number;
  imagePath?: string;
}

export enum VirtualBackgroundType {
  blur = 'blur',
  image = 'image',
}

export enum VirtualBackgroundEvent {
  onAbort = 'onAbort', // 运行过程中发生错误
}

export type VirtualBackgroundEventCallback = () => void;
