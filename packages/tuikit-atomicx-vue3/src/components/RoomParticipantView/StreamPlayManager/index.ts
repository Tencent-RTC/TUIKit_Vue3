import { watch } from 'vue';
import TUIRoomEngine, { TUIRoomEvents, TUIVideoStreamType } from '@tencentcloud/tuiroom-engine-js';
import { useRoomEngine } from '../../../hooks/useRoomEngine';
import { useLoginState } from '../../../states/LoginState';
import { useRoomState } from '../../../states/RoomState';
import { VideoStreamType, FillMode } from '../../../types';
import { LazyLoadManager } from './LazyLoadManager';
import { StreamInfoManager } from './StreamInfoManager';
import { StreamPlayer } from './StreamPlayer';
import { VideoQualityManager } from './VideoQualityManager';
import type { VideoStreamQuality } from './types';

// 1. bindView（更新 views, 更新 质量）
// 2. unbindView（更新 views, 更新 质量）
// 3. 有流来了/流走了（更新 views, 更新 质量）
// 4. resize 变化（更新质量）
// 5. 视区变化（更新质量）

const roomEngine = useRoomEngine();
const { currentRoom } = useRoomState();
const { loginUserInfo } = useLoginState();

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
  private hasVideoStreamMap: Map<string, boolean> = new Map();

  constructor() {
    if (StreamPlayManager.instance) {
      return StreamPlayManager.instance;
    }
    StreamPlayManager.instance = this;

    // 初始化所有模块
    this.streamInfoManager = new StreamInfoManager();
    this.streamPlayer = new StreamPlayer();
    this.lazyLoadManager = new LazyLoadManager({
      onVisibilityChange: this.handleVisibilityChange.bind(this),
    });
    this.videoQualityManager = new VideoQualityManager({
      onQualityChange: this.handleQualityChange.bind(this),
      loginUserId: loginUserInfo.value?.userId || '',
    });
    this.onUserVideoStateChanged = this.onUserVideoStateChanged.bind(this);
    this.bindEvent();
  }

  public setLoginUserId(loginUserId: string) {
    this.videoQualityManager.setLoginUserId(loginUserId);
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
      this.hasVideoStreamMap.set(`${userId}_${streamTypeValue}`, true);
      this.startPlayVideo({ userId, streamType: streamTypeValue });
    } else {
      this.hasVideoStreamMap.delete(`${userId}_${streamTypeValue}`);
      this.stopPlayVideo({ userId, streamType: streamTypeValue });
    }
  }

  private isLocalVideoStream(userId: string): boolean {
    return userId === loginUserInfo.value?.userId;
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
    const viewElement = typeof view === 'string' ? document.getElementById(view) : view;
    if (!viewElement) {
      throw new Error('[StreamPlayManager] bindView failed: view not found');
    }
    const alwaysPlay = !enableLazyLoad || this.isLocalVideoStream(userId);
    try {
      this.streamInfoManager.addView({
        userId,
        streamType,
        view: viewElement as HTMLDivElement,
        initVisible: alwaysPlay,
      });
      if (alwaysPlay) {
        await this.startPlayVideo({ userId, streamType });
        return;
      }
      this.lazyLoadManager.initObserver({ root: lazyLoadViewport || null });
      this.lazyLoadManager.observe({ userId, streamType, viewElement: viewElement as HTMLDivElement });
    } catch (error) {
      console.error('[StreamPlayManager] bindView error:', error);
      throw error;
    }
  }

  async updateView(options: {
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
    const viewElement = typeof view === 'string' ? document.getElementById(view) : view;
    if (!viewElement) {
      throw new Error('[StreamPlayManager] updateView failed: view not found');
    }
    if (enableLazyLoad) {
      this.lazyLoadManager.initObserver({ root: lazyLoadViewport || null });
      this.lazyLoadManager.observe({ userId, streamType, viewElement: viewElement as HTMLDivElement });
    } else {
      this.lazyLoadManager.unobserve(viewElement as HTMLDivElement);
      this.streamInfoManager.setViewVisible({
        userId,
        streamType,
        view: viewElement as HTMLDivElement,
        isVisible: true,
      });
      const isPlaying = this.streamInfoManager.getStreamInfo(userId, streamType)?.isPlaying;
      if (!isPlaying) {
        await this.startPlayVideo({ userId, streamType });
      }
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
    try {
      this.streamInfoManager.removeView({
        userId,
        streamType,
        view: viewElement as HTMLDivElement,
      });
      this.lazyLoadManager.unobserve(viewElement as HTMLDivElement);
      this.videoQualityManager.unobserve(viewElement as HTMLDivElement);
      if (this.streamInfoManager.getVisibleViewIdList(userId, streamType).length === 0) {
        await this.stopPlayVideo({ userId, streamType });
      } else {
        await this.updateVideoView({ userId, streamType, removeViews: [viewElement as HTMLDivElement] });
      }
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
    console.log('[StreamPlayManager] VisibilityChange', `${userId}_${streamType} ${isVisible ? 'enter' : 'left'}`);
    this.streamInfoManager.setViewVisible({
      userId,
      streamType,
      view: target as HTMLDivElement,
      isVisible,
    });
    if (isVisible) {
      // DOM 进入视区，开始播放
      if (!streamInfo.isPlaying) {
        await this.startPlayVideo({ userId, streamType });
      } else {
        await this.updateVideoView({ userId, streamType, addViews: [target as HTMLDivElement] });
      }
    } else {
      const visibleViewIdList = this.streamInfoManager.getVisibleViewIdList(userId, streamType);
      if (visibleViewIdList.length === 0) {
        await this.stopPlayVideo({ userId, streamType });
      } else {
        await this.updateVideoView({ userId, streamType, removeViews: [target as HTMLDivElement] });
      }
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
    console.log(`[StreamPlayManager] videoQualityChange: ${userId}_${streamType} -> ${newQuality}, reason: ${reason}`);

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
    addViews?: (HTMLDivElement)[];
    removeViews?: (HTMLDivElement)[];
  }): Promise<void> {
    const { userId, streamType, addViews, removeViews } = options;
    const streamInfo = this.streamInfoManager.getStreamInfo(userId, streamType);
    if (!streamInfo) {
      return;
    }
    addViews?.forEach((viewElement) => {
      this.videoQualityManager.observe({ userId, streamType, viewElement: viewElement as HTMLDivElement });
    });
    removeViews?.forEach((viewElement) => {
      this.videoQualityManager.unobserve(viewElement as HTMLDivElement);
    });

    const visibleViewIdList = this.streamInfoManager.getVisibleViewIdList(userId, streamType);
    if (streamInfo.isPlaying && visibleViewIdList.length > 0) {
      const allViewIdList = this.streamInfoManager.getAllViewIdList(userId, streamType);
      await this.streamPlayer.updateVideoView({
        userId,
        streamType,
        viewIdList: allViewIdList,
      });
      await this.checkAndUpdateQuality({ userId, streamType });
    }
  }

  /**
   * 检查并更新视频质量
   * @private
   */
  private async checkAndUpdateQuality(options: {
    userId: string;
    streamType: VideoStreamType;
  }): Promise<void> {
    const { userId, streamType } = options;
    const streamInfo = this.streamInfoManager.getStreamInfo(userId, streamType);
    if (!streamInfo) {
      return;
    }
    const newQuality = this.videoQualityManager.calculateOptimalQuality({ userId, streamType });
    const oldQuality = streamInfo.videoQuality;
    if (newQuality !== oldQuality) {
      // eslint-disable-next-line no-console
      console.log(`[StreamPlayManager] videoQualityChange: ${userId}_${streamType} -> ${newQuality}, reason: view update`);
      this.streamInfoManager.updateStreamInfo({
        userId,
        streamType,
        updates: { videoQuality: newQuality },
      });
      await this.updateVideoQuality({ userId, streamType, newQuality });
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
    const hasVideoStream = this.hasVideoStreamMap.get(`${userId}_${streamType}`);
    if (!hasVideoStream) {
      return;
    }
    Array.from(streamInfo.views.keys()).forEach((view) => {
      this.videoQualityManager.observe({ userId, streamType, viewElement: view as HTMLDivElement });
    });
    const videoQuality = this.videoQualityManager.calculateOptimalQuality({ userId, streamType });
    if (streamInfo.videoQuality && streamInfo.videoQuality !== videoQuality) {
      console.log(`[StreamPlayManager] videoQualityChange: ${userId}_${streamType} -> ${videoQuality}, reason: view update`);
    }
    this.streamInfoManager.updateStreamInfo({
      userId,
      streamType,
      updates: { videoQuality },
    });
    try {
      const viewIdList = this.streamInfoManager.getVisibleViewIdList(userId, streamType);
      if (viewIdList.length === 0) {
        return;
      }
      await this.streamPlayer.startPlayVideo({
        userId,
        streamType,
        videoQuality,
        viewIdList,
      });
      this.streamInfoManager.updateStreamInfo({
        userId,
        streamType,
        updates: { isPlaying: true },
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

    Array.from(streamInfo.views.keys()).forEach((view) => {
      this.videoQualityManager.unobserve(view);
    });

    try {
      // 避免调用 stopPlayVideo 未执行结束，再次执行 startPlayVideo 时判断正在播放中只更新了 view 导致黑屏
      this.streamInfoManager.updateStreamInfo({
        userId,
        streamType,
        updates: { isPlaying: false },
      });
      await this.streamPlayer.stopPlayVideo({
        userId,
        streamType,
        videoQuality: streamInfo.videoQuality,
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
      console.log(`[StreamPlayManager] updateVideoQuality success: ${userId}_${streamType} -> ${newQuality}`);
    } catch (error) {
      console.error('[StreamPlayManager] updateVideoQuality error:', error);
      throw error;
    }
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

  private bindEvent() {
    TUIRoomEngine.once('ready', () => {
      roomEngine.instance?.on(TUIRoomEvents.onUserVideoStateChanged, this.onUserVideoStateChanged);
    });
  }

  private unbindEvent() {
    roomEngine.instance?.off(TUIRoomEvents.onUserVideoStateChanged, this.onUserVideoStateChanged);
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
      this.hasVideoStreamMap.clear();
      this.lazyLoadManager.destroy();
      this.videoQualityManager.destroy();
      this.streamInfoManager.clear();
      this.unbindEvent();
      StreamPlayManager.instance = null;
    } catch (error) {
      console.error('[StreamPlayManager] cleanup error:', error);
      throw error;
    }
  }
}

let streamPlayManager: StreamPlayManager = new StreamPlayManager();

watch(() => currentRoom.value?.roomId, async (newVal, oldVal) => {
  if (oldVal && !newVal) {
    await streamPlayManager.destroy();
    streamPlayManager = new StreamPlayManager();
  }
});

watch(() => loginUserInfo.value?.userId, (newVal) => {
  if (newVal) {
    streamPlayManager.setLoginUserId(newVal);
  }
});

export function useStreamPlayManager() {
  return {
    bindView: streamPlayManager?.bindView.bind(streamPlayManager),
    unbindView: streamPlayManager?.unbindView.bind(streamPlayManager),
    updateView: streamPlayManager?.updateView.bind(streamPlayManager),
    setStreamConfig: streamPlayManager?.setStreamConfig.bind(streamPlayManager),
  };
}
