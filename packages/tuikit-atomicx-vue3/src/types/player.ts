/**
 * @module PlayerType
 * @description Player-related type definitions for Vue3
 *
 * Re-exports framework-agnostic types from uikit-core and provides Vue3-specific type aliases.
 */
import { Component, CSSProperties, VNode } from 'vue';

// ============ Re-exports from uikit-core ============
export {
  PlayerControlButton,
  PlayerControlEvent,
} from '@uikit-core/types/livePlayer';

export type {
  Resolution,
  FullscreenResult,
  ButtonStateBase,
  CustomButtonPosition,
  CustomButtonBase,
  PlayerControlEventMap,
  PlayerControlEventCallback,
  ILivePlayerStateReturn,
} from '@uikit-core/types/livePlayer';

// Import for local type definitions
import type { PlayerControlButton } from '@uikit-core/types/livePlayer';

// ============ Vue3-specific Types ============

/** Vue3-specific icon component type */
type Vue3Icon = Component | (() => VNode);

/**
 * Button state type definition (Vue3-specific)
 * @interface ButtonState
 * @description Button state configuration with Vue3 Component icons.
 * @example
 * const state: ButtonState = {
 *   visible: true,
 *   disabled: false,
 *   tooltip: 'Play',
 * };
 */
export type ButtonState = {
  /** Whether the button is visible */
  visible: boolean;
  /** Whether the button is disabled */
  disabled: boolean;
  /**
   * Custom icon component for default (inactive) state.
   * - Play button: Displayed when playing ("pause" icon, visible by default when entering live room).
   * - Volume button: Displayed when not muted.
   * - PictureInPicture button: Displayed when not in picture-in-picture mode.
   * - Fullscreen button: Displayed when not in fullscreen mode.
   */
  icon?: Vue3Icon;
  /**
   * Custom icon component for active (clicked/toggled) state.
   * - Play button: Displayed when paused ("play" icon, shown after user clicks pause).
   * - Volume button: Displayed when muted.
   * - PictureInPicture button: Displayed when in picture-in-picture mode.
   * - Fullscreen button: Displayed when in fullscreen mode.
   */
  activeIcon?: Vue3Icon;
  /** Tooltip text shown on hover */
  tooltip?: string;
};

/**
 * Player control buttons collection type (Vue3-specific)
 * @interface PlayerControlButtons
 * @description Maps each PlayerControlButton to its ButtonState.
 * @example
 * const { buttons } = useLivePlayerState();
 * const isPlayVisible = buttons[PlayerControlButton.Play].visible;
 */
export type PlayerControlButtons = Record<PlayerControlButton, ButtonState>;

/**
 * Custom button type definition (Vue3-specific)
 * @interface CustomButton
 * @description Custom button configuration with Vue3 Component icons and CSSProperties.
 * @example
 * const { addCustomButtons } = useLivePlayerState();
 *
 * const likeButton: CustomButton = {
 *   id: 'like',
 *   icon: LikeIcon,
 *   onClick: () => console.log('liked'),
 *   tooltip: 'Like',
 *   position: { anchor: PlayerControlButton.Play, position: 'after' },
 * };
 *
 * addCustomButtons([likeButton]);
 */
export type CustomButton = {
  /** Unique identifier for the custom button */
  id: string;
  /** Button icon component or render function */
  icon: Vue3Icon;
  /** Click handler function, supports sync and async functions */
  onClick: () => void | Promise<void>;
  /** Tooltip text shown on hover */
  tooltip?: string;
  /** Whether the button is visible (default: true) */
  visible?: boolean;
  /** Whether the button is disabled (default: false) */
  disabled?: boolean;
  /**
   * Button position configuration:
   * - 'start' | 'end': Add to control bar ends (most common)
   * - { slot: 'left' | 'center' | 'right' }: Place in logical area
   * - { anchor: PlayerControlButton, position: 'before' | 'after' }: Relative to existing button
   * @default 'end'
   */
  position?:
    | 'start'
    | 'end'
    | { slot: 'left' | 'center' | 'right' }
    | { anchor: PlayerControlButton; position: 'before' | 'after' };
  /** Additional CSS class name */
  className?: string;
  /** Inline CSS styles */
  style?: CSSProperties;
};
