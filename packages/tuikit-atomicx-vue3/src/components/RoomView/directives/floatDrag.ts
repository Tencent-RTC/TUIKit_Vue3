import type { Directive, DirectiveBinding } from 'vue';

/**
 * Float drag directive
 *
 * This directive makes an element draggable within a container boundary.
 * It handles touch and mouse events with proper conflict prevention for parent
 * scrollable/swipeable components (like Swiper).
 *
 * Key features:
 * - Uses capture phase to intercept events before parent components
 * - Calls stopPropagation() to prevent event bubbling
 * - Sets touch-action: none to disable default browser gestures
 * - Provides boundary constraints to keep element within container
 * - Supports edge snapping: automatically snaps to nearest horizontal edge (left/right) when drag ends
 * - Maintains vertical position when snapping (user can freely control Y position)
 * - Smooth animation when snapping to edges
 *
 * @example
 * Basic usage:
 * <div v-float-drag="{ container: containerRef, initialPosition: { top: 20, right: 20 } }">
 *   Draggable content
 * </div>
 *
 * @example
 * With edge snapping (snaps to left or right edge only):
 * <div v-float-drag="{
 *   container: containerRef,
 *   enableEdgeSnap: true,
 *   boundaryPadding: { top: 20, right: 20, bottom: 20, left: 20 },
 *   snapAnimationDuration: 300
 * }">
 *   Draggable content with horizontal edge snap
 * </div>
 */

/**
 * Float drag directive options
 */
interface FloatDragOptions {
  // Container element or selector for boundary calculation
  container?: HTMLElement | string;
  // Initial position
  initialPosition?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  // Boundary padding from container edges (also used as snap edge distance when enableEdgeSnap is true)
  boundaryPadding?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  // Enable/disable drag
  disabled?: boolean;
  // Enable edge snapping when drag ends (snaps to left or right edge only, maintains Y position)
  enableEdgeSnap?: boolean;
  // Animation duration for edge snapping in milliseconds (default: 300)
  snapAnimationDuration?: number;
  // Callback when drag starts
  onDragStart?: (position: { x: number; y: number }) => void;
  // Callback when dragging
  onDrag?: (position: { x: number; y: number }) => void;
  // Callback when drag ends
  onDragEnd?: (position: { x: number; y: number }) => void;
  // Callback when snap animation completes
  onSnapComplete?: (edge: 'top' | 'right' | 'bottom' | 'left', position: { x: number; y: number }) => void;
}

interface DragState {
  isPressed: boolean; // User has pressed the element (touchstart/mousedown)
  isDragging: boolean; // User is actually dragging (moved beyond threshold)
  startX: number;
  startY: number;
  elementStartX: number;
  elementStartY: number;
  currentX: number;
  currentY: number;
  options: FloatDragOptions; // Store options reference for handlers to access latest config
  handleTouchStart: (e: TouchEvent) => void;
  handleTouchMove: (e: TouchEvent) => void;
  handleTouchEnd: (e: TouchEvent) => void;
  handleMouseDown: (e: MouseEvent) => void;
  handleMouseMove: (e: MouseEvent) => void;
  handleMouseUp: (e: MouseEvent) => void;
}

// Movement threshold to distinguish click from drag (in pixels)
const DRAG_THRESHOLD = 3;

const dragStateMap = new WeakMap<HTMLElement, DragState>();

function getContainer(options: FloatDragOptions): HTMLElement | null {
  if (!options.container) {
    return null;
  }
  if (typeof options.container === 'string') {
    return document.querySelector(options.container);
  }
  return options.container;
}

function calculateBoundary(
  el: HTMLElement,
  container: HTMLElement | null,
  options: FloatDragOptions,
) {
  const elRect = el.getBoundingClientRect();
  const containerRect = container
    ? container.getBoundingClientRect()
    : { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };

  const padding = options.boundaryPadding || {};
  const paddingTop = padding.top ?? 0;
  const paddingRight = padding.right ?? 0;
  const paddingBottom = padding.bottom ?? 0;
  const paddingLeft = padding.left ?? 0;

  return {
    minX: containerRect.left + paddingLeft,
    maxX: containerRect.left + containerRect.width - elRect.width - paddingRight,
    minY: containerRect.top + paddingTop,
    maxY: containerRect.top + containerRect.height - elRect.height - paddingBottom,
  };
}

function applyPosition(el: HTMLElement, x: number, y: number) {
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
}

/**
 * Calculate the nearest edge and snap position (only snaps to left or right edges)
 */
function calculateSnapPosition(
  el: HTMLElement,
  currentX: number,
  currentY: number,
  container: HTMLElement | null,
  options: FloatDragOptions,
): { edge: 'top' | 'right' | 'bottom' | 'left'; x: number; y: number } {
  const elRect = el.getBoundingClientRect();
  const containerRect = container
    ? container.getBoundingClientRect()
    : { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };

  // Use boundaryPadding as snap edge distance
  const padding = options.boundaryPadding || {};
  const snapTop = padding.top ?? 0;
  const snapRight = padding.right ?? 0;
  const snapBottom = padding.bottom ?? 0;
  const snapLeft = padding.left ?? 0;

  // Calculate element center point
  const centerX = currentX + elRect.width / 2;

  // Calculate distances to left and right edges only
  const distanceToLeft = Math.abs(centerX - containerRect.left);
  const distanceToRight = Math.abs(centerX - (containerRect.left + containerRect.width));

  // Determine which edge is closer (left or right)
  let edge: 'top' | 'right' | 'bottom' | 'left';
  let snapX = currentX;
  const snapY = currentY; // Keep Y position unchanged

  if (distanceToLeft < distanceToRight) {
    edge = 'left';
    snapX = containerRect.left + snapLeft;
  } else {
    edge = 'right';
    snapX = containerRect.left + containerRect.width - elRect.width - snapRight;
  }

  // Ensure Y position is within vertical boundaries
  const finalY = Math.max(
    containerRect.top + snapTop,
    Math.min(snapY, containerRect.top + containerRect.height - elRect.height - snapBottom),
  );

  return { edge, x: snapX, y: finalY };
}

/**
 * Animate element to target position
 */
function animateToPosition(
  el: HTMLElement,
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  duration: number,
  onComplete?: () => void,
) {
  if (startX === targetX && startY === targetY) {
    onComplete?.();
    return;
  }

  const startTime = performance.now();

  // Easing function (ease-out cubic)
  const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3;

  function animate(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeOutCubic(progress);

    const currentX = startX + (targetX - startX) * easedProgress;
    const currentY = startY + (targetY - startY) * easedProgress;

    applyPosition(el, currentX, currentY);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      onComplete?.();
    }
  }

  requestAnimationFrame(animate);
}

/**
 * Initialize element position
 */
function initializePosition(el: HTMLElement, options: FloatDragOptions) {
  const container = getContainer(options);
  const containerRect = container
    ? container.getBoundingClientRect()
    : { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };

  // Ensure element has position: absolute
  if (getComputedStyle(el).position !== 'absolute') {
    el.style.position = 'absolute';
  }

  const initial = options.initialPosition || {};

  // Calculate initial position
  let x: number;
  let y: number;

  if (initial.left !== undefined) {
    x = containerRect.left + initial.left;
  } else if (initial.right !== undefined) {
    const elRect = el.getBoundingClientRect();
    x = containerRect.left + containerRect.width - elRect.width - initial.right;
  } else {
    x = containerRect.left + 20; // Default left offset
  }

  if (initial.top !== undefined) {
    y = containerRect.top + initial.top;
  } else if (initial.bottom !== undefined) {
    const elRect = el.getBoundingClientRect();
    y = containerRect.top + containerRect.height - elRect.height - initial.bottom;
  } else {
    y = containerRect.top + 20; // Default top offset
  }

  applyPosition(el, x, y);
}

/**
 * Create drag handlers
 */
function createDragHandlers(el: HTMLElement, binding: DirectiveBinding<FloatDragOptions>): DragState {
  const options = binding.value || {};
  const container = getContainer(options);

  const { width: elWidth, height: elHeight } = el.getBoundingClientRect();
  const { width: containerWidth, height: containerHeight } = container ? container.getBoundingClientRect() : { width: 0, height: 0 };
  let initialX = 0;
  let initialY = 0;
  if (typeof options?.initialPosition?.left === 'number') {
    initialX = options?.initialPosition?.left;
  } else if (typeof options?.initialPosition?.right === 'number') {
    initialX = containerWidth - elWidth - (options?.initialPosition?.right ?? 0);
  }
  if (typeof options?.initialPosition?.top === 'number') {
    initialY = options?.initialPosition?.top;
  } else if (typeof options?.initialPosition?.bottom === 'number') {
    initialY = containerHeight - elHeight - (options?.initialPosition?.bottom ?? 0);
  }

  const state: DragState = {
    isPressed: false,
    isDragging: false,
    startX: 0,
    startY: 0,
    elementStartX: 0,
    elementStartY: 0,
    currentX: initialX,
    currentY: initialY,
    options, // Store options reference for handlers to access latest config
    handleTouchStart: () => {},
    handleTouchMove: () => {},
    handleTouchEnd: () => {},
    handleMouseDown: () => {},
    handleMouseMove: () => {},
    handleMouseUp: () => {},
  };

  // Touch handlers
  state.handleTouchStart = (e: TouchEvent) => {
    if (state.options.disabled) {
      return;
    }

    state.isPressed = true;
    state.isDragging = false; // Reset dragging flag
    const touch = e.touches[0];
    state.startX = touch.clientX;
    state.startY = touch.clientY;

    const rect = el.getBoundingClientRect();
    state.elementStartX = rect.left;
    state.elementStartY = rect.top;

    // Don't call preventDefault/stopPropagation here to allow click events to propagate
    // Will be called in touchmove if user actually drags
  };

  state.handleTouchMove = (e: TouchEvent) => {
    if (!state.isPressed || state.options.disabled) {
      return;
    }

    const touch = e.touches[0];
    const deltaX = touch.clientX - state.startX;
    const deltaY = touch.clientY - state.startY;

    // Check if movement exceeds threshold (distinguishes drag from click)
    if (!state.isDragging) {
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (distance < DRAG_THRESHOLD) {
        return; // Not a drag yet, don't handle
      }
      // User has started actual dragging
      state.isDragging = true;
      el.style.cursor = 'grabbing';
      el.style.userSelect = 'none';
      state.options.onDragStart?.({ x: state.startX, y: state.startY });
    }

    let newX = state.elementStartX + deltaX;
    let newY = state.elementStartY + deltaY;

    // Apply boundary constraints
    const currentContainer = getContainer(state.options);
    const boundary = calculateBoundary(el, currentContainer, state.options);
    newX = Math.max(boundary.minX, Math.min(newX, boundary.maxX));
    newY = Math.max(boundary.minY, Math.min(newY, boundary.maxY));

    state.currentX = newX;
    state.currentY = newY;

    applyPosition(el, newX, newY);

    state.options.onDrag?.({ x: newX, y: newY });

    // Only prevent default and stop propagation when actually dragging
    e.preventDefault();
    e.stopPropagation();
  };

  state.handleTouchEnd = (e: TouchEvent) => {
    if (!state.isPressed) {
      return;
    }

    const wasDragging = state.isDragging;
    state.isPressed = false;
    state.isDragging = false;
    el.style.cursor = 'grab';
    el.style.userSelect = '';

    // If user didn't actually drag (just clicked), don't prevent event propagation
    if (!wasDragging) {
      return;
    }

    // Apply edge snapping if enabled
    if (state.options.enableEdgeSnap) {
      const currentContainer = getContainer(state.options);
      const snapResult = calculateSnapPosition(el, state.currentX, state.currentY, currentContainer, state.options);

      const duration = state.options.snapAnimationDuration ?? 300;

      animateToPosition(el, state.currentX, state.currentY, snapResult.x, snapResult.y, duration, () => {
        state.currentX = snapResult.x;
        state.currentY = snapResult.y;
        state.options.onSnapComplete?.(snapResult.edge, { x: snapResult.x, y: snapResult.y });
      });
    }

    state.options.onDragEnd?.({ x: state.currentX, y: state.currentY });

    // Only stop propagation when user actually dragged
    e.stopPropagation();
  };

  // Mouse handlers (for desktop testing)
  state.handleMouseDown = (e: MouseEvent) => {
    if (state.options.disabled) {
      return;
    }

    state.isPressed = true;
    state.isDragging = false; // Reset dragging flag
    state.startX = e.clientX;
    state.startY = e.clientY;

    const rect = el.getBoundingClientRect();
    state.elementStartX = rect.left;
    state.elementStartY = rect.top;

    // Don't call preventDefault/stopPropagation here to allow click events to propagate
    // Will be called in mousemove if user actually drags
  };

  state.handleMouseMove = (e: MouseEvent) => {
    if (!state.isPressed || state.options.disabled) {
      return;
    }

    const deltaX = e.clientX - state.startX;
    const deltaY = e.clientY - state.startY;

    // Check if movement exceeds threshold (distinguishes drag from click)
    if (!state.isDragging) {
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (distance < DRAG_THRESHOLD) {
        return; // Not a drag yet, don't handle
      }
      // User has started actual dragging
      state.isDragging = true;
      el.style.cursor = 'grabbing';
      el.style.userSelect = 'none';
      state.options.onDragStart?.({ x: state.startX, y: state.startY });
    }

    let newX = state.elementStartX + deltaX;
    let newY = state.elementStartY + deltaY;

    // Apply boundary constraints
    const currentContainer = getContainer(state.options);
    const boundary = calculateBoundary(el, currentContainer, state.options);
    newX = Math.max(boundary.minX, Math.min(newX, boundary.maxX));
    newY = Math.max(boundary.minY, Math.min(newY, boundary.maxY));

    state.currentX = newX;
    state.currentY = newY;

    applyPosition(el, newX, newY);

    state.options.onDrag?.({ x: newX, y: newY });

    // Only prevent default and stop propagation when actually dragging
    e.preventDefault();
    e.stopPropagation();
  };

  state.handleMouseUp = (e: MouseEvent) => {
    if (!state.isPressed) {
      return;
    }

    const wasDragging = state.isDragging;
    state.isPressed = false;
    state.isDragging = false;
    el.style.cursor = 'grab';
    el.style.userSelect = '';

    // If user didn't actually drag (just clicked), don't prevent event propagation
    if (!wasDragging) {
      return;
    }

    // Apply edge snapping if enabled
    if (state.options.enableEdgeSnap) {
      const currentContainer = getContainer(state.options);
      const snapResult = calculateSnapPosition(el, state.currentX, state.currentY, currentContainer, state.options);
      const duration = state.options.snapAnimationDuration ?? 300;

      animateToPosition(el, state.currentX, state.currentY, snapResult.x, snapResult.y, duration, () => {
        state.currentX = snapResult.x;
        state.currentY = snapResult.y;
        state.options.onSnapComplete?.(snapResult.edge, { x: snapResult.x, y: snapResult.y });
      });
    }

    state.options.onDragEnd?.({ x: state.currentX, y: state.currentY });

    // Only stop propagation when user actually dragged
    e.stopPropagation();
  };

  return state;
}

/**
 * Float drag directive
 *
 * Usage examples:
 *
 * Basic dragging:
 * <div v-float-drag="{ container: '#container', initialPosition: { top: 20, right: 20 } }">
 *   Draggable content
 * </div>
 *
 * With edge snapping:
 * <div v-float-drag="{
 *   container: '#container',
 *   enableEdgeSnap: true,
 *   boundaryPadding: { top: 20, right: 20, bottom: 20, left: 20 },
 *   onSnapComplete: (edge, pos) => console.log(`Snapped to ${edge}`, pos)
 * }">
 *   Draggable content with edge snap
 * </div>
 */
export const vFloatDrag: Directive<HTMLElement, FloatDragOptions> = {
  mounted(el, binding) {
    // Set initial styles
    el.style.cursor = 'grab';
    el.style.touchAction = 'none';
    el.style.webkitUserSelect = 'none';
    el.style.userSelect = 'none';

    // Initialize position
    initializePosition(el, binding.value || {});

    // Create and store drag handlers
    const state = createDragHandlers(el, binding);
    dragStateMap.set(el, state);

    // Add event listeners with capture phase to handle before parent components
    // Use passive: false to allow preventDefault()
    el.addEventListener('touchstart', state.handleTouchStart, { passive: false, capture: true });
    el.addEventListener('touchmove', state.handleTouchMove, { passive: false, capture: true });
    el.addEventListener('touchend', state.handleTouchEnd, { capture: true });
    el.addEventListener('touchcancel', state.handleTouchEnd, { capture: true });

    // Mouse events for desktop
    el.addEventListener('mousedown', state.handleMouseDown, { capture: true });
    document.addEventListener('mousemove', state.handleMouseMove);
    document.addEventListener('mouseup', state.handleMouseUp);
  },

  updated(el, binding) {
    const state = dragStateMap.get(el);
    if (!state) {
      return;
    }

    // Only update options reference, handlers will use the latest options via state.options
    state.options = binding.value || {};

    // Update cursor style if disabled state changed
    if (binding.value?.disabled) {
      el.style.cursor = 'not-allowed';
    } else {
      el.style.cursor = state.isPressed ? 'grabbing' : 'grab';
    }
  },

  beforeUnmount(el) {
    const state = dragStateMap.get(el);
    if (!state) {
      return;
    }

    // Remove event listeners with same options as addEventListener
    el.removeEventListener('touchstart', state.handleTouchStart, { capture: true } as EventListenerOptions);
    el.removeEventListener('touchmove', state.handleTouchMove, { capture: true } as EventListenerOptions);
    el.removeEventListener('touchend', state.handleTouchEnd, { capture: true } as EventListenerOptions);
    el.removeEventListener('touchcancel', state.handleTouchEnd, { capture: true } as EventListenerOptions);

    el.removeEventListener('mousedown', state.handleMouseDown, { capture: true } as EventListenerOptions);
    document.removeEventListener('mousemove', state.handleMouseMove);
    document.removeEventListener('mouseup', state.handleMouseUp);

    // Clean up
    dragStateMap.delete(el);
  },
};

export default vFloatDrag;
