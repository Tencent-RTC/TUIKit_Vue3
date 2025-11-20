import { VideoStreamType } from '../../../types';
import { debounce } from '../../../utils/utils';
import { VideoStreamQuality } from './types';

const HIGH_QUALITY_NUMBER = 6; // 最大大流数量
const RESIZE_DEBOUNCE_TIME = 300; // 防抖时间（毫秒）
const QUALITY_THRESHOLD_WIDTH = 480; // 大流宽度阈值
const QUALITY_THRESHOLD_HEIGHT = 270; // 大流高度阈值
const QUALITY_HYSTERESIS = 1.15; // 滞后系数，避免在阈值附近频繁切换

/**
 * 视频质量管理器 - 负责 DOM 尺寸监控和质量切换
 * 职责：
 * 1. 监听 DOM 元素的尺寸变化
 * 2. 计算最优的流质量
 * 3. 管理大流分配策略
 * 4. 提供质量计算接口
 */
export class VideoQualityManager {
  private resizeObserver: ResizeObserver | null = null;
  private bodyResizeObserver: ResizeObserver | null = null;

  // DOM 信息映射
  private domInfoMap: Map<string | HTMLDivElement, {
    userId: string;
    streamType: VideoStreamType;
    rect?: { width: number; height: number };
    radio?: number;
  }> = new Map();

  // 大流管理
  private highQualityDomMap: Map<string | HTMLDivElement, {
    userId: string;
    streamType: VideoStreamType;
    radio: number;
  }> = new Map();

  // 缓存屏幕面积，避免重复计算
  private cachedBodyArea = 0;

  // 回调函数
  private onQualityChange: (options: {
    userId: string;
    streamType: VideoStreamType;
    newQuality: VideoStreamQuality;
    oldQuality?: VideoStreamQuality;
    reason: string;
  }) => void;

  constructor(onQualityChange: (options: {
    userId: string;
    streamType: VideoStreamType;
    newQuality: VideoStreamQuality;
    oldQuality?: VideoStreamQuality;
    reason: string;
  }) => void) {
    this.onQualityChange = onQualityChange;
    this.initResizeObserver();
    this.initBodyAreaCache();
  }

  /**
   * 初始化 ResizeObserver
   */
  private initResizeObserver() {
    this.resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        this.handleResize(entry);
      });
    });
  }

  /**
   * 初始化屏幕面积缓存
   */
  private initBodyAreaCache() {
    this.cachedBodyArea = document.body.clientWidth * document.body.clientHeight;
    this.bodyResizeObserver = new ResizeObserver(this.handleBodyResize);
    this.bodyResizeObserver.observe(document.body);
  }

  private handleBodyResize = debounce(() => {
    this.updateBodyAreaCache();
  }, RESIZE_DEBOUNCE_TIME);

  /**
   * 更新屏幕面积缓存
   */
  private updateBodyAreaCache() {
    this.cachedBodyArea = document.body.clientWidth * document.body.clientHeight;
    // eslint-disable-next-line no-console
    console.log(`[VideoQualityManager] 屏幕面积更新: ${this.cachedBodyArea}`);
  }

  /**
   * 添加 DOM 元素监听
   */
  public observe(options: {
    userId: string;
    streamType: VideoStreamType;
    view: string | HTMLDivElement;
  }): boolean {
    const { userId, streamType, view } = options;

    if (!this.resizeObserver) {
      console.warn('[VideoQualityManager] Observer not initialized');
      return false;
    }

    const viewElement = typeof view === 'string' ? document.getElementById(view) : view;
    if (!viewElement) {
      console.warn('[VideoQualityManager] DOM element not found:', view);
      return false;
    }

    if (this.domInfoMap.has(view) && this.domInfoMap.get(view)?.userId === userId && this.domInfoMap.get(view)?.streamType === streamType) {
      return true;
    }

    // 添加到 DOM 信息映射
    this.domInfoMap.set(view, {
      userId,
      streamType,
      rect: this.getDomRect(view),
    });

    // 开始监控尺寸变化
    this.resizeObserver.observe(viewElement);
    return true;
  }

  /**
   * 移除 DOM 元素监听
   */
  public unobserve(view: string | HTMLDivElement): void {
    if (!this.resizeObserver) {
      return;
    }

    const viewElement = typeof view === 'string' ? document.getElementById(view) : view;
    if (viewElement) {
      this.resizeObserver.unobserve(viewElement);
    }

    // 从映射中移除
    this.domInfoMap.delete(view);

    // 清理大流记录
    if (this.highQualityDomMap.has(view)) {
      this.highQualityDomMap.delete(view);
    }
  }

  /**
   * 处理 DOM 尺寸变化
   */
  private handleResize = debounce((entry: ResizeObserverEntry) => {
    const { width, height } = entry.contentRect;
    const domInfo = this.domInfoMap.get(entry.target as HTMLDivElement);

    if (!domInfo) {
      return;
    }

    const { userId, streamType } = domInfo;

    // 更新 DOM 尺寸信息
    domInfo.rect = { width, height };
    this.domInfoMap.set(entry.target as HTMLDivElement, domInfo);

    console.log(`[VideoQualityManager] ${userId}_${streamType} 尺寸变化: ${width}x${height}`);

    const newQuality = this.calculateOptimalQuality({ userId, streamType });

    // 触发质量变化回调
    this.onQualityChange({
      userId,
      streamType,
      newQuality,
      reason: `DOM尺寸变化: ${width}x${height}`,
    });
  }, RESIZE_DEBOUNCE_TIME);

  /**
   * 计算最优质量
   */
  public calculateOptimalQuality(options: {
    userId: string;
    streamType: VideoStreamType;
    views?: (string | HTMLDivElement)[];
  }): VideoStreamQuality {
    const { userId, streamType, views } = options;

    // 屏幕分享永远使用大流
    if (streamType === VideoStreamType.Screen) {
      return VideoStreamQuality.HD;
    }

    // 获取相关的视图
    const targetViews = views || this.getViewsByStream(userId, streamType);
    if (targetViews.length === 0) {
      return VideoStreamQuality.LD;
    }

    // 计算所有视图的最大面积
    const domRectList = targetViews.map(view => this.getDomRect(view));
    const maxVideoArea = Math.max(...domRectList.map(rect => rect.width * rect.height), 0);

    // 尺寸阈值判断（带滞后）
    const thresholdArea = QUALITY_THRESHOLD_WIDTH * QUALITY_THRESHOLD_HEIGHT;
    if (maxVideoArea < thresholdArea * QUALITY_HYSTERESIS) {
      return VideoStreamQuality.LD;
    }

    // 计算面积占比
    const bodyArea = this.cachedBodyArea || document.body.clientWidth * document.body.clientHeight;
    const bodyRadio = maxVideoArea / bodyArea;

    // 获取当前大流列表，按面积占比排序
    const highQualityEntries = Array.from(this.highQualityDomMap.entries())
      .sort((a, b) => a[1].radio - b[1].radio);

    // 判断是否可以分配大流
    if (highQualityEntries.length < HIGH_QUALITY_NUMBER) {
      // 未达到大流上限，直接分配
      this.updateHighQualityMap(userId, streamType, targetViews, bodyRadio);
      return VideoStreamQuality.HD;
    }
    // 已达到上限，尝试淘汰机制
    const smallerEntries = highQualityEntries.filter(([_, info]) => info.radio < bodyRadio);

    if (smallerEntries.length > 0) {
      // 淘汰面积占比最小的大流
      const [, deleteInfo] = smallerEntries[0];

      console.log(
        `[VideoQualityManager] 淘汰 ${deleteInfo.userId}_${deleteInfo.streamType} (占比: ${(deleteInfo.radio * 100).toFixed(2)}%)，`
        + `为 ${userId}_${streamType} (占比: ${(bodyRadio * 100).toFixed(2)}%) 腾出位置`,
      );

      // 触发被淘汰流的质量变化
      this.onQualityChange({
        userId: deleteInfo.userId,
        streamType: deleteInfo.streamType,
        newQuality: VideoStreamQuality.LD,
        reason: `被淘汰，为 ${userId}_${streamType} 腾出大流位置`,
      });

      // 更新大流映射
      this.updateHighQualityMap(userId, streamType, targetViews, bodyRadio);
      return VideoStreamQuality.HD;
    }
    // 当前视频面积占比小于所有现有大流，不分配大流
    console.log(
      `[VideoQualityManager] ${userId}_${streamType} 面积占比过小，保持小流: ${(bodyRadio * 100).toFixed(2)}%`,
    );
    return VideoStreamQuality.LD;
  }

  /**
   * 更新大流映射
   */
  private updateHighQualityMap(
    userId: string,
    streamType: VideoStreamType,
    views: (string | HTMLDivElement)[],
    radio: number,
  ) {
    Array.from(this.highQualityDomMap.entries()).forEach(([view, info]) => {
      if (info.userId === userId && info.streamType === streamType) {
        this.highQualityDomMap.delete(view);
      }
    });

    views.forEach((view) => {
      const viewElement = typeof view === 'string' ? document.getElementById(view) : view;
      if (viewElement) {
        this.highQualityDomMap.set(view, { userId, streamType, radio });
      }
    });
  }

  /**
   * 根据流信息获取相关视图
   */
  private getViewsByStream(userId: string, streamType: VideoStreamType): (string | HTMLDivElement)[] {
    const views: (string | HTMLDivElement)[] = [];
    Array.from(this.domInfoMap.entries()).forEach(([view, info]) => {
      if (info.userId === userId && info.streamType === streamType) {
        views.push(view);
      }
    });

    return views;
  }

  /**
   * 获取 DOM 元素的尺寸
   */
  private getDomRect(dom: string | HTMLDivElement): { width: number; height: number } {
    const element = typeof dom === 'string' ? document.getElementById(dom) : dom;
    return element ? element.getBoundingClientRect() : { width: 0, height: 0 };
  }

  /**
   * 清理所有资源
   */
  public destroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.bodyResizeObserver) {
      this.bodyResizeObserver.disconnect();
      this.bodyResizeObserver = null;
    }

    this.domInfoMap.clear();
    this.highQualityDomMap.clear();
    this.cachedBodyArea = 0;
  }

  /**
   * 获取监听的 DOM 数量
   */
  public getObservedCount(): number {
    return this.domInfoMap.size;
  }
}

export default VideoQualityManager;
