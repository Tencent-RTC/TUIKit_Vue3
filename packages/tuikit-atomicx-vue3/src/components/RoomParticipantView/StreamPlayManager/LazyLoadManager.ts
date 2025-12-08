import type { VideoStreamType } from '../../../types';

/**
 * 懒加载管理器 - 负责懒加载和可见性监控
 * 职责：
 * 1. 监听 DOM 元素的可见性变化
 * 2. 管理 IntersectionObserver 实例
 * 3. 提供可见性状态查询接口
 */
export class LazyLoadManager {
  private intersectionObserver: IntersectionObserver | null = null;
  private observerDomMap: Map<HTMLDivElement, {
    userId: string;
    streamType: VideoStreamType;
    isIntersection: boolean;
  }> = new Map();

  private observerRoot: HTMLElement | null = null;

  // 回调函数类型
  private onVisibilityChange: (options: {
    userId: string;
    streamType: VideoStreamType;
    isVisible: boolean;
    target: HTMLElement;
  }) => void;

  constructor({ onVisibilityChange }: { onVisibilityChange: (options: {
    userId: string;
    streamType: VideoStreamType;
    isVisible: boolean;
    target: HTMLElement;
  }) => void; }) {
    this.onVisibilityChange = onVisibilityChange;
  }

  public initObserver({ root }: { root: string | HTMLDivElement | null }) {
    let newObserverRoot = root;
    if (typeof newObserverRoot === 'string') {
      newObserverRoot = document.getElementById(newObserverRoot) as HTMLDivElement;
    }

    if (!this.intersectionObserver || newObserverRoot !== this.observerRoot) {
      if (this.intersectionObserver) {
        this.intersectionObserver.disconnect();
      }

      const observerRoot = newObserverRoot as HTMLElement;
      this.intersectionObserver = new IntersectionObserver(
        this.intersectionObserverCallback.bind(this),
        {
          root: observerRoot,
          rootMargin: '20px',
        },
      );
      this.observerDomMap.clear();
      this.observerRoot = observerRoot;
    }
  }

  public observe(options: {
    userId: string;
    streamType: VideoStreamType;
    viewElement: HTMLDivElement;
  }): boolean {
    const { userId, streamType, viewElement } = options;
    if (!this.intersectionObserver) {
      console.warn('[StreamPlay][LazyLoadManager] Observer not initialized');
      return false;
    }
    if (!viewElement) {
      console.warn('[StreamPlay][LazyLoadManager] DOM element not found:', view);
      return false;
    }
    // 记录观察信息
    this.observerDomMap.set(viewElement as HTMLDivElement, {
      userId,
      streamType,
      isIntersection: false,
    });

    this.intersectionObserver.observe(viewElement);
    return true;
  }

  /**
   * 移除 DOM 元素监听
   */
  public unobserve(viewElement: HTMLDivElement): void {
    if (!this.intersectionObserver) {
      return;
    }
    if (viewElement) {
      this.intersectionObserver.unobserve(viewElement as Element);
    }
    this.observerDomMap.delete(viewElement as HTMLDivElement);
  }

  /**
   * 检查 DOM 元素是否可见
   */
  public isVisible(viewElement: HTMLDivElement): boolean {
    if (!viewElement) {
      return false;
    }
    const observerData = this.observerDomMap.get(viewElement as HTMLDivElement);
    return observerData?.isIntersection || false;
  }

  /**
   * 检查指定流是否有可见的视图
   */
  public hasVisibleView(userId: string, streamType: VideoStreamType): boolean {
    Array.from(this.observerDomMap.entries()).forEach(([, data]) => {
      if (data.userId === userId && data.streamType === streamType && data.isIntersection) {
        return true;
      }
    });
    return false;
  }

  /**
   * 交集观察器回调
   */
  private intersectionObserverCallback(entries: IntersectionObserverEntry[]) {
    entries.forEach((entry: IntersectionObserverEntry) => {
      const { isIntersecting, target } = entry;
      const observerData = this.observerDomMap.get(target as HTMLDivElement);

      if (!observerData) {
        return;
      }

      const { userId, streamType } = observerData;

      // 更新可见性状态
      observerData.isIntersection = isIntersecting;

      // 触发回调
      this.onVisibilityChange({
        userId,
        streamType,
        isVisible: isIntersecting,
        target: target as HTMLElement,
      });

      console.log(
        `[StreamPlay][LazyLoadManager] ${userId}_${streamType} ${isIntersecting ? 'enter' : 'left'} viewPort`,
      );
    });
  }

  /**
   * 清理所有资源
   */
  public destroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }

    this.observerDomMap.clear();
    this.observerRoot = null;
  }

  /**
   * 获取监听的 DOM 数量
   */
  public getObservedCount(): number {
    return this.observerDomMap.size;
  }
}

export default LazyLoadManager;
