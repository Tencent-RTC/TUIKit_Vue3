import { computed, type Ref } from 'vue';

// Default reference seat short side (px) at which the scale equals 1. Seats
// whose short side is >= this stay 1:1; smaller seats shrink proportionally.
// Tuned to the widgets' actual footprint so reasonably sized seats are not
// scaled down unnecessarily.
const DEFAULT_WIDGET_SCALE_BASE = 120;

export interface WidgetScaleOptions {
  // Reference seat short side (px) at which the scale equals 1.
  base?: number;
  // Lower bound to keep widgets readable on tiny seats.
  min?: number;
}

// Derive a uniform scale factor from a seat size so overlay widgets shrink
// proportionally on small seats instead of being clipped by ellipsis or
// overflowing the seat region. Returns 1 when the size is unknown.
export function useWidgetScale(
  size: Ref<{ width: number; height: number }>,
  options: WidgetScaleOptions = {},
) {
  return computed(() => getWidgetScale(size.value, options));
}

// Imperative variant for cases where the size comes from a v-for item rather
// than a reactive ref (e.g. per-seat regions provided by the parent layout).
export function getWidgetScale(
  size: { width: number; height: number },
  options: WidgetScaleOptions = {},
) {
  const { base = DEFAULT_WIDGET_SCALE_BASE, min = 0.6 } = options;
  const minSide = Math.min(size.width, size.height);
  if (!minSide || Number.isNaN(minSide)) {
    return 1;
  }
  return Math.max(min, Math.min(1, minSide / base));
}
