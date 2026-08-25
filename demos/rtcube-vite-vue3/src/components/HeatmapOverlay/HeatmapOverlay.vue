<script lang="ts" setup>
/**
 * HeatmapOverlay — Click heatmap visualization overlay.
 *
 * Renders click-count badges on interactive elements using data from
 * heatmapData.ts (mock data, to be replaced by Aegis Open API).
 *
 * Key design decisions:
 * - Badges are inserted as children of target elements so they respect
 *   the same stacking context (z-index, overflow, v-show).
 * - A periodic rescan ensures badges appear even after route changes,
 *   lazy-loaded components, or async DOM mutations.
 * - Uses observerPaused flag to avoid infinite MutationObserver loops.
 *
 * Toggle with Ctrl+Shift+H (Windows/Linux/Mac).
 */
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRoute } from 'vue-router';
import { fetchHeatmapData, type HeatmapDataItem } from './heatmapData';

// Enable via VITE_HEATMAP=true env variable (set by `pnpm dev:heatmap`)
const enabled = ref(import.meta.env.VITE_HEATMAP === 'true');
const totalClicks = ref(0);
const badgeCount = ref(0);
const route = useRoute();
let dataItems: HeatmapDataItem[] = [];
let rescanTimer = 0;
let rafId = 0;
let periodicTimer = 0;
let lastBadgeCount = 0;

const BADGE_ATTR = 'data-heatmap-badge';
// Track elements whose position was modified so we can restore on cleanup
const modifiedPositionEls = new Set<HTMLElement>();

function getHeatColor(percent: number): { color: string; bg: string } {
  if (percent >= 15) return { color: '#dc2626', bg: 'rgba(239,68,68,0.18)' };
  if (percent >= 8) return { color: '#ea580c', bg: 'rgba(234,88,12,0.15)' };
  if (percent >= 4) return { color: '#e45c3a', bg: 'rgba(228,92,58,0.12)' };
  return { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' };
}

/**
 * Check if an element is truly visible in the viewport.
 * Handles v-show (display:none), collapsed parents, zero-size elements.
 */
function isElementVisible(el: HTMLElement): boolean {
  // Fixed elements have null offsetParent but are still visible
  if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') return false;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return false;
  let node: HTMLElement | null = el;
  while (node) {
    const style = getComputedStyle(node);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    node = node.parentElement;
  }
  return true;
}

let observerPaused = false;

function removeAllBadges() {
  observerPaused = true;
  document.querySelectorAll(`[${BADGE_ATTR}]`).forEach(b => b.remove());
  // Restore modified position values
  for (const el of modifiedPositionEls) {
    el.style.position = '';
  }
  modifiedPositionEls.clear();
  badgeCount.value = 0;
  lastBadgeCount = 0;
  // Use microtask to unpause after DOM settles
  Promise.resolve().then(() => { observerPaused = false; });
}

function scanAndRender() {
  if (!enabled.value || dataItems.length === 0) {
    removeAllBadges();
    return;
  }

  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(() => {
    // Pause observer during our own DOM mutations
    observerPaused = true;

    // Remove stale badges
    document.querySelectorAll(`[${BADGE_ATTR}]`).forEach(b => b.remove());

    const total = dataItems.reduce((sum, d) => sum + d.clicks, 0);
    totalClicks.value = total;
    let count = 0;

    for (const item of dataItems) {
      // querySelectorAll to handle multiple matches (e.g., same selector on different pages)
      const elements = document.querySelectorAll(item.selector);
      if (elements.length === 0) continue;

      for (const rawEl of elements) {
        const el = rawEl as HTMLElement;
        if (!isElementVisible(el)) continue;
        // Skip if element already has a badge (e.g., duplicate selectors)
        if (el.querySelector(`[${BADGE_ATTR}]`)) continue;

        const percent = total > 0 ? (item.clicks / total) * 100 : 0;
        const { color, bg } = getHeatColor(percent);

        // Ensure parent has position for absolute child
        const parentStyle = getComputedStyle(el);
        if (parentStyle.position === 'static') {
          el.style.position = 'relative';
          modifiedPositionEls.add(el);
        }

        // Create badge as child of the target element
        const badge = document.createElement('div');
        badge.setAttribute(BADGE_ATTR, '');
        badge.style.cssText = `
          position: absolute;
          inset: 0;
          z-index: 999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${bg};
          border: 1.5px solid ${color};
          border-radius: 4px;
          box-sizing: border-box;
          pointer-events: none;
          overflow: visible;
        `;

        const label = document.createElement('span');
        label.style.cssText = `
          font-size: 11px;
          font-weight: 700;
          color: ${color};
          background: rgba(255,255,255,0.85);
          padding: 1px 6px;
          border-radius: 3px;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Mono', monospace;
          white-space: nowrap;
          line-height: 1.4;
        `;
        label.textContent = `${item.clicks} (${percent.toFixed(1)}%)`;
        badge.title = item.ext1;

        badge.appendChild(label);
        el.appendChild(badge);
        count++;
      }
    }

    badgeCount.value = count;
    lastBadgeCount = count;

    // Unpause observer after next microtask
    Promise.resolve().then(() => { observerPaused = false; });
  });
}

function scheduleRescan() {
  clearTimeout(rescanTimer);
  rescanTimer = window.setTimeout(scanAndRender, 200);
}

function handleKeydown(e: KeyboardEvent) {
  if (e.ctrlKey && e.shiftKey && e.code === 'KeyH') {
    e.preventDefault();
    enabled.value = !enabled.value;
  }
}

// Watch route changes to rescan after navigation
watch(() => route.fullPath, () => {
  if (enabled.value) {
    // Wait for Vue to render the new route's components
    nextTick(() => {
      setTimeout(scanAndRender, 300);
    });
  }
});

watch(enabled, (val) => {
  if (val) {
    nextTick(() => setTimeout(scanAndRender, 200));
  } else {
    removeAllBadges();
  }
});

let observer: MutationObserver | null = null;

onMounted(async () => {
  dataItems = await fetchHeatmapData();

  document.addEventListener('keydown', handleKeydown);
  window.addEventListener('scroll', scheduleRescan, true);
  window.addEventListener('resize', scheduleRescan);

  // Observe DOM changes to re-scan
  observer = new MutationObserver(() => {
    if (observerPaused) return;
    scheduleRescan();
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class'],
  });

  // Initial scan after a short delay for components to mount
  setTimeout(scanAndRender, 500);

  // Periodic rescan to catch lazy-loaded / async components (every 5s)
  periodicTimer = window.setInterval(() => {
    if (enabled.value) {
      const existingBadges = document.querySelectorAll(`[${BADGE_ATTR}]`).length;
      // Only rescan if badge count changed or some items still unmatched
      if (existingBadges !== lastBadgeCount || existingBadges < dataItems.length) {
        scanAndRender();
      }
    }
  }, 5000);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('scroll', scheduleRescan, true);
  window.removeEventListener('resize', scheduleRescan);
  observer?.disconnect();
  cancelAnimationFrame(rafId);
  clearTimeout(rescanTimer);
  clearInterval(periodicTimer);
  removeAllBadges();
});
</script>

<template>
  <Teleport to="body">
    <div v-if="enabled" class="heatmap-indicator">
      🔥 Heatmap
      <span class="heatmap-indicator__total">{{ totalClicks.toLocaleString() }} total clicks · {{ badgeCount }} elements</span>
      <button class="heatmap-indicator__close" @click="enabled = false" title="Close (Ctrl+Shift+H)">✕</button>
    </div>
  </Teleport>
</template>

<style>
.heatmap-indicator {
  position: fixed;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 99999;
  background: #1e293b;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  padding: 6px 16px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  pointer-events: auto;
}

.heatmap-indicator__total {
  font-weight: 400;
  font-size: 12px;
  color: #94a3b8;
}

.heatmap-indicator__close {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 14px;
  padding: 0 2px;
  line-height: 1;
}
.heatmap-indicator__close:hover { color: #fff; }
</style>
