import { ref, onUnmounted } from 'vue';

interface UseLongPressOptions {
  // 长按触发延迟（毫秒），默认500ms
  delay?: number;
  // 是否阻止默认事件，默认true
  preventDefault?: boolean;
  // 是否在指针离开元素时取消长按，默认true
  cancelOutsideElement?: boolean;
  // 是否在指针移动超过阈值时取消长按，默认true
  cancelOnMove?: boolean | number;
  onContextMenu?: (event: PointerEvent) => void;
}

// 空操作函数
const noop = () => {};

/**
 * Vue3长按事件hook
 * @param onLongPress - 长按触发时的回调函数
 * @param options - 长按配置选项
 * @returns 事件处理器对象
 */
export function useLongPress(
  onLongPress: ((event: PointerEvent) => void) | null,
  options?: UseLongPressOptions
) {
  const effectiveCallback = onLongPress ?? noop;

  const {
    delay = 500,
    preventDefault = true,
    cancelOutsideElement = true,
    cancelOnMove = true,
    onContextMenu,
  } = options || {};

  let fixedThreshold = 5; // 移动阈值（像素）
  if (typeof cancelOnMove === 'number') {
    fixedThreshold = cancelOnMove;
  }

  const isLongPressActive = ref(false);
  let timer: ReturnType<typeof setTimeout> | null = null;
  let startCoords: { x: number; y: number } | null = null;

  // 清除定时器和重置状态
  const clear = (event: PointerEvent) => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    startCoords = null;
    isLongPressActive.value = false;
  };

  // 开始处理：记录起始位置并开始定时器
  const start = (event: PointerEvent) => {
    clear(event);
    if (preventDefault) {
      event.preventDefault();
    }
    startCoords = { x: event.clientX, y: event.clientY };
    timer = setTimeout(() => {
      effectiveCallback(event);
      isLongPressActive.value = true;
      clear(event);
    }, delay);
  };

  // 移动处理：如果指针移动超过阈值则取消长按
  const move = (event: PointerEvent) => {
    if (!startCoords || !cancelOnMove) {
      return;
    }
    const diffX = Math.abs(event.clientX - startCoords.x);
    const diffY = Math.abs(event.clientY - startCoords.y);
    if (diffX > fixedThreshold || diffY > fixedThreshold) {
      clear(event);
    }
  };

  // 结束处理：指针抬起，取消长按
  const end = (event: PointerEvent) => {
    clear(event);
  };

  // 组件卸载时清理定时器
  onUnmounted(() => {
    if (timer) {
      clearTimeout(timer);
    }
  });

  // 返回事件处理器
  const getEventHandlers = () => {
    if (onLongPress === null) {
      return {};
    }

    const handlers: Record<string, (event: PointerEvent) => void> = {
      onPointerdown: start,
      onPointermove: move,
      onPointerup: end,
    };

    if (onContextMenu) {
      handlers.onContextmenu = onContextMenu;
    }

    if (cancelOutsideElement) {
      handlers.onPointerleave = end;
    }

    return handlers;
  };

  return {
    getEventHandlers,
    isLongPressActive,
  };
}

export type { UseLongPressOptions };