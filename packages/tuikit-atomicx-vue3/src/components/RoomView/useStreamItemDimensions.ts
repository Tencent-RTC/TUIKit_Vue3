import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import type { Ref } from 'vue';

export interface StreamItemDimensionsOptions {
  // Container element ref
  containerRef: Ref<HTMLElement | null>;
  // Number of columns in the grid
  columns: Ref<number> | number;
  // Number of rows in the grid
  rows: Ref<number> | number;
  // Number of items to display
  itemCount: Ref<number> | number;
  // Gap between items (in pixels)
  gap?: number;
  // Aspect ratio (width / height)
  aspectRatio?: number;
  // Additional padding to subtract from container (in pixels)
  padding?: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
  };
  // Watch dependencies that trigger recalculation
  watchDependencies?: Array<Ref<unknown> | (() => unknown)>;
}

export interface StreamItemStyle {
  width?: string;
  height?: string;
}

/**
 * Calculate stream item dimensions maintaining a specific aspect ratio
 * @param options Configuration options
 * @returns Reactive style object with width and height
 */
export function useStreamItemDimensions(options: StreamItemDimensionsOptions) {
  const {
    containerRef,
    columns,
    rows,
    itemCount,
    gap = 0,
    aspectRatio = 16 / 9,
    padding = {},
    watchDependencies = [],
  } = options;

  const itemStyle = ref<StreamItemStyle>({});

  // Calculate item dimensions based on container size and grid layout
  function calculateDimensions() {
    if (!containerRef.value) {
      return;
    }

    const container = containerRef.value;
    const containerRect = container.getBoundingClientRect();

    // Get current values (handle both Ref and number)
    const colNumber = typeof columns === 'number' ? columns : columns.value;
    const rowNumber = typeof rows === 'number' ? rows : rows.value;
    const count = typeof itemCount === 'number' ? itemCount : itemCount.value;

    // Early return if no items or invalid columns
    if (count <= 0 || colNumber <= 0 || rowNumber <= 0) {
      itemStyle.value = {};
      return;
    }

    // Get container's total width and height from getBoundingClientRect()
    const totalWidth = containerRect.width;
    const totalHeight = containerRect.height;

    // Get padding from computed style
    const computedStyle = window.getComputedStyle(container);
    const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
    const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
    const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
    const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;

    // Additional padding from configuration
    const extraPaddingLeft = padding.left || 0;
    const extraPaddingRight = padding.right || 0;
    const extraPaddingTop = padding.top || 0;
    const extraPaddingBottom = padding.bottom || 0;

    // Calculate available space (subtract both computed and configured padding from total dimensions)
    const availableWidth = totalWidth - paddingLeft - paddingRight - extraPaddingLeft - extraPaddingRight;
    const availableHeight = totalHeight - paddingTop - paddingBottom - extraPaddingTop - extraPaddingBottom;

    // Calculate item dimensions maintaining aspect ratio
    // Available space per item (considering gaps)
    const gapWidth = (colNumber - 1) * gap;
    const gapHeight = (rowNumber - 1) * gap;

    const itemWidthByWidth = (availableWidth - gapWidth) / colNumber;
    const itemHeightByWidth = itemWidthByWidth / aspectRatio;

    const itemHeightByHeight = (availableHeight - gapHeight) / rowNumber;
    const itemWidthByHeight = itemHeightByHeight * aspectRatio;

    // Choose the dimension that fits within available space
    let finalWidth: number;
    let finalHeight: number;

    if (itemHeightByWidth <= availableHeight / rowNumber) {
      // Width-based calculation fits
      finalWidth = itemWidthByWidth;
      finalHeight = itemHeightByWidth;
    } else {
      // Height-based calculation fits
      finalWidth = itemWidthByHeight;
      finalHeight = itemHeightByHeight;
    }

    itemStyle.value = {
      width: `${Math.floor(finalWidth)}px`,
      height: `${Math.floor(finalHeight)}px`,
    };
  }

  // Resize observer and window resize handler
  let resizeObserver: ResizeObserver | null = null;

  function setupResizeObserver() {
    if (!containerRef.value) {
      return;
    }

    resizeObserver = new ResizeObserver(() => {
      calculateDimensions();
    });

    resizeObserver.observe(containerRef.value);
  }

  function handleWindowResize() {
    calculateDimensions();
  }

  onMounted(() => {
    nextTick(() => {
      calculateDimensions();
      setupResizeObserver();
      window.addEventListener('resize', handleWindowResize);
    });
  });

  onUnmounted(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    window.removeEventListener('resize', handleWindowResize);
  });

  // Watch dependencies for recalculation
  if (watchDependencies.length > 0) {
    watch(
      watchDependencies,
      () => {
        nextTick(() => {
          calculateDimensions();
        });
      },
      { deep: true },
    );
  }

  return {
    itemStyle,
    calculateDimensions,
  };
}
