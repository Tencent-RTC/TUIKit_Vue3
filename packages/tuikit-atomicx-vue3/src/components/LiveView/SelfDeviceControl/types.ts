import type { SeatInfo } from '../../../types';

/**
 * Local widening of the public `SeatInfo` contract to expose the two
 * host-driven device-lock flags that the SDK populates at runtime but
 * the (read-only) public interface in `@uikit-core/types/seat` does
 * not yet declare.
 *
 * Producers (`seatEventManager.getNewSeatInfo`) write these fields via
 * a runtime read; consumers (LiveView's local-seat lookup, the
 * self-device control menu) cast through this type to read them
 * without touching the cross-framework public type.
 *
 * TODO: Once the public `SeatInfo` contract in `@uikit-core/types/seat`
 * can be updated, move `isAudioLocked` / `isVideoLocked` onto it
 * directly and remove this helper.
 */
export type SeatInfoWithLocks = SeatInfo & {
  isAudioLocked?: boolean;
  isVideoLocked?: boolean;
};
