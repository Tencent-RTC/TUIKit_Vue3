export const ERROR_MESSAGE = {
  100412: 'there is no one valid room for battle',
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
