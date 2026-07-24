// English (en-US) i18n resources — Host Cross-room Link state list.
//
// Key set MUST stay identical to `zh-CN/cards/coHost.ts`; only the value
// differs. See `menuKey()` / `cardKey()` key derivation in the demo.

export const coHost: Record<string, string> = {
  'Card.CoHostGetCoHostCandidatesFieldCursor': "Cursor",
  'Card.CoHostRequestHostConnectionFieldLiveId': "target liveId",
  'Card.CoHostRequestHostConnectionFieldLayoutTemplate': "layoutTemplate",
  'Card.CoHostRequestHostConnectionFieldTimeout': "timeout (seconds)",
  'Card.CoHostRequestHostConnectionFieldExtensionInfo': "extensionInfo",
  'Card.CoHostCancelHostConnectionFieldLiveId': "target liveId",
  'Card.CoHostAcceptHostConnectionFieldLiveId': "inviter liveId",
  'Card.CoHostRejectHostConnectionFieldLiveId': "inviter liveId",
  'Card.CoHostMuteRemoteHostAudioFieldLiveId': "remote host liveId",
  'Card.CoHostMuteRemoteHostAudioFieldIsMuted': "isMuted",
  'Menu.CoHost': "Host Cross-room Link",
  'Menu.CoHostState': "Read cross-room link state (coHostStatus / connected / applicant / invitees / candidates)",
  'Menu.CoHostGetCoHostCandidates': "Fetch connectable host candidates",
  'Menu.CoHostRequestHostConnection': "Send cross-room link invite (host only)",
  'Menu.CoHostCancelHostConnection': "Cancel sent link invite (host only)",
  'Menu.CoHostAcceptHostConnection': "Accept link request (host only)",
  'Menu.CoHostRejectHostConnection': "Reject link request (host only)",
  'Menu.CoHostExitHostConnection': "End cross-room link (host only)",
  'Menu.CoHostMuteRemoteHostAudio': "Mute / unmute remote host audio (host only)",

  // CoHostState card
  'Card.CoHostStateDesc': 'Reactive snapshot of the cross-room link state.',
  'Card.CoHostStateNote0Item0':
    "useCoHostState auto-calls getCoHostCandidates('') on init (when TUIRoomEngine is ready) to load the candidate list; opening this card re-pulls once to refresh candidates / candidatesCursor — no need to click the getCoHostCandidates card manually.",

  // GetCoHostCandidates card
  'Card.CoHostGetCoHostCandidatesDesc':
    'Paginate connectable hosts (other broadcasters) by cursor; the result is written into the reactive candidates.',
  'Card.CoHostGetCoHostCandidatesNoteSummary': 'getCoHostCandidates',
  'Card.CoHostStateNoteSummary': 'co-host.state · Auto-pull on open',
  'Card.CoHostGetCoHostCandidatesNote0Item0':
    'cursor semantics: pass an empty string "" for the first fetch; pass the current candidatesCursor.value to continue; when on the last page candidatesCursor.value = "".',
  'Card.CoHostGetCoHostCandidatesNote0Item1':
    'Independent from fetchLiveList: the candidate list and the live list are two separate SDK pagination streams. Loading the live list does NOT mean candidates are ready. You MUST run this card before requestHostConnection.',
  'Card.CoHostGetCoHostCandidatesFieldCursorPlaceholder': 'Empty string for first fetch, current candidatesCursor to continue',
  'Card.CoHostGetCoHostCandidatesFieldCursorHelp': 'Empty string = from start; non-empty = paginated continue',
  'Card.CoHostGetCoHostCandidatesToastTitle': 'Candidate host list refreshed',
  'Card.CoHostGetCoHostCandidatesToastDesc': 'Pick a target room in the requestHostConnection card\'s target dropdown',

  // RequestHostConnection card
  'Card.CoHostRequestHostConnectionDesc':
    'Send a cross-room link invite to another host.',
  'Card.CoHostRequestHostConnectionNoteSummary': 'requestHostConnection',
  'Card.CoHostRequestHostConnectionNote0Item0':
    'The target is the OTHER host\'s liveId, not userId: the cross-room protocol is room-based; the request is delivered to the target room\'s host. The inviter / invitee.liveId in the event payload is the remote room number.',
  'Card.CoHostRequestHostConnectionNote0Item1':
    'The return value is Map<liveId, TUIConnectionCode>: the SDK is designed for "batch targets" at the lower layer, so even a single target uses the same entry. Read the code on the business side to judge whether this invite was legally delivered.',
  'Card.CoHostRequestHostConnectionNote0Item2':
    'You MUST run getCoHostCandidates first: when the candidate list is empty, the target dropdown has no option besides the placeholder.',
  'Card.CoHostRequestHostConnectionFieldLiveIdHelp': 'Pick from the candidate list; if empty, run getCoHostCandidates first',
  'Card.CoHostRequestHostConnectionFieldLiveIdOpt': '(Run getCoHostCandidates first to fetch the candidate host list)',
  'Card.CoHostRequestHostConnectionFieldLiveIdOptMeta': 'Click the getCoHostCandidates card in this group',
  'Card.CoHostRequestHostConnectionFieldLayoutTemplateHelp': 'Mixed-stream layout template',
  'Card.CoHostRequestHostConnectionFieldLayoutTemplateOpt600Meta': 'Dynamic grid (600) · positions rearrange as host count changes; common for PK',
  'Card.CoHostRequestHostConnectionFieldLayoutTemplateOpt601Meta': '1v6 dynamic (601) · host centered + 6 guests around',
  'Card.CoHostRequestHostConnectionFieldLayoutTemplateOpt400Meta': 'Landscape 2 seats (400) · fixed positions',
  'Card.CoHostRequestHostConnectionFieldExtensionInfoPlaceholder': 'Optional; business string relayed to the other side',
  'Card.CoHostRequestHostConnectionFieldExtensionInfoHelp': 'The SDK does not parse it — passes through verbatim',
  'Card.CoHostRequestHostConnectionToastTitle': 'Cross-room link invite sent',
  'Card.CoHostRequestHostConnectionToastDesc':
    'The remote host will receive onCoHostRequestReceived; after responding, this side triggers onCoHostRequestAccepted / Rejected / Timeout',

  // CancelHostConnection card
  'Card.CoHostCancelHostConnectionDesc':
    'Cancel the cross-room link invite before the other side responds.',
  'Card.CoHostCancelHostConnectionFieldLiveIdPlaceholder': 'Which room\'s invite to cancel',
  'Card.CoHostCancelHostConnectionFieldLiveIdHelp': 'Must match the liveId passed to requestHostConnection',
  'Card.CoHostCancelHostConnectionToastTitle': 'Invite canceled',
  'Card.CoHostCancelHostConnectionToastDesc':
    'The other side will receive onCoHostRequestCancelled; the local invitees entry is removed',

  // AcceptHostConnection card
  'Card.CoHostAcceptHostConnectionDesc': 'Accept the received cross-room link request.',
  'Card.CoHostAcceptHostConnectionFieldLiveIdPlaceholder': 'Inviting host liveId',
  'Card.CoHostAcceptHostConnectionFieldLiveIdHelp': 'Auto-filled after receiving the request; also editable',
  'Card.CoHostAcceptHostConnectionToastTitle': 'Cross-room link accepted',
  'Card.CoHostAcceptHostConnectionToastDesc':
    'Both sides\' connected lists update; the other side triggers onCoHostRequestAccepted',

  // RejectHostConnection card
  'Card.CoHostRejectHostConnectionDesc': 'Reject the received cross-room link request.',
  'Card.CoHostRejectHostConnectionFieldLiveIdPlaceholder': 'Inviting host liveId',
  'Card.CoHostRejectHostConnectionToastTitle': 'Rejected',
  'Card.CoHostRejectHostConnectionToastDesc':
    'The other side will receive onCoHostRequestRejected; the local applicant is cleared',

  // ExitHostConnection card
  'Card.CoHostExitHostConnectionDesc': 'Actively disconnect the current cross-room link.',
  'Card.CoHostExitHostConnectionNoteSummary': 'exitHostConnection',
  'Card.CoHostExitHostConnectionNote0Item0':
    'Calling from EITHER side ends the entire link: both sides\' connected lists are cleared and both receive onCoHostUserLeft. There is NO "single-side exit" semantics (unlike Battle).',
  'Card.CoHostExitHostConnectionNote0Item1':
    'Synergy with BattleState: if a PK is active in the room, properly end the battle before exiting the link to avoid stale battle state. BattleState internally watches(coHostStatus) and auto-resets on disconnect, but an explicit cleanup is more controllable.',
  'Card.CoHostExitHostConnectionToastTitle': 'Cross-room link ended',
  'Card.CoHostExitHostConnectionToastDesc':
    'Both sides\' connected lists clear; both receive onCoHostUserLeft',

  // MuteRemoteHostAudio card
  'Card.CoHostMuteRemoteHostAudioDesc':
    'Mute / unmute the remote host\'s audio on the local side.',
  'Card.CoHostMuteRemoteHostAudioNoteSummary': 'muteRemoteHostAudio',
  'Card.CoHostMuteRemoteHostAudioNote0Item0':
    'Local-side effect only: it does NOT notify the other side "you are muted", nor affect the audio their own audience hears. It is "local playback hearing control" — a different thing from the push-stream-layer mute.',
  'Card.CoHostMuteRemoteHostAudioFieldLiveIdHelp': 'Must be a remote host liveId from the connected list',
  'Card.CoHostMuteRemoteHostAudioFieldLiveIdPlaceholder': "The connected host's liveId",
  'Card.CoHostMuteRemoteHostAudioFieldIsMutedHelp': 'true = mute, false = restore',
  'Card.CoHostMuteRemoteHostAudioToastTitle': 'Local playback audio adjusted',
  'Card.CoHostMuteRemoteHostAudioToastDesc': 'Only affects local hearing; no effect on the remote side or other audiences',

  // subscribeEvent / unsubscribeEvent (shared, generated by buildSubscriptionCards)
  'Card.CoHostSubscribeEventDesc':
    'This group subscribes to all [[CoHostEvent|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onCoHostRequestReceived]] events by default (demo handler; log rows prefixed with `[demo]<eventName>`). '
      + 'If canceled by the unsubscribeEvent card below, you can re-subscribe here by picking "all" or a single event; '
      + 'if the event is already subscribed, this call is an idempotent no-op.',
  'Card.CoHostSubscribeEventFieldEventHelp': 'Pick "(all events)" to bulk-subscribe every event',
  'Card.CoHostSubscribeEventToastTitle': 'Subscribed',
  'Card.CoHostSubscribeEventToastDesc':
    'Next time the event fires, EventLog will also show a log row prefixed with "[demo]"',
  'Card.CoHostUnsubscribeEventDesc':
    'Unsubscribe one or all events from [[CoHostEvent|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onCoHostRequestReceived]]. After unsubscribing, when the event fires again the "[demo] xxx" '
      + 'prefixed log row no longer appears (the unprefixed regular rows are still captured by the site\'s always-on log subscription). '
      + '⚠️ In real integrations the call MUST pass the EXACT SAME handler reference used for subscribeEvent, otherwise the SDK cannot find it and silently fails.',
  'Card.CoHostUnsubscribeEventFieldEventHelp': 'Pick "(all events)" to bulk-unsubscribe every event',
  'Card.CoHostUnsubscribeEventToastTitle': 'Unsubscribed',
  'Card.CoHostUnsubscribeEventToastDesc':
    'Next time the event fires, EventLog will no longer show the "[demo]" prefixed log row',
  // Group intro — verified against CoHostState source
  'Card.CoHostIntroSummary': 'Host ↔ other rooms\' hosts cross-room link; PK is owned by BattleState',
  'Card.CoHostIntro0Head': 'Key points',
  'Card.CoHostIntro0Item0':
    'This is the host\'s cross-room link with OTHER rooms\' hosts — not same-room audience seat-taking. The link is keyed by liveId (room); invite / accept / reject all use the remote liveId, not userId.',
  'Card.CoHostIntro0Item1':
    'coHostStatus has only Connected / Disconnected: it is derived from "whether self is in the connected list", not assigned directly by the SDK.',
  'Card.CoHostIntro0Item2':
    'A disconnect from EITHER side ends the whole link: both sides\' connected lists clear and both receive onCoHostUserLeft — there is no "single-side exit" semantics.',
  'Card.CoHostIntro0Item3':
    'The candidate list and the live list are NOT the same pagination: getCoHostCandidates reuses the same fetchLiveList but with its own candidatesCursor (20 per page).',
  'Card.CoHostIntro1Head': 'Common pitfalls',
  'Card.CoHostIntro1Item0':
    'If you send an invite without first pulling candidates, candidates is empty and there is nothing to pick — useCoHostState pulls once on init, but to get the latest you must pull again manually.',
  'Card.CoHostIntro1Item1':
    'requestHostConnection returns Map<liveId, TUIConnectionCode>: only when the code is Success does invitees record this pending invite — do not assume success without checking the return.',
  'Card.CoHostIntro1Item2':
    'muteRemoteHostAudio only affects local playback; it does not notify the remote side and does not affect the remote side\'s own audience.',
};
