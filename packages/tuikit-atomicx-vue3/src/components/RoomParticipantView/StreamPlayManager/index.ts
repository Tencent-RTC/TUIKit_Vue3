import { TUIRoomEvents, TUIVideoStreamType } from '@tencentcloud/tuiroom-engine-js';
import { useRoomEngine } from '../../../hooks/useRoomEngine';
import { VideoStreamType, FillMode } from '../../../types';
import { LazyLoadManager } from './LazyLoadManager';
import { StreamInfoManager } from './StreamInfoManager';
import { StreamPlayer } from './StreamPlayer';
import { VideoQualityManager } from './VideoQualityManager';
import type { StreamInfo, VideoStreamQuality } from './types';

// 1. bindView（更新 views, 更新 质量）
// 2. unbindView（更新 views, 更新 质量）
// 3. 有流来了/流走了（更新 views, 更新 质量）
// 4. resize 变化（更新质量）
// 5. 视区变化（更新质量）

const roomEngine = useRoomEngine();

/**
 * 流播放管理器新版本 - 协调器
 * 职责：
 * 1. 协调各个专业模块的工作
 * 2. 提供统一的流管理接口
 * 3. 处理模块间的通信和事件
 * 4. 管理整个系统的生命周期
 */
export class StreamPlayManager {
  static instance: StreamPlayManager | null = null;

  // 专业模块实例
  private lazyLoadManager!: LazyLoadManager;
  private videoQualityManager!: VideoQualityManager;
  private streamPlayer!: StreamPlayer;
  private streamInfoManager!: StreamInfoManager;

  constructor() {
    if (StreamPlayManager.instance) {
      return StreamPlayManager.instance;
    }
    StreamPlayManager.instance = this;

    // 初始化所有模块
    this.streamInfoManager = new StreamInfoManager();
    this.streamPlayer = new StreamPlayer();
    this.lazyLoadManager = new LazyLoadManager(
      this.handleVisibilityChange.bind(this),
    );
    this.videoQualityManager = new VideoQualityManager(
      this.handleQualityChange.bind(this),
    );
    roomEngine.instance?.on(TUIRoomEvents.onUserVideoStateChanged, this.onUserVideoStateChanged.bind(this));
  }

  private onUserVideoStateChanged(eventInfo: {
    userId: string;
    streamType: TUIVideoStreamType;
    hasVideo: boolean;
    reason: string;
  }) {
    const { userId, streamType, hasVideo } = eventInfo;
    const streamTypeMap = {
      [TUIVideoStreamType.kCameraStreamLow]: VideoStreamType.Camera,
      [TUIVideoStreamType.kCameraStream]: VideoStreamType.Camera,
      [TUIVideoStreamType.kScreenStream]: VideoStreamType.Screen,
    };
    const streamTypeValue = streamTypeMap[streamType];
    if (hasVideo) {
      this.startPlayVideo({ userId, streamType: streamTypeValue });
    } else {
      this.stopPlayVideo({ userId, streamType: streamTypeValue });
    }
  }

  /**
   * 绑定视频流到指定视图
   * @param options 绑定选项
   */
  async bindView(options: {
    userId: string;
    streamType: VideoStreamType;
    view: string | HTMLDivElement;
    lazyLoad?: {
      enable: boolean;
      viewport?: string | HTMLDivElement;
    };
  }): Promise<void> {
    const { userId, streamType, view, lazyLoad } = options;
    const { enable: enableLazyLoad, viewport: lazyLoadViewport } = lazyLoad || { enable: true, viewport: null };

    try {
      // 添加视图到 ViewManager
      this.streamInfoManager.addView({
        userId,
        streamType,
        view,
      });

      if (!enableLazyLoad) {
        await this.startPlayVideo({ userId, streamType });
        return;
      }
      this.lazyLoadManager.initObserver({ root: lazyLoadViewport || null });
      this.lazyLoadManager.observe({ userId, streamType, view });
    } catch (error) {
      console.error('[StreamPlayManager] bindView error:', error);
      throw error;
    }
  }

  /**
   * 解绑视频流的指定视图
   * @param options 解绑选项
   */
  async unbindView(options: {
    userId: string;
    streamType: VideoStreamType;
    view: string | HTMLDivElement;
  }): Promise<void> {
    const { userId, streamType, view } = options;
    const viewElement = typeof view === 'string' ? document.getElementById(view) : view;

    if (!viewElement) {
      throw new Error('[StreamPlayManager] unbindView failed: view not found');
    }

    this.streamInfoManager.removeView({
      userId,
      streamType,
      view,
    });

    try {
      this.lazyLoadManager.unobserve(view);

      // 统一通过 updateVideoView 处理视图移除和质量更新
      await this.updateVideoView({ userId, streamType, removeViews: [view as HTMLDivElement] });
    } catch (error) {
      console.error('[StreamPlayManager] unbindView error:', error);
      throw error;
    }
  }

  /**
   * 处理可见性变化回调
   * @private
   */
  private async handleVisibilityChange(options: {
    userId: string;
    streamType: VideoStreamType;
    isVisible: boolean;
    target: HTMLElement;
  }) {
    const { userId, streamType, isVisible, target } = options;
    const streamInfo = this.streamInfoManager.getStreamInfo(userId, streamType);

    if (!streamInfo) {
      return;
    }

    if (isVisible) {
      // DOM 进入视区，开始播放
      if (!streamInfo.isPlaying) {
        await this.startPlayVideo({ userId, streamType });
      } else {
        await this.updateVideoView({ userId, streamType, addViews: [target as HTMLDivElement] });
      }
    } else {
      // DOM 离开视区，统一通过 updateVideoView 处理
      await this.updateVideoView({ userId, streamType, removeViews: [target as HTMLDivElement] });
    }
  }

  /**
   * 处理质量变化回调
   * @private
   */
  private async handleQualityChange(options: {
    userId: string;
    streamType: VideoStreamType;
    newQuality: VideoStreamQuality;
    oldQuality?: VideoStreamQuality;
    reason: string;
  }) {
    const { userId, streamType, newQuality, reason } = options;
    const streamInfo = this.streamInfoManager.getStreamInfo(userId, streamType);
    if (!streamInfo || streamInfo.videoQuality === newQuality) {
      return;
    }
    console.log(`[StreamPlayManager] 质量变化: ${userId}_${streamType} -> ${newQuality}, 原因: ${reason}`);

    this.streamInfoManager.updateStreamInfo({
      userId,
      streamType,
      updates: { videoQuality: newQuality },
    });
    if (streamInfo.isPlaying) {
      await this.updateVideoQuality({ userId, streamType, newQuality });
    }
  }

  /**
   * 更新视频视图列表
   * @private
   */
  private async updateVideoView(options: {
    userId: string;
    streamType: VideoStreamType;
    addViews?: (string | HTMLDivElement)[];
    removeViews?: (string | HTMLDivElement)[];
  }): Promise<void> {
    const { userId, streamType, addViews, removeViews } = options;
    const streamInfo = this.streamInfoManager.getStreamInfo(userId, streamType);
    if (!streamInfo) {
      return;
    }

    const newViews = [...streamInfo.views];
    if (addViews) {
      addViews.forEach((view) => {
        if (!newViews.includes(view)) {
          newViews.push(view);
        }
      });
    }
    if (removeViews) {
      removeViews.forEach((view) => {
        const index = newViews.indexOf(view);
        if (index !== -1) {
          newViews.splice(index, 1);
        }
      });
    }

    this.streamInfoManager.updateStreamInfo({
      userId,
      streamType,
      updates: { views: newViews },
    });
    if (newViews.length === 0) {
      await this.stopPlayVideo({ userId, streamType });
    } else if (streamInfo.isPlaying) {
      const viewIdList = this.streamInfoManager.getViewIdList(newViews);
      await this.streamPlayer.updateVideoView({
        userId,
        streamType,
        viewIdList,
      });
    }
    await this.checkAndUpdateQuality({ userId, streamType, addViews, removeViews });
  }

  /**
   * 检查并更新视频质量
   * @private
   */
  private async checkAndUpdateQuality(options: {
    userId: string;
    streamType: VideoStreamType;
    addViews?: (string | HTMLDivElement)[];
    removeViews?: (string | HTMLDivElement)[];
  }): Promise<void> {
    const { userId, streamType, addViews, removeViews } = options;
    const streamInfo = this.streamInfoManager.getStreamInfo(userId, streamType);

    if (!streamInfo) {
      return;
    }

    addViews?.forEach((view) => {
      this.videoQualityManager.observe({ userId, streamType, view });
    });
    removeViews?.forEach((view) => {
      this.videoQualityManager.unobserve(view);
    });

    const newQuality = this.videoQualityManager.calculateOptimalQuality({ userId, streamType });
    const oldQuality = streamInfo.videoQuality;

    if (newQuality !== oldQuality) {
      // eslint-disable-next-line no-console
      console.log(`[StreamPlayManager] 因视图变更导致质量变化: ${userId}_${streamType} -> ${newQuality}`);

      this.streamInfoManager.updateStreamInfo({
        userId,
        streamType,
        updates: { videoQuality: newQuality },
      });
      if (streamInfo.isPlaying) {
        await this.updateVideoQuality({ userId, streamType, newQuality });
      }
    }
  }

  /**
   * 开始播放视频流
   * @private
   */
  private async startPlayVideo(options: {
    userId: string;
    streamType: VideoStreamType;
  }): Promise<void> {
    const { userId, streamType } = options;
    const streamInfo = this.streamInfoManager.getStreamInfo(userId, streamType);
    if (!streamInfo) {
      return;
    }

    streamInfo.views.forEach((view) => {
      this.videoQualityManager.observe({ userId, streamType, view });
    });
    const videoQuality = this.videoQualityManager.calculateOptimalQuality({ userId, streamType });

    try {
      const viewIdList = this.streamInfoManager.getViewIdList(streamInfo.views);
      await this.streamPlayer.startPlayVideo({
        userId,
        streamType,
        videoQuality,
        viewIdList,
      });
      this.streamInfoManager.updateStreamInfo({
        userId,
        streamType,
        updates: { videoQuality, isPlaying: true },
      });
    } catch (error) {
      console.error('[StreamPlayManager] startPlayVideo error:', error);
      throw error;
    }
  }

  /**
   * 停止播放视频流
   * @private
   */
  private async stopPlayVideo(options: {
    userId: string;
    streamType: VideoStreamType;
  }): Promise<void> {
    const { userId, streamType } = options;
    const streamInfo = this.streamInfoManager.getStreamInfo(userId, streamType);
    if (!streamInfo || !streamInfo.isPlaying) {
      return;
    }

    streamInfo.views.forEach((view) => {
      this.videoQualityManager.unobserve(view);
    });

    try {
      await this.streamPlayer.stopPlayVideo({
        userId,
        streamType,
        videoQuality: streamInfo.videoQuality,
      });
      this.streamInfoManager.updateStreamInfo({
        userId,
        streamType,
        updates: { isPlaying: false },
      });
    } catch (error) {
      console.error('[StreamPlayManager] stopPlayVideo error:', error);
      throw error;
    }
  }

  /**
   * 更新视频流质量
   * @private
   */
  private async updateVideoQuality(options: {
    userId: string;
    streamType: VideoStreamType;
    newQuality: VideoStreamQuality;
  }): Promise<void> {
    const { userId, streamType, newQuality } = options;
    const streamInfo = this.streamInfoManager.getStreamInfo(userId, streamType);

    if (!streamInfo || !streamInfo.isPlaying) {
      return;
    }

    try {
      await this.streamPlayer.updateVideoQuality({
        userId,
        streamType,
        videoQuality: newQuality,
      });
      console.log(`[StreamPlayManager] 质量已切换: ${userId}_${streamType} -> ${newQuality}`);
    } catch (error) {
      console.error('[StreamPlayManager] updateVideoQuality error:', error);
      throw error;
    }
  }

  /**
   * 获取流信息
   * @param userId 用户ID
   * @param streamType 流类型
   * @returns 流信息
   */
  public getStreamInfo(userId: string, streamType: VideoStreamType): StreamInfo | null {
    return this.streamInfoManager.getStreamInfo(userId, streamType);
  }

  /**
   * 设置流配置
   * @param options 配置选项
   */
  public async setStreamConfig(options: {
    userId: string;
    streamType: VideoStreamType;
    renderParams?: {
      fillMode?: FillMode;
    };
  }): Promise<void> {
    const { userId, streamType, renderParams } = options;
    const streamInfo = this.streamInfoManager.getStreamInfo(userId, streamType);
    if (!streamInfo) {
      return;
    }
    if (renderParams && renderParams.fillMode) {
      this.streamInfoManager.updateStreamInfo({ userId, streamType, updates: { fillMode: renderParams.fillMode } });
    }
    try {
      await this.streamPlayer.setRenderParams({
        userId,
        streamType,
        renderParams: {
          fillMode: renderParams?.fillMode || FillMode.Fit,
        },
      });
    } catch (error) {
      console.error('[StreamPlayManager] setStreamConfig error:', error);
      throw error;
    }
  }

  /**
   * 检查流是否正在播放
   * @param userId 用户ID
   * @param streamType 流类型
   * @returns 是否正在播放
   */
  public isStreamPlaying(userId: string, streamType: VideoStreamType): boolean {
    return this.streamInfoManager.isStreamPlaying(userId, streamType);
  }

  /**
   * 获取所有正在播放的流
   * @returns 正在播放的流列表
   */
  public getPlayingStreams(): Array<{
    userId: string;
    streamType: VideoStreamType;
    viewCount: number;
    videoQuality?: VideoStreamQuality;
  }> {
    return this.streamInfoManager.getPlayingStreams();
  }

  /**
   * 清理所有流信息
   */
  public async destroy(): Promise<void> {
    try {
      const promises: Promise<void>[] = [];

      // 获取所有流并停止播放
      const allStreams = this.streamInfoManager.getAllStreams();
      for (const { userId, streamType } of allStreams) {
        promises.push(this.stopPlayVideo({ userId, streamType }));
      }

      await Promise.all(promises);

      // 清理所有模块
      this.lazyLoadManager.destroy();
      this.videoQualityManager.destroy();
      this.streamInfoManager.clear();
    } catch (error) {
      console.error('[StreamPlayManager] cleanup error:', error);
      throw error;
    }
  }

  /**
   * 检查流是否有可见的视图
   */
  public hasVisibleView(userId: string, streamType: VideoStreamType): boolean {
    return this.lazyLoadManager.hasVisibleView(userId, streamType);
  }

  /**
   * 获取单例实例
   * @returns StreamPlayManager 实例
   */
  public static getInstance(): StreamPlayManager {
    if (!StreamPlayManager.instance) {
      StreamPlayManager.instance = new StreamPlayManager();
    }
    return StreamPlayManager.instance;
  }

  /**
   * 销毁单例实例
   */
  public static async destroyInstance(): Promise<void> {
    if (StreamPlayManager.instance) {
      await StreamPlayManager.instance.destroy();
      StreamPlayManager.instance = null;
    }
  }
}

export default StreamPlayManager;
