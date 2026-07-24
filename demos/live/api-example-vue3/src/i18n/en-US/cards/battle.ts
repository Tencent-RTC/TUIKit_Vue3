// English (en-US) i18n resources — PK Battle state list.
//
// Key set MUST stay identical to `zh-CN/cards/battle.ts`; only the value
// differs. See `menuKey()` / `cardKey()` key derivation in the demo.

export const battle: Record<string, string> = {
  'Card.BattleRequestBattleFieldUserId': "Target user ID",
  'Card.BattleRequestBattleFieldDuration': "config.duration (seconds)",
  'Card.BattleRequestBattleFieldNeedResponse': "config.needResponse",
  'Card.BattleRequestBattleFieldExtensionInfo': "config.extensionInfo",
  'Card.BattleRequestBattleFieldTimeout': "timeout (seconds)",
  'Card.BattleCancelBattleRequestFieldBattleId': "Battle ID",
  'Card.BattleCancelBattleRequestFieldUserId': "Target user ID",
  'Card.BattleAcceptBattleFieldBattleId': "Battle ID",
  'Card.BattleRejectBattleFieldBattleId': "Battle ID",
  'Card.BattleExitBattleFieldBattleId': "Battle ID",
  'Menu.Battle': "PK Battle",
  'Menu.BattleState': "Read PK state (currentBattleInfo / battleUsers / battleScore)",
  'Menu.BattleRequestBattle': "Send PK invite (host only)",
  'Menu.BattleCancelBattleRequest': "Cancel sent PK invite (host only)",
  'Menu.BattleAcceptBattle': "Accept PK invite (host only)",
  'Menu.BattleRejectBattle': "Reject PK invite (host only)",
  'Menu.BattleExitBattle': "Exit PK (host only)",

  // BattleState card
  'Card.BattleStateDesc':
    'Three read-only reactives: snapshot of currentBattleInfo / battleUsers / battleScore state.',
  'Card.BattleStateNoteSummary': 'battle state readout',
  'Card.BattleStateNote0Item0':
    'battleScore (the score) does NOT go through event subscription: the SDK updates the reactive Map internally via onBattleScoreChanged. Just watch(battleScore) on the business side — do NOT subscribe to onBattleScoreChanged (it is not in the BattleEvent enum).',

  // RequestBattle card
  'Card.BattleRequestBattleDesc':
    'Send a PK invite to the remote host that is already cross-room connected.',
  'Card.BattleRequestBattleNoteSummary': 'requestBattle · prerequisites & semantics',
  'Card.BattleRequestBattleNote0Item0':
    'You MUST establish the cross-room connection in the co-host group first: Battle depends on the CoHost link. With no link, the target dropdown is empty and calling directly is immediately judged "disconnected" by the SDK and resetBattleState.',
  'Card.BattleRequestBattleNote0Item1':
    'needResponse decides the response flow: true means the other side must acceptBattle / rejectBattle for it to take effect; false skips the mutual response and starts the PK directly.',
  'Card.BattleRequestBattleFieldUserIdHelp': 'Pick from the remote hosts successfully linked in the co-host group',
  'Card.BattleRequestBattleFieldDurationHelp': 'PK countdown in seconds (auto-ends on expiry)',
  'Card.BattleRequestBattleFieldNeedResponseHelp': 'true = the other side must respond',
  'Card.BattleRequestBattleFieldExtensionInfoPlaceholder': 'Optional; business string relayed to the other side',
  'Card.BattleRequestBattleFieldUserIdOpt': '(Please establish the cross-room link in the co-host group first)',
  'Card.BattleRequestBattleFieldUserIdOptMeta': 'Run co-host.requestHostConnection first + have the other side acceptHostConnection',
  'Card.BattleRequestBattleToastTitle': 'PK invite sent',
  'Card.BattleRequestBattleToastDesc':
    'With needResponse=true the other side triggers onBattleRequestReceived; after responding, this side triggers onBattleRequestAccept / Reject / Timeout',

  // CancelBattleRequest card
  'Card.BattleCancelBattleRequestDesc': 'Cancel the sent PK invite before the other side responds.',
  'Card.BattleCancelBattleRequestNoteSummary': 'cancelBattleRequest · parameter contract',
  'Card.BattleCancelBattleRequestNote0Item0':
    'userIdList MUST exactly match the one passed to requestBattle: cancel is a point-to-point operation; a mismatched userId is silently ignored by the SDK.',
  'Card.BattleCancelBattleRequestFieldBattleIdPlaceholder': 'battleId to cancel',
  'Card.BattleCancelBattleRequestFieldBattleIdHelp': 'Auto-filled; you may override',
  'Card.BattleCancelBattleRequestFieldUserIdPlaceholder': 'Invited remote host userId',
  'Card.BattleCancelBattleRequestToastTitle': 'PK invite canceled',
  'Card.BattleCancelBattleRequestToastDesc': 'The other side triggers onBattleRequestCancelled',

  // AcceptBattle card
  'Card.BattleAcceptBattleDesc': 'Accept the received PK invite.',
  'Card.BattleAcceptBattleFieldBattleIdPlaceholder': 'Auto-filled after receiving the invite',
  'Card.BattleAcceptBattleToastTitle': 'PK accepted',
  'Card.BattleAcceptBattleToastDesc':
    'The SDK triggers onBattleStarted; battleScore starts receiving changes',

  // RejectBattle card
  'Card.BattleRejectBattleDesc': 'Reject the currently received onBattleRequestReceived. The other side triggers onBattleRequestReject.',
  'Card.BattleRejectBattleFieldBattleIdPlaceholder': 'Auto-filled after receiving the invite',
  'Card.BattleRejectBattleToastTitle': 'PK rejected',
  'Card.BattleRejectBattleToastDesc': 'The other side triggers onBattleRequestReject',

  // ExitBattle card
  'Card.BattleExitBattleDesc': 'Actively exit the current PK.',
  'Card.BattleExitBattleNoteSummary': 'exitBattle · exit vs. end semantics',
  'Card.BattleExitBattleNote0Item0':
    'Single-side exit: the caller is no longer counted in the score; the other hosts\' PK continues and the score keeps updating. onBattleEnded is NOT triggered.',
  'Card.BattleExitBattleNote0Item1':
    'All-member exit: only when every participating host calls exitBattle does the SDK judge the PK ended and trigger onBattleEnded with reason = allMemberExit.',
  'Card.BattleExitBattleNote0Item2':
    'Countdown expiry: if nobody exits voluntarily and the countdown hits zero, the SDK auto-ends the PK and triggers onBattleEnded with reason = timeOver.',
  'Card.BattleExitBattleFieldBattleIdPlaceholder': 'Current PK battleId',
  'Card.BattleExitBattleFieldBattleIdHelp': 'Auto-filled; you may override',
  'Card.BattleExitBattleToastTitle': 'Exited PK',
  'Card.BattleExitBattleToastDesc':
    'This side\'s battleUsers updates; the SDK triggers onBattleEnded depending on whether all members exited',

  // subscribeEvent / unsubscribeEvent (shared, generated by buildSubscriptionCards)
  'Card.BattleSubscribeEventDesc':
    'This group subscribes to all [[BattleEvent|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onBattleStarted]] events by default (demo handler; log rows prefixed with `[demo]<eventName>`). '
      + 'If canceled by the unsubscribeEvent card below, you can re-subscribe here by picking "all" or a single event; '
      + 'if the event is already subscribed, this call is an idempotent no-op.',
  'Card.BattleSubscribeEventFieldEventHelp': 'Pick "(all events)" to bulk-subscribe every event',
  'Card.BattleSubscribeEventToastTitle': 'Subscribed',
  'Card.BattleSubscribeEventToastDesc':
    'Next time the event fires, EventLog will also show a log row prefixed with "[demo]"',
  'Card.BattleUnsubscribeEventDesc':
    'Unsubscribe one or all events from [[BattleEvent|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onBattleStarted]]. After unsubscribing, when the event fires again the "[demo] xxx" '
      + 'prefixed log row no longer appears (the unprefixed regular rows are still captured by the site\'s always-on log subscription). '
      + '⚠️ In real integrations the call MUST pass the EXACT SAME handler reference used for subscribeEvent, otherwise the SDK cannot find it and silently fails.',
  'Card.BattleUnsubscribeEventFieldEventHelp': 'Pick "(all events)" to bulk-unsubscribe every event',
  'Card.BattleUnsubscribeEventToastTitle': 'Unsubscribed',
  'Card.BattleUnsubscribeEventToastDesc':
    'Next time the event fires, EventLog will no longer show the "[demo]" prefixed log row',
  // Group intro — verified against BattleState source
  'Card.BattleIntroSummary': 'PK rides on top of the cross-room link; the SDK tallies the score and runs the countdown',
  'Card.BattleIntro0Head': 'Key points',
  'Card.BattleIntro0Item0':
    'PK only owns the score / countdown / start-stop. It does NOT establish or verify the cross-room link — the target userId comes from an already-linked remote host. Always call requestHostConnection in useCoHostState first, then requestBattle.',
  'Card.BattleIntro0Item1':
    'Switching / leaving a live room auto-clears PK state: currentBattleInfo, battleUsers and battleScore are all reset, so the previous room\'s battleId cannot leak into the new room (this is module-level behavior — do NOT reset it yourself via a room watch).',
  'Card.BattleIntro0Item2':
    'This group exposes no reset API; PK state is auto-finalized internally on room switch and on PK end / exit. Your business code does not maintain PK state manually.',
  'Card.BattleIntro1Head': 'Common pitfalls',
  'Card.BattleIntro1Item0':
    'The score is NOT something you write: the SDK\'s onBattleScoreChanged writes battleScore directly. It is NOT in the BattleEvent enum, so subscribeEvent never fires for it — watch(battleScore) instead.',
  'Card.BattleIntro1Item1':
    'The remaining seconds are NOT a standalone ref: the demo computes endTime − now on the fly; endTime is the real authoritative end timestamp.',
  'Card.BattleIntro1Item2':
    'A single-side exit does NOT end the PK: onBattleEnded fires only when all participating hosts exit or the countdown hits zero. After YOUR exit, the others\' PK continues and the score keeps updating.',
};
