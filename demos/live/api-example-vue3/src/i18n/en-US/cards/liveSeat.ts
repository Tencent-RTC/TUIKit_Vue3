// English (en-US) i18n resources — LiveSeatState example group.
// Key set MUST stay identical to `zh-CN/cards/liveSeat.ts`; only the value
// differs. See `menuKey()` / `cardKey()` key derivation in the demo.

export const liveSeat: Record<string, string> = {
  // Menu
  'Menu.LiveSeat': 'Seat management',
  'Menu.LiveSeatState': 'Read seat state (seatList / canvas / speakingUsers / networkQualities / avStatistics)',
  'Menu.LiveSeatTakeSeat': 'Take seat',
  'Menu.LiveSeatLeaveSeat': 'Leave seat',
  'Menu.LiveSeatLockSeat': 'Lock seat (host / admin)',
  'Menu.LiveSeatUnlockSeat': 'Unlock seat (host / admin)',
  'Menu.LiveSeatKickUserOutOfSeat': 'Kick user off seat (host / admin)',
  'Menu.LiveSeatMoveUserToSeat': 'Move user to seat (host / admin)',
  'Menu.LiveSeatOpenRemoteCamera': 'Open remote camera — admin unlock (host / admin)',
  'Menu.LiveSeatCloseRemoteCamera': 'Close remote camera (host / admin)',
  'Menu.LiveSeatOpenRemoteMicrophone': 'Open remote microphone — admin unlock (host / admin)',
  'Menu.LiveSeatCloseRemoteMicrophone': 'Close remote microphone (host / admin)',
  'Menu.LiveSeatMuteMicrophone': 'Mute local microphone',
  'Menu.LiveSeatUnmuteMicrophone': 'Unmute local microphone',
  'Menu.LiveSeatStartPlayStream': 'Start play stream',
  'Menu.LiveSeatStopPlayStream': 'Stop play stream',
  'Menu.LiveSeatSubscribeEvent': 'Subscribe to LiveSeatEvent',
  'Menu.LiveSeatUnsubscribeEvent': 'Unsubscribe from LiveSeatEvent',

  // state card
  'Card.LiveSeatStateDesc':
    'Reactive snapshot of the seat layout, canvas, speaking users, network quality, and AV statistics.',

  // takeSeat card
  'Card.LiveSeatTakeSeatDesc':
    'Host and admin directly take a seat without application. For audience and admin, [[applyForSeat|applyForSeat]] is recommended instead (sends an application the host or admin must approve).',
  'Card.LiveSeatTakeSeatFieldSeatIndex': 'seatIndex',
  'Card.LiveSeatTakeSeatToastTitle': 'Seat taken',
  'Card.LiveSeatTakeSeatToastDesc': 'You are now on seat #${seatIndex}',

  // leaveSeat card
  'Card.LiveSeatLeaveSeatDesc':
    'Leave the current seat. Releases the seat for other users.',
  'Card.LiveSeatLeaveSeatToastTitle': 'Left seat',
  'Card.LiveSeatLeaveSeatToastDesc': 'You have left the seat',

  // lockSeat card
  'Card.LiveSeatLockSeatDesc':
    'Lock a seat so users cannot take it. Host / admin only.',
  'Card.LiveSeatLockSeatFieldSeatIndex': 'seatIndex',
  'Card.LiveSeatLockSeatToastTitle': 'Seat locked',
  'Card.LiveSeatLockSeatToastDesc': 'Seat #${seatIndex} is now locked',

  // unlockSeat card
  'Card.LiveSeatUnlockSeatDesc':
    'Unlock a previously locked seat. Host / admin only.',
  'Card.LiveSeatUnlockSeatFieldSeatIndex': 'seatIndex',
  'Card.LiveSeatUnlockSeatToastTitle': 'Seat unlocked',
  'Card.LiveSeatUnlockSeatToastDesc': 'Seat #${seatIndex} is now unlocked',

  // kickUserOutOfSeat card
  'Card.LiveSeatKickUserOutOfSeatDesc':
    'Forcefully remove a user from their seat. Host / admin only.',
  'Card.LiveSeatKickUserOutOfSeatFieldUserId': 'userId',
  'Card.LiveSeatKickUserOutOfSeatToastTitle': 'User kicked',
  'Card.LiveSeatKickUserOutOfSeatToastDesc': 'The user has been removed from their seat',

  // moveUserToSeat card
  'Card.LiveSeatMoveUserToSeatDesc':
    'Move a user to a different seat with a conflict policy. Host / admin only.',
  'Card.LiveSeatMoveUserToSeatFieldUserId': 'userId',
  'Card.LiveSeatMoveUserToSeatFieldTargetIndex': 'targetIndex',
  'Card.LiveSeatMoveUserToSeatFieldPolicy': 'policy',
  // Option values are MoveSeatPolicy enum numbers (0/1/2); cardKey uses String(value).
  'Card.LiveSeatMoveUserToSeatFieldPolicyOpt0': 'AbortWhenOccupied',
  'Card.LiveSeatMoveUserToSeatFieldPolicyOpt0Meta': 'Abort if target seat is occupied',
  'Card.LiveSeatMoveUserToSeatFieldPolicyOpt1': 'ForceReplace',
  'Card.LiveSeatMoveUserToSeatFieldPolicyOpt1Meta': 'Force replace user on target seat',
  'Card.LiveSeatMoveUserToSeatFieldPolicyOpt2': 'SwapPosition',
  'Card.LiveSeatMoveUserToSeatFieldPolicyOpt2Meta': 'Swap positions with user on target seat',
  'Card.LiveSeatMoveUserToSeatToastTitle': 'User moved',
  'Card.LiveSeatMoveUserToSeatToastDesc': 'The user has been moved to the target seat',

  // openRemoteCamera card
  'Card.LiveSeatOpenRemoteCameraDesc':
    "Unlock a seated user's camera so they can turn it on. Host / admin only.",
  'Card.LiveSeatOpenRemoteCameraFieldUserId': 'userId',
  'Card.LiveSeatOpenRemoteCameraToastTitle': 'Camera unlocked',
  'Card.LiveSeatOpenRemoteCameraToastDesc': "The user can now turn on their camera",

  // closeRemoteCamera card
  'Card.LiveSeatCloseRemoteCameraDesc':
    "Forcefully close a seated user's camera. Host / admin only.",
  'Card.LiveSeatCloseRemoteCameraFieldUserId': 'userId',
  'Card.LiveSeatCloseRemoteCameraToastTitle': 'Camera closed',
  'Card.LiveSeatCloseRemoteCameraToastDesc': "The user's camera has been closed",

  // openRemoteMicrophone card
  'Card.LiveSeatOpenRemoteMicrophoneDesc':
    "Unlock a seated user's microphone so they can turn it on. Host / admin only.",
  'Card.LiveSeatOpenRemoteMicrophoneFieldUserId': 'userId',
  'Card.LiveSeatOpenRemoteMicrophoneToastTitle': 'Microphone unlocked',
  'Card.LiveSeatOpenRemoteMicrophoneToastDesc': "The user can now turn on their microphone",

  // closeRemoteMicrophone card
  'Card.LiveSeatCloseRemoteMicrophoneDesc':
    "Forcefully close a seated user's microphone. Host / admin only.",
  'Card.LiveSeatCloseRemoteMicrophoneFieldUserId': 'userId',
  'Card.LiveSeatCloseRemoteMicrophoneToastTitle': 'Microphone closed',
  'Card.LiveSeatCloseRemoteMicrophoneToastDesc': "The user's microphone has been closed",

  // muteMicrophone card
  'Card.LiveSeatMuteMicrophoneDesc':
    'Mute your own microphone while on seat. Only affects local audio.',
  'Card.LiveSeatMuteMicrophoneToastTitle': 'Microphone muted',
  'Card.LiveSeatMuteMicrophoneToastDesc': 'Your microphone is now muted',

  // unmuteMicrophone card
  'Card.LiveSeatUnmuteMicrophoneDesc':
    'Unmute your own microphone while on seat.',
  'Card.LiveSeatUnmuteMicrophoneToastTitle': 'Microphone unmuted',
  'Card.LiveSeatUnmuteMicrophoneToastDesc': 'Your microphone is now active',

  // startPlayStream card
  'Card.LiveSeatStartPlayStreamDesc':
    'Start playing the live mix-stream into a video container.',
  'Card.LiveSeatStartPlayStreamFieldView': 'view (container id)',
  'Card.LiveSeatStartPlayStreamToastTitle': 'Stream started',
  'Card.LiveSeatStartPlayStreamToastDesc': 'The live stream is now playing',

  // stopPlayStream card
  'Card.LiveSeatStopPlayStreamDesc':
    'Stop playing the live mix-stream.',
  'Card.LiveSeatStopPlayStreamToastTitle': 'Stream stopped',
  'Card.LiveSeatStopPlayStreamToastDesc': 'The live stream has been stopped',

  // subscribe / unsubscribe (shared, generated by buildSubscriptionCards)
  'Card.LiveSeatSubscribeEventDesc':
    'This group subscribes to all [[LiveSeatEvent|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onLocalCameraOpenedByAdmin]] events by default (demo handler; log rows prefixed with `[demo]<eventName>`). '
    + 'If a card below ([[unsubscribeEvent|live-seat.unsubscribeEvent]]) canceled it, you can re-subscribe here by picking "all" or a single event; '
    + 'if the event is already subscribed, this call is an idempotent no-op.',
  'Card.LiveSeatSubscribeEventFieldEventHelp': 'Pick "(all events)" to bulk-subscribe every event',
  'Card.LiveSeatSubscribeEventToastTitle': 'Subscribed',
  'Card.LiveSeatSubscribeEventToastDesc':
    'Next time the event fires, EventLog will also show a log row prefixed with "[demo]"',
  'Card.LiveSeatUnsubscribeEventDesc':
    'Unsubscribe one or all events from [[LiveSeatEvent|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onLocalCameraOpenedByAdmin]]. After unsubscribing, when the event fires again the "[demo] xxx" '
    + 'prefixed log row no longer appears (the unprefixed regular rows are still captured by the site\'s always-on log subscription). '
    + '⚠️ In real integrations the call MUST pass the EXACT SAME handler reference used for subscribeEvent, otherwise the SDK cannot find it and silently fails.',
  'Card.LiveSeatUnsubscribeEventFieldEventHelp': 'Pick "(all events)" to bulk-unsubscribe every event',
  'Card.LiveSeatUnsubscribeEventToastTitle': 'Unsubscribed',
  'Card.LiveSeatUnsubscribeEventToastDesc':
    'Next time the event fires, EventLog will no longer show the "[demo]" prefixed log row',

  // Group intro — verified against LiveSeatState source
  'Card.LiveSeatIntroSummary': 'Seat lifecycle, admin device controls, and local mic mute',
  'Card.LiveSeatIntro0Head': 'Key points',
  'Card.LiveSeatIntro0Item0':
    'All seat operations require being in a room (currentLive.liveId non-empty); calling outside a room throws.',
  'Card.LiveSeatIntro0Item1':
    'takeSeat is for host/admin direct seat-grab; audience co-broadcast uses useCoGuestState.applyForSeat (which sends an application the host must accept).',
  'Card.LiveSeatIntro0Item2':
    'lockSeat / unlockSeat / kickUserOutOfSeat / moveUserToSeat / openRemoteCamera / closeRemoteCamera / openRemoteMicrophone / closeRemoteMicrophone are host/admin-only; the SDK rejects general users with a permission error.',
  'Card.LiveSeatIntro0Item3':
    'seatList / canvas are updated automatically by the SDK via onSeatLayoutChanged — you never push into them manually.',
  'Card.LiveSeatIntro0Item4':
    'speakingUsers and networkQualities are Map<string, number> / Map<string, NetworkInfo> updated in real-time by SDK events.',
};
