/**
 * Seat Layout Mapper Utility
 * @module seatLayoutMapper
 * @description Converts SeatLayoutTemplate to API request parameters
 */
import { SeatLayoutTemplate } from '../types/live';

/**
 * Seat layout request parameters for API call
 */
export interface SeatLayoutRequestParams {
  isSeatEnabled: boolean;
  isUnlimited: boolean;
  maxSeatCount?: number;
  seatLayoutTemplateId: number;
  keepOwnerOnSeat: boolean;
}

/**
 * Template mapping configuration
 */
const TEMPLATE_MAP: Record<number, SeatLayoutRequestParams> = {
  [SeatLayoutTemplate.VideoDynamicGrid9Seats]: {
    isSeatEnabled: true,
    isUnlimited: true,
    maxSeatCount: undefined,
    seatLayoutTemplateId: 600,
    keepOwnerOnSeat: true,
  },
  [SeatLayoutTemplate.VideoDynamicFloat7Seats]: {
    isSeatEnabled: true,
    isUnlimited: true,
    maxSeatCount: undefined,
    seatLayoutTemplateId: 601,
    keepOwnerOnSeat: true,
  },
  [SeatLayoutTemplate.VideoFixedGrid9Seats]: {
    isSeatEnabled: true,
    isUnlimited: true,
    maxSeatCount: undefined,
    seatLayoutTemplateId: 800,
    keepOwnerOnSeat: true,
  },
  [SeatLayoutTemplate.VideoFixedFloat7Seats]: {
    isSeatEnabled: true,
    isUnlimited: true,
    maxSeatCount: undefined,
    seatLayoutTemplateId: 801,
    keepOwnerOnSeat: true,
  },
  [SeatLayoutTemplate.VideoLandscape4Seats]: {
    isSeatEnabled: true,
    isUnlimited: true,
    maxSeatCount: undefined,
    seatLayoutTemplateId: 200,
    keepOwnerOnSeat: true,
  },
};

/**
 * Convert SeatLayoutTemplate to request parameters
 * @param template - Seat layout template
 * @returns Request parameters for API call
 * @example
 * ```typescript
 * const params = mapSeatLayoutToParams(SeatLayoutTemplate.VideoDynamicGrid9Seats);
 * ```
 */
export function mapSeatLayoutToParams(template: SeatLayoutTemplate): SeatLayoutRequestParams {
  const params = TEMPLATE_MAP[template];
  if (!params) {
    console.warn(`[seatLayoutMapper] Unknown template: ${template}, using default VideoLandscape4Seats`);
    return TEMPLATE_MAP[SeatLayoutTemplate.VideoLandscape4Seats];
  }
  return { ...params };
}
