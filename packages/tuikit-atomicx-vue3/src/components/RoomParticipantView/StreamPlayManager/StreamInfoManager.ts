import { FillMode } from '../../../types';
import { VideoStreamQuality } from './types';
import type { StreamInfo } from './types';
import type { VideoStreamType } from '../../../types';

/**
 * 流信息管理器 - 负责视图绑定和流信息管理
 * TODO: StreamInfoManager 里面信息的增加和删除应该只和 onUserVideoStateChanged 的回调同步
 * 职责：
 * 1. 管理流信息的存储和查询
 * 2. 处理视图的绑定和解绑
 * 3. 提供流状态查询接口
 * 4. 管理视图ID转换
 */
export class StreamInfoManager {
  // 存储流信息的映射表，key: userId_streamType, value: 流信息
  private streamInfoMap: Map<string, StreamInfo> = new Map();

  public addView(options: {
    userId: string;
    streamType: VideoStreamType;
    view: HTMLDivElement;
    initVisible?: boolean;
  }): StreamInfo {
    const { userId, streamType, view, initVisible } = options;
    const streamKey = this.getStreamKey(userId, streamType);

    const streamInfo = this.streamInfoMap.get(streamKey) || {
      views: new Map(),
      isPlaying: false,
      videoQuality: VideoStreamQuality.LD,
      fillMode: FillMode.Fit,
    };

    if (!streamInfo.views.has(view)) {
      streamInfo.views.set(view, { isVisible: initVisible || false });
    }
    this.streamInfoMap.set(streamKey, streamInfo);
    console.log(`[StreamPlay][StreamInfoManager] 视图添加: ${streamKey}, 视图数量: ${streamInfo.views.size}`);
    return streamInfo;
  }

  public removeView(options: {
    userId: string;
    streamType: VideoStreamType;
    view: HTMLDivElement;
  }): StreamInfo | null {
    const { userId, streamType, view } = options;
    const streamKey = this.getStreamKey(userId, streamType);
    const streamInfo = this.streamInfoMap.get(streamKey);

    if (!streamInfo) {
      return null;
    }

    streamInfo.views.delete(view);
    if (streamInfo.views.size === 0) {
      this.streamInfoMap.delete(streamKey);
      console.log(`[StreamPlay][StreamInfoManager] remove stream info: ${streamKey}`);
      return null;
    }
    this.streamInfoMap.set(streamKey, streamInfo);
    console.log(`[StreamPlay][StreamInfoManager] ${streamKey} remove view: ${view}, remaining view count: ${streamInfo.views.length}`);
    return streamInfo;
  }

  public setViewVisible(options: {
    userId: string;
    streamType: VideoStreamType;
    view: HTMLDivElement;
    isVisible: boolean;
  }): StreamInfo | null {
    const { userId, streamType, view, isVisible } = options;
    const streamInfo = this.getStreamInfo(userId, streamType);
    if (!streamInfo) {
      return null;
    }
    const oldStreamViewInfo = streamInfo.views.get(view);
    if (oldStreamViewInfo) {
      oldStreamViewInfo.isVisible = isVisible;
    } else {
      streamInfo.views.set(view, { isVisible });
    }
    this.streamInfoMap.set(this.getStreamKey(userId, streamType), streamInfo);
    return streamInfo;
  }

  public updateStreamInfo(options: {
    userId: string;
    streamType: VideoStreamType;
    updates: Partial<StreamInfo>;
  }): StreamInfo | null {
    const { userId, streamType, updates } = options;
    const streamKey = this.getStreamKey(userId, streamType);
    const streamInfo = this.streamInfoMap.get(streamKey);

    if (!streamInfo) {
      return null;
    }

    Object.assign(streamInfo, updates);
    this.streamInfoMap.set(streamKey, streamInfo);

    return streamInfo;
  }

  public getStreamInfo(userId: string, streamType: VideoStreamType): StreamInfo | null {
    const streamKey = this.getStreamKey(userId, streamType);
    return this.streamInfoMap.get(streamKey) || null;
  }

  public isStreamPlaying(userId: string, streamType: VideoStreamType): boolean {
    const streamInfo = this.getStreamInfo(userId, streamType);
    return streamInfo?.isPlaying || false;
  }

  public getPlayingStreams(): Array<{
    userId: string;
    streamType: VideoStreamType;
    viewCount: number;
    videoQuality?: VideoStreamQuality;
  }> {
    const playingStreams: Array<{
      userId: string;
      streamType: VideoStreamType;
      viewCount: number;
      videoQuality?: VideoStreamQuality;
    }> = [];

    Array.from(this.streamInfoMap.entries()).forEach(([streamKey, streamInfo]) => {
      if (streamInfo.isPlaying) {
        const [userId, streamType] = this.parseStreamKey(streamKey);
        playingStreams.push({
          userId,
          streamType: streamType as VideoStreamType,
          viewCount: streamInfo.views.size,
          videoQuality: streamInfo.videoQuality,
        });
      }
    });

    return playingStreams;
  }

  public getAllStreams(): Array<{
    userId: string;
    streamType: VideoStreamType;
    streamInfo: StreamInfo;
  }> {
    const allStreams: Array<{
      userId: string;
      streamType: VideoStreamType;
      streamInfo: StreamInfo;
    }> = [];

    for (const [streamKey, streamInfo] of this.streamInfoMap) {
      const [userId, streamType] = this.parseStreamKey(streamKey);
      allStreams.push({
        userId,
        streamType: streamType as VideoStreamType,
        streamInfo,
      });
    }

    return allStreams;
  }

  public getVisibleViewIdList(userId: string, streamType: VideoStreamType): string[] {
    const streamInfo = this.getStreamInfo(userId, streamType);
    if (!streamInfo) {
      return [];
    }
    return Array.from(streamInfo.views.entries()).filter(([_, viewInfo]) => viewInfo.isVisible).map(([view]) => view.id || '');
  }

  public getAllViewIdList(userId: string, streamType: VideoStreamType): string[] {
    const streamInfo = this.getStreamInfo(userId, streamType);
    if (!streamInfo) {
      return [];
    }
    return Array.from(streamInfo.views.keys()).map(view => view.id || '');
  }

  public isViewExists(view: string | HTMLDivElement): boolean {
    if (typeof view === 'string') {
      return !!document.getElementById(view);
    }
    return !!view && document.contains(view);
  }

  public getValidViews(views: (string | HTMLDivElement)[]): (string | HTMLDivElement)[] {
    return views.filter(view => this.isViewExists(view));
  }

  public clear(): void {
    this.streamInfoMap.clear();
  }

  private getStreamKey(userId: string, streamType: VideoStreamType): string {
    return `${userId}_${streamType}`;
  }

  private parseStreamKey(streamKey: string): [string, string] {
    const parts = streamKey.split('_');
    return [parts.slice(0, parts.length - 1).join('_'), parts.slice(-1)[0]];
  }
}

export default StreamInfoManager;
