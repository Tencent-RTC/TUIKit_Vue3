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
  private loginUserId: string;
  // 回调函数
  private onQualityChange: (options: {
    userId: string;
    streamType: VideoStreamType;
    newQuality: VideoStreamQuality;
    oldQuality?: VideoStreamQuality;
    reason: string;
  }) => void;

  constructor({ onQualityChange, loginUserId }: { onQualityChange: (options: {
    userId: string;
    streamType: VideoStreamType;
    newQuality: VideoStreamQuality;
    oldQuality?: VideoStreamQuality;
    reason: string;
  }) => void; loginUserId: string; }) {
    this.onQualityChange = onQualityChange;
    this.loginUserId = loginUserId;
    this.initResizeObserver();
    this.initBodyAreaCache();
  }

  public setLoginUserId(loginUserId: string) {
    this.loginUserId = loginUserId;
  }

  private pendingEntries = new Map<HTMLElement, ResizeObserverEntry>();

  /**
   * 初始化 ResizeObserver
   */
  private initResizeObserver() {
    const processPendingEntries = debounce(() => {
      this.pendingEntries.forEach((entry) => {
        this.handleResize(entry);
      });
      this.pendingEntries.clear();
    }, RESIZE_DEBOUNCE_TIME);
    this.resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        this.pendingEntries.set(entry.target as HTMLElement, entry);
      });
      processPendingEntries();
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
    viewElement: HTMLDivElement;
  }): boolean {
    const { userId, streamType, viewElement } = options;
    if (!this.resizeObserver) {
      console.warn('[VideoQualityManager] Observer not initialized');
      return false;
    }
    if (!viewElement) {
      console.warn('[VideoQualityManager] DOM element not found:', viewElement);
      return false;
    }

    if (this.domInfoMap.has(viewElement) && this.domInfoMap.get(viewElement)?.userId === userId && this.domInfoMap.get(viewElement)?.streamType === streamType) {
      return true;
    }

    this.domInfoMap.set(viewElement, {
      userId,
      streamType,
      rect: this.getDomRect(viewElement),
    });
    this.resizeObserver.observe(viewElement);
    return true;
  }

  /**
   * 移除 DOM 元素监听
   */
  public unobserve(viewElement: HTMLDivElement): void {
    if (viewElement && this.resizeObserver) {
      this.resizeObserver.unobserve(viewElement);
    }
    // 从映射中移除
    this.domInfoMap.delete(viewElement);
    // 清理大流记录
    if (this.highQualityDomMap.has(viewElement)) {
      this.highQualityDomMap.delete(viewElement);
    }
  }

  /**
   * 处理 DOM 尺寸变化
   */
  private handleResize = (entry: ResizeObserverEntry) => {
    const { width, height } = entry.contentRect;
    const domInfo = this.domInfoMap.get(entry.target as HTMLDivElement);

    if (!domInfo) {
      return;
    }

    const { userId, streamType } = domInfo;

    // 更新 DOM 尺寸信息
    domInfo.rect = { width, height };
    this.domInfoMap.set(entry.target as HTMLDivElement, domInfo);

    const newQuality = this.calculateOptimalQuality({ userId, streamType });
    // 触发质量变化回调
    this.onQualityChange({
      userId,
      streamType,
      newQuality,
      reason: `DOM resize: ${width}x${height}`,
    });
  };

  /**
   * 计算最优质量
   */
  public calculateOptimalQuality(options: {
    userId: string;
    streamType: VideoStreamType;
    views?: (HTMLDivElement)[];
  }): VideoStreamQuality {
    const { userId, streamType, views } = options;

    // 获取相关的视图
    const targetViews = views || this.getViewsByStream(userId, streamType);

    if (userId === this.loginUserId) {
      return VideoStreamQuality.LD;
    }

    // 屏幕分享永远使用大流
    if (streamType === VideoStreamType.Screen) {
      this.tryToRemoveHighQualityDom(userId, streamType, targetViews, 1);
      this.updateHighQualityMap(userId, streamType, targetViews, 1);
      return VideoStreamQuality.HD;
    }

    if (targetViews.length === 0) {
      this.removeHighQualityDom(userId, streamType, targetViews);
      return VideoStreamQuality.LD;
    }

    // 计算所有视图的最大面积
    const domRectList = targetViews.map(view => this.getDomRect(view));
    const maxVideoArea = Math.max(...domRectList.map(rect => rect.width * rect.height), 0);

    // 尺寸阈值判断（带滞后）
    const thresholdArea = QUALITY_THRESHOLD_WIDTH * QUALITY_THRESHOLD_HEIGHT;
    if (maxVideoArea < thresholdArea * QUALITY_HYSTERESIS) {
      this.removeHighQualityDom(userId, streamType, targetViews);
      return VideoStreamQuality.LD;
    }

    // 计算面积占比
    const bodyArea = this.cachedBodyArea || document.body.clientWidth * document.body.clientHeight;
    const bodyRadio = maxVideoArea / bodyArea;

    // 获取当前大流列表，按面积占比排序
    const otherHighQualityEntries = Array.from(this.highQualityDomMap.entries())
      .filter(([_, info]) => !(info.userId === userId && info.streamType === streamType))
      .sort((a, b) => a[1].radio - b[1].radio);

    // 判断是否可以分配大流
    if (otherHighQualityEntries.length < HIGH_QUALITY_NUMBER) {
      // 未达到大流上限，直接分配
      this.updateHighQualityMap(userId, streamType, targetViews, bodyRadio);
      return VideoStreamQuality.HD;
    }
    const removeResult = this.tryToRemoveHighQualityDom(userId, streamType, targetViews, bodyRadio);
    if (removeResult) {
      this.updateHighQualityMap(userId, streamType, targetViews, bodyRadio);
      return VideoStreamQuality.HD;
    }
    // 当前视频面积占比小于所有现有大流，不分配大流
    console.log(
      `[StreamPlayer][VideoQualityManager] ${userId}_${streamType} 面积占比过小，保持小流: ${(bodyRadio * 100).toFixed(2)}%`,
    );
    this.removeHighQualityDom(userId, streamType, targetViews);
    return VideoStreamQuality.LD;
  }

  // 将淘汰大流的逻辑单独实现在这里
  private tryToRemoveHighQualityDom(userId: string, streamType: VideoStreamType, targetViews: (HTMLDivElement)[], bodyRadio: number): boolean {
    const otherHighQualityEntries = Array.from(this.highQualityDomMap.entries())
      .filter(([_, info]) => !(info.userId === userId && info.streamType === streamType))
      .sort((a, b) => a[1].radio - b[1].radio);
    if (otherHighQualityEntries.length < HIGH_QUALITY_NUMBER) {
      return false;
    }
    const smallerEntries = otherHighQualityEntries.filter(([_, info]) => info.radio < bodyRadio);
    if (smallerEntries.length > 0) {
      const [, deleteInfo] = smallerEntries[0];
      console.log(
        `[StreamPlayer][VideoQualityManager] 淘汰 ${deleteInfo.userId}_${deleteInfo.streamType} (占比: ${(deleteInfo.radio * 100).toFixed(2)}%)，`
        + `为 ${userId}_${streamType} (占比: ${(bodyRadio * 100).toFixed(2)}%) 腾出位置`,
      );
      this.onQualityChange({
        userId: deleteInfo.userId,
        streamType: deleteInfo.streamType,
        newQuality: VideoStreamQuality.LD,
        reason: `because of ${userId}_${streamType} become high quality`,
      });
      this.removeHighQualityDom(deleteInfo.userId, deleteInfo.streamType, targetViews);
      return true;
    }
    return false;
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

  private removeHighQualityDom(userId: string, streamType: VideoStreamType, views: (string | HTMLDivElement)[]) {
    Array.from(this.highQualityDomMap.entries()).forEach(([view, info]) => {
      if (info.userId === userId && info.streamType === streamType) {
        this.highQualityDomMap.delete(view);
      }
    });
  }

  /**
   * 根据流信息获取相关视图
   */
  private getViewsByStream(userId: string, streamType: VideoStreamType): (HTMLDivElement)[] {
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
