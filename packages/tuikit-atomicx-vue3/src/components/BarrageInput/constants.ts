export const ERROR_MESSAGE = {
  10017: 'BarrageInput.youHaveBeenMuted',
  // Server-side moderation rejected the message because the text contains
  // sensitive content (e.g. forbidden keywords). Surfaced as a TUIToast
  // error in BarrageInput / TextEditor so the user knows the message was
  // not delivered to the room.
  80001: 'BarrageInput.sensitiveContent',
  // Server-side moderation rejected the message because attached media
  // (image / audio / video) contains sensitive content. Distinct from
  // 80001 (text) so the toast can tell the user which part was rejected.
  80004: 'BarrageInput.sensitiveMediaContent',
};
