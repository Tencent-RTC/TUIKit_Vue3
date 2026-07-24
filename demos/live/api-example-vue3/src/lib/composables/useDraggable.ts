import { onBeforeUnmount, ref, type Ref } from 'vue';

export interface DraggableBinding {
  /** Inline style to spread onto the widget root. */
  style: {
    top: string;
    left: string;
    right: string;
    bottom: string;
  };
  /** Listener to attach to the widget root. */
  onPointerDown: (event: PointerEvent) => void;
}

/**
 * Make a `position: fixed` widget draggable by its handle element.
 *
 * The widget's root element should bind the returned `style` (it sets
 * `top`/`left` once the user starts dragging). Before the first drag,
 * the widget stays at its default `right`/`bottom` anchor position via
 * the auto-empty values — callers should set those anchors on the
 * widget itself (the composable only writes `right: 'auto' /
 * bottom: 'auto'` once dragging has begun).
 *
 * Coordinate model:
 *  - `top: 0; left: 0; right: auto; bottom: auto` once the user has
 *    dragged at least once. We track pixel offsets from the viewport
 *    edges via inline style and update them on every `pointermove`.
 *  - Pointer capture is requested on pointerdown so dragging stays
 *    smooth even if the cursor leaves the handle mid-drag.
 *  - Cursor changes between `grab` / `grabbing` on the handle to make
 *    the affordance discoverable.
 */
export function useDraggable(options: { handleSelector: string }): {
  position: Ref<{ top: number; left: number } | null>;
  binding: DraggableBinding;
  /** Re-clamp the current position after the widget's size changes (e.g. expand/collapse). */
  reclamp: (width: number, height: number) => void;
} {
  const position = ref<{ top: number; left: number } | null>(null);
  let activePointerId: number | null = null;
  let startOffsetX = 0;
  let startOffsetY = 0;
  let startPosX = 0;
  let startPosY = 0;
  // Widget size snapshotted at pointerdown so the clamp math is
  // consistent across the whole drag (the live `offsetWidth` can
  // briefly return 0 mid-transition if the body or an ancestor is
  // being reflowed).
  let dragWidth = 0;
  let dragHeight = 0;

  function onPointerMove(event: PointerEvent): void {
    if (activePointerId !== event.pointerId) {
      return;
    }
    const newLeft = startPosX + (event.clientX - startOffsetX);
    const newTop = startPosY + (event.clientY - startOffsetY);
    // Clamp so the entire widget stays within the viewport. The
    // dimensions are snapshotted at pointerdown (see `dragWidth` /
    // `dragHeight`) to avoid transient 0-width / 0-height reads
    // during reflow. Use `documentElement.clientWidth/Height` rather
    // than `window.innerWidth/Height` — the latter includes the
    // scrollbar gutter and other browser chrome, which can cause the
    // widget to be clamped to a position that is still off-screen
    // visually.
    const maxLeft = document.documentElement.clientWidth - dragWidth;
    const maxTop = document.documentElement.clientHeight - dragHeight;
    position.value = {
      left: Math.max(0, Math.min(newLeft, maxLeft)),
      top: Math.max(0, Math.min(newTop, maxTop)),
    };
  }

  function onPointerUp(event: PointerEvent): void {
    if (activePointerId !== event.pointerId) {
      return;
    }
    activePointerId = null;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
  }

  function onPointerDown(event: PointerEvent): void {
    // Ignore right-clicks and non-primary buttons.
    if (event.button !== 0) {
      return;
    }
    const target = event.currentTarget as HTMLElement | null;
    if (!target) {
      return;
    }
    // Only initiate a drag when the press lands on the handle (or, if
    // the handle selector matches no node, anywhere on the root). Skip
    // the drag when the press lands on a button so collapse/stop/close
    // remain clickable.
    const handle = target.querySelector<HTMLElement>(options.handleSelector);
    if (handle) {
      if (!handle.contains(event.target as Node)) {
        return;
      }
    } else if ((event.target as HTMLElement).closest('button')) {
      return;
    }
    event.preventDefault();
    activePointerId = event.pointerId;
    // Snapshot the widget's current dimensions so the viewport clamp
    // stays consistent across the whole drag.
    dragWidth = target.offsetWidth;
    dragHeight = target.offsetHeight;
    // Snapshot the current on-screen position. On the first drag we
    // measure the live rect; afterwards we just read the previous
    // value so the delta math stays consistent.
    if (position.value === null) {
      const rect = target.getBoundingClientRect();
      startPosX = rect.left;
      startPosY = rect.top;
    } else {
      startPosX = position.value.left;
      startPosY = position.value.top;
    }
    startOffsetX = event.clientX;
    startOffsetY = event.clientY;
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  }

  onBeforeUnmount(() => {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
  });

  // `style` is exposed as four plain string properties so consumers
  // can use it in any position the CSSProperties type expects.
  // `top`/`left` are empty strings before the first drag; `right`/
  // `bottom` default to their CSS initial (`auto`) so the widget falls
  // back to whatever the CSS rule on `.global-stage { right: 16px;
  // bottom: 16px; }` says.
  const style = {
    get top(): string {
      return position.value ? `${position.value.top}px` : '';
    },
    get left(): string {
      return position.value ? `${position.value.left}px` : '';
    },
    get right(): string {
      return position.value ? 'auto' : '';
    },
    get bottom(): string {
      return position.value ? 'auto' : '';
    },
  };

  /**
   * Re-clamp the current position after the widget's size changes
   * (e.g. expand / collapse toggle). Without this, a widget dragged to
   * the viewport edge while collapsed would overflow when expanded,
   * because the drag-time clamp used the smaller (collapsed) dimensions.
   */
  function reclamp(width: number, height: number): void {
    if (!position.value) return;
    const maxLeft = document.documentElement.clientWidth - width;
    const maxTop = document.documentElement.clientHeight - height;
    position.value = {
      left: Math.max(0, Math.min(position.value.left, maxLeft)),
      top: Math.max(0, Math.min(position.value.top, maxTop)),
    };
  }

  return {
    position,
    binding: {
      style,
      onPointerDown,
    },
    reclamp,
  };
}
