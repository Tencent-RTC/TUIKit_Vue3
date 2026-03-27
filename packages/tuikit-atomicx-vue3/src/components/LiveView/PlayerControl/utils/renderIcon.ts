import { h } from 'vue';
import type { Component, VNode } from 'vue';

/**
 * Render a user-provided icon override for a built-in player control button.
 * Accepts both Vue components and render functions (() => VNode).
 *
 * @param icon - Vue component or render function to render as the icon.
 * @param size - Icon size in pixels. Defaults to 20.
 * @returns A VNode representing the rendered icon.
 */
export const renderButtonIcon = (icon: Component | (() => any), size: number = 20): VNode => h(icon as any, {
  class: 'btn-icon',
  size,
});
