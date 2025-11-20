import { FillMode } from '../../../types';
import { VideoStreamQuality } from './types';
import type { StreamInfo } from './types';
import type { VideoStreamType } from '../../../types';

/**
 * 流信息管理器 - 负责视图绑定和流信息管理
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
    view: string | HTMLDivElement;
    initialQuality?: VideoStreamQuality;
    fillMode?: FillMode;
  }): StreamInfo {
    const { userId, streamType, view, initialQuality, fillMode } = options;
    const streamKey = this.getStreamKey(userId, streamType);

    const streamInfo = this.streamInfoMap.get(streamKey) || {
      views: [],
      isPlaying: false,
      videoQuality: initialQuality || VideoStreamQuality.HD,
      fillMode: fillMode || FillMode.Fit,
    };

    if (!streamInfo.views.includes(view)) {
      streamInfo.views.push(view);
    }
    this.streamInfoMap.set(streamKey, streamInfo);
    console.log(`[StreamPlay][StreamInfoManager] 视图添加: ${streamKey}, 视图数量: ${streamInfo.views.length}`);
    return streamInfo;
  }

  public removeView(options: {
    userId: string;
    streamType: VideoStreamType;
    view: string | HTMLDivElement;
  }): StreamInfo | null {
    const { userId, streamType, view } = options;
    const streamKey = this.getStreamKey(userId, streamType);
    const streamInfo = this.streamInfoMap.get(streamKey);

    if (!streamInfo) {
      return null;
    }

    streamInfo.views = streamInfo.views.filter(v => v !== view);

    if (streamInfo.views.length === 0) {
      this.streamInfoMap.delete(streamKey);
      console.log(`[StreamPlay][StreamInfoManager] remove stream info: ${streamKey}`);
      return null;
    }
    this.streamInfoMap.set(streamKey, streamInfo);
    console.log(`[StreamPlay][StreamInfoManager] ${streamKey} remove view: ${view}, remaining view count: ${streamInfo.views.length}`);
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
          viewCount: streamInfo.views.length,
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

  public getViewIdList(views: (string | HTMLDivElement)[]): string[] {
    return views.map((view) => {
      if (view instanceof HTMLDivElement) {
        return view.id || '';
      }
      return view;
    }).filter(id => id !== '');
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
