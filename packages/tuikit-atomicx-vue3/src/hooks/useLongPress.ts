import { ref, onUnmounted } from 'vue';

interface UseLongPressOptions {
  delay?: number;
  preventDefault?: boolean;
  cancelOutsideElement?: boolean;
  cancelOnMove?: boolean | number;
  onContextMenu?: (event: PointerEvent) => void;
}

const noop = () => {};

/**
 * Vue3 long press hook
 * @param onLongPress - long press callback function
 * @param options - configuration options for long press behavior
 * @returns event handlers and state for long press
 */
export function useLongPress(
  onLongPress: ((event: PointerEvent) => void) | null,
  options?: UseLongPressOptions,
) {
  const effectiveCallback = onLongPress ?? noop;

  const {
    delay = 500,
    preventDefault = true,
    cancelOutsideElement = true,
    cancelOnMove = true,
    onContextMenu,
  } = options || {};

  let fixedThreshold = 5; // Default threshold for cancelOnMove
  if (typeof cancelOnMove === 'number') {
    fixedThreshold = cancelOnMove;
  }

  const isLongPressActive = ref(false);
  let timer: ReturnType<typeof setTimeout> | null = null;
  let startCoords: { x: number; y: number } | null = null;

  const clear = (event: PointerEvent) => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    startCoords = null;
    isLongPressActive.value = false;
  };

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

  const end = (event: PointerEvent) => {
    clear(event);
  };

  onUnmounted(() => {
    if (timer) {
      clearTimeout(timer);
    }
  });

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
