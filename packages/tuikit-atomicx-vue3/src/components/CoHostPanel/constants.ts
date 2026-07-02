export const ERROR_MESSAGE = {
  100412: 'there is no one valid room for battle',
};

/**
 * Maps co-host connection error codes (rejected by the SDK as a `TUIError`)
 * to i18n keys, so failures surface a meaningful toast instead of only logs.
 *
 * - 100402: the sponsor room is still in pending status, i.e. the local host
 *   already has an unhandled connection request and cannot initiate a new one.
 */
export const CONNECTION_ERROR_MESSAGE = {
  100402: 'Send co-host request failed, you have a pending invitation to handle',
};

/**
 * Default timeout (in seconds) for outbound co-host connection invitations
 * dispatched via `requestHostConnection`. The same value is mirrored into
 * `extensionInfo` so the invitee can render a matching countdown.
 */
export const COHOST_REQUEST_TIMEOUT_SECONDS = 30;

/**
 * Default timeout (in seconds) for outbound battle (PK) invitations
 * dispatched via `requestBattle`. Kept as a separate constant from
 * `COHOST_REQUEST_TIMEOUT_SECONDS` so the two flows can diverge later
 * without affecting each other.
 */
export const BATTLE_REQUEST_TIMEOUT_SECONDS = 30;
