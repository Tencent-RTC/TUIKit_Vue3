/**
 * Copyright (c) 2025 Tencent. All rights reserved.
 * Module:   MusicState @ uikit-component-vue3-electron (AtomicX-Vue3-Electron)
 * Function: BGM playback related types, mirroring the cross-platform
 *           `MusicStore` AtomicXCore contract for the Electron renderer.
 *
 * @see ../../states/MusicState/MusicState.ts for the implementation.
 */

import type { Ref } from 'vue';

/**
 * Music playback status.
 *
 * Describes the current playback state of the music player.
 *
 * | Status    | Value | Description                                       |
 * |-----------|-------|---------------------------------------------------|
 * | `Idle`    | 0     | Idle, not playing                                 |
 * | `Playing` | 1     | Playing                                           |
 * | `Paused`  | 2     | Paused                                            |
 * | `Loading` | 3     | Loading (e.g. buffering a network resource)       |
 */
export enum MusicPlayStatus {
  /** Idle, not playing. */
  Idle = 0,
  /** Playing. */
  Playing = 1,
  /** Paused. */
  Paused = 2,
  /** Loading (e.g. buffering a network resource). */
  Loading = 3,
}

/**
 * One-shot music playback event identifiers (kept as string literals so
 * payloads remain self-describing when serialized through IPC).
 */
export enum MusicEvent {
  /** Music playback completed normally. */
  onPlayCompleted = 'onPlayCompleted',
  /** Music playback failed. The payload carries the raw TRTC error code; the
   *  caller can look up a human-readable message via {@link MusicErrorCode}. */
  onPlayError = 'onPlayError',
}

/**
 * Discriminated payload map for {@link MusicEvent}. Use as
 * `MusicEventPayload[MusicEvent.onPlayError]` to get the strongly-typed shape.
 */
export interface MusicEventPayload {
  [MusicEvent.onPlayCompleted]: {
    /** The URL whose playback just completed. */
    url: string;
  };
  [MusicEvent.onPlayError]: {
    /** The URL whose playback failed. */
    url: string;
    /** Raw TRTC SDK error code. See {@link MusicErrorCode}. */
    code: number;
  };
}

/**
 * Strongly-typed callback for a particular {@link MusicEvent}.
 */
export type MusicEventCallback<E extends MusicEvent> = (payload: MusicEventPayload[E]) => void;

/**
 * Music playback error codes passed through from the underlying TRTC SDK on
 * {@link MusicEvent.onPlayError}. Kept in sync with the cross-platform
 * `MusicStore` definition (Android/iOS/Flutter).
 *
 * | Code   | Name                          | Description                                                                         |
 * |--------|-------------------------------|-------------------------------------------------------------------------------------|
 * | `0`    | `Success`                     | Operation succeeded                                                                 |
 * | -4001  | `OpenFailed`                  | Failed to open file: invalid audio data or FFMPEG protocol not found                |
 * | -4002  | `DecodeFailed`                | Audio file decoding failed: file may be corrupted or encoding format unrecognized   |
 * | -4003  | `OverLimit`                   | Number of preloaded music exceeded the limit                                        |
 * | -4004  | `InvalidOperation`            | Invalid operation, e.g. calling preload during playback                             |
 * | -4005  | `InvalidPath`                 | Invalid path: please check whether the file path points to a valid music file      |
 * | -4006  | `InvalidUrl`                  | Invalid URL: please ensure the URL is reachable (iOS / Mac requires HTTPS)         |
 * | -4007  | `NoAudioStream`               | No audio stream: please confirm the file is a valid, non-corrupted audio file       |
 * | -4008  | `FormatNotSupported`          | Unsupported format. Desktop supports: mp3, aac, m4a, wav, mp4, mkv                  |
 * | -4009  | `ConcurrentBgmOverLimit`      | Number of concurrent BGM playback exceeded the limit (max 10)                       |
 */
export enum MusicErrorCode {
  /** Operation succeeded. */
  Success = 0,
  /** Failed to open file: invalid audio data or FFMPEG protocol not found. */
  OpenFailed = -4001,
  /** Audio file decoding failed: file may be corrupted or encoding format unrecognized. */
  DecodeFailed = -4002,
  /** Number of preloaded music exceeded the limit. */
  OverLimit = -4003,
  /** Invalid operation, e.g. calling preload during playback. */
  InvalidOperation = -4004,
  /** Invalid path: please check whether the file path points to a valid music file. */
  InvalidPath = -4005,
  /** Invalid URL: please ensure the URL is reachable (iOS / Mac requires HTTPS). */
  InvalidUrl = -4006,
  /** No audio stream: please confirm the file is a valid, non-corrupted audio file. */
  NoAudioStream = -4007,
  /** Unsupported format. Desktop supports: mp3, aac, m4a, wav, mp4, mkv. */
  FormatNotSupported = -4008,
  /** Number of concurrent BGM playback exceeded the limit (max 10). */
  ConcurrentBgmOverLimit = -4009,
}

/**
 * Reactive BGM playback state, exposed as a Vue 3 hook contract.
 *
 * This is the Electron-side counterpart of the cross-platform
 * `MusicStore` (see Kotlin / Swift / Dart implementations). The Electron
 * variant differs from the mobile variant in two important ways:
 *
 * 1. **App-level singleton, not room-bound.** The mobile `MusicStore.create(liveID)`
 *    couples the store's lifecycle to a live room, requiring `enterRoom` before
 *    BGM can play. The Electron variant intentionally keeps `MusicState`
 *    available right after login so streamers can audition / tune BGM
 *    *before* going live (the OBS-style desktop workflow). Entering a room
 *    transparently picks up the in-flight playback for remote publishing.
 *
 * 2. **Pitch range.** Mobile uses semitones in `[-12, 12]`; the Electron
 *    TRTC SDK natively uses `[-1.0, 1.0]`. The Electron API surface keeps the
 *    SDK-native range and documents the difference rather than silently
 *    converting, to avoid surprising users who already know the SDK.
 *
 * ## Property Overview
 *
 * | Property        | Type                                | Description                                |
 * |-----------------|-------------------------------------|--------------------------------------------|
 * | `playURL`       | `Ref<string \| null>`               | Currently playing URL; `null` when idle    |
 * | `playStatus`    | `Ref<MusicPlayStatus>`              | Current playback status                    |
 * | `playProgress`  | `Ref<number>` (ms)                  | Current playback progress in milliseconds  |
 * | `totalDuration` | `Ref<number>` (ms)                  | Total duration in milliseconds; 0=unknown  |
 * | `musicVolume`   | `Ref<number>` (0–100)               | BGM volume; default 60                     |
 * | `musicPitch`    | `Ref<number>` (-1.0 – 1.0)          | Pitch shift; default 0                     |
 *
 * ## Topics
 *
 * ### Observing State and Events
 * - {@link IMusicState.subscribeEvent} / {@link IMusicState.unsubscribeEvent}
 *
 * ### Playback Control
 * - {@link IMusicState.startPlay}, {@link IMusicState.pausePlay},
 *   {@link IMusicState.resumePlay}, {@link IMusicState.stopPlay},
 *   {@link IMusicState.seek}
 *
 * ### Playback Parameters
 * - {@link IMusicState.setMusicVolume}, {@link IMusicState.setPitch}
 *
 * @see MusicPlayStatus
 * @see MusicEvent
 * @see MusicErrorCode
 */
export interface IMusicState {
  /** Currently playing URL; `null` when no music is playing. */
  playURL: Ref<string | null>;
  /** Current playback status. */
  playStatus: Ref<MusicPlayStatus>;
  /** Current playback progress in milliseconds. */
  playProgress: Ref<number>;
  /** Total duration of the current track in milliseconds; `0` means unknown
   *  (network resources typically have this filled in by the SDK after the
   *  first `onPlayProgress` callback). */
  totalDuration: Ref<number>;
  /** BGM volume, range `0` – `100`; default `60`. */
  musicVolume: Ref<number>;
  /** Pitch shift, range `-1.0` – `1.0`; default `0`. ⚠️ Different from the
   *  mobile `MusicStore.setPitch(-12 ~ 12)` semitone range — this property
   *  preserves the underlying TRTC Electron SDK's native unit. */
  musicPitch: Ref<number>;

  /**
   * Start playing music.
   *
   * If a track is already playing, the SDK is asked to stop the previous one
   * first (atomic switch). Status transitions to {@link MusicPlayStatus.Loading}
   * immediately and to {@link MusicPlayStatus.Playing} once playback actually
   * starts. On failure, the `Promise` rejects synchronously **and** the
   * {@link MusicEvent.onPlayError} event is dispatched with the raw TRTC error
   * code — see {@link MusicErrorCode}.
   *
   * @param url Local absolute path or HTTP/HTTPS URL.
   */
  startPlay: (url: string) => Promise<void>;

  /** Pause playback. Status moves to {@link MusicPlayStatus.Paused}. */
  pausePlay: () => Promise<void>;

  /** Resume from the paused position. Status moves back to
   *  {@link MusicPlayStatus.Playing}. */
  resumePlay: () => Promise<void>;

  /** Stop playback completely (resets the playback position to 0). Status
   *  moves to {@link MusicPlayStatus.Idle}. */
  stopPlay: () => Promise<void>;

  /**
   * Seek to a specific time position in the currently playing track.
   *
   * @param positionMs Target playback position in milliseconds. Out-of-range
   *                   values are clamped by the SDK.
   */
  seek: (positionMs: number) => Promise<void>;

  /**
   * Set BGM volume. Applied to both local playback and remote publishing
   * channels for a consistent listening experience on the host and audience
   * sides.
   *
   * @param volume Volume in the `0` – `100` range. Out-of-range inputs are
   *               clamped.
   */
  setMusicVolume: (volume: number) => Promise<void>;

  /**
   * Set the pitch shift for the currently playing track.
   *
   * @param pitch Pitch shift in the `-1.0` – `1.0` range (TRTC Electron SDK
   *              native unit). Positive values raise the pitch, negative
   *              values lower it. Note: this differs from the mobile
   *              `MusicStore` which uses semitones (`-12` – `12`).
   */
  setPitch: (pitch: number) => Promise<void>;

  /**
   * Subscribe to a {@link MusicEvent}. Multiple callbacks per event are
   * supported. The same callback registered twice is deduplicated.
   */
  subscribeEvent: <E extends MusicEvent>(event: E, callback: MusicEventCallback<E>) => void;

  /**
   * Unsubscribe a previously registered callback. A no-op if the callback
   * was not subscribed.
   */
  unsubscribeEvent: <E extends MusicEvent>(event: E, callback: MusicEventCallback<E>) => void;
}
