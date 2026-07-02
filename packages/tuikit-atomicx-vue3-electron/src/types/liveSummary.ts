import type { DeepReadonly, Ref } from 'vue';

/**
 * Live summary statistics.
 *
 * Mirrors the underlying TUILiveStatisticsData fields.
 */
export interface LiveSummaryData {
  /** Cumulative live duration in seconds. */
  totalDuration: number;
  /** Total viewers received from the SDK statistics event. */
  totalViewers: number;
  /** Total gifts sent. */
  totalGiftsSent: number;
  /** Total unique gift senders. */
  totalGiftUniqueSenders: number;
  /** Total gift coins. */
  totalGiftCoins: number;
  /** Total likes received. */
  totalLikesReceived: number;
  /** Total messages sent. */
  totalMessageSent: number;
}

/**
 * Return contract of `useLiveSummaryState()`.
 */
export interface ILiveSummaryState {
  /**
   * Reactive live summary statistics. Exposed as `DeepReadonly` so the
   * underlying singleton cannot be mutated from the outside; mutations
   * must go through the store, which in turn keeps the SDK state and the
   * local timer-driven duration in sync.
   *
   * The store updates this whenever the SDK emits
   * `onLiveStatisticsChanged`, and ticks `totalDuration` every second
   * while the user is in a live.
   */
  summaryData: DeepReadonly<Ref<LiveSummaryData>>;
}
