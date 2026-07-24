// English (en-US) i18n resources — Live Room Lifecycle state list.
//
// Key set MUST stay identical to `zh-CN/cards/liveList.ts`; only the
// value differs. See `menuKey()` / `cardKey()` key derivation in the
// demo. zh-CN falls back to the Chinese literals, so only the English
// side needs explicit entries here.

export const liveList: Record<string, string> = {
  'Card.LiveListFetchLiveListFieldCursor': "Cursor",
  'Card.LiveListFetchLiveListFieldCount': "Count",
  'Card.LiveListFetchLiveInfoFieldLiveId': "liveId",
  'Card.LiveListStartLiveFieldLiveId': "liveId",
  'Card.LiveListStartLiveFieldLiveName': "Live name",
  'Card.LiveListStartLiveFieldSeatTemplate': "seatTemplate",
  'Card.LiveListStartLiveFieldEnableMultiPlaybackQuality': "enableMultiPlaybackQuality",
  'Card.LiveListStartLiveFieldEnableMultiPlaybackQualityHelp': 'Enable multi-resolution playback so viewers can switch resolution via live-player.switchResolution',
  'Card.LiveListCreateLiveFieldLiveId': "liveId",
  'Card.LiveListCreateLiveFieldLiveName': "Live name",
  'Card.LiveListJoinLiveFieldLiveId': "liveId",
  'Card.LiveListUpdateLiveInfoFieldParams': "Params",
  'Card.LiveListQueryMetaDataFieldKeys': "Keys",
  'Card.LiveListUpdateLiveMetaDataFieldMetaData': "Meta data",
  'Menu.LiveList': "Live Room Lifecycle",
  'Menu.LiveListState': "Read live list state (liveList / liveListCursor / currentLive)",
  'Menu.LiveListFetchLiveList': "Fetch live list",
  'Menu.LiveListFetchLiveInfo': "Query single live room info",
  'Menu.LiveListStartLive': "Start live",
  'Menu.LiveListCreateLive': "Start live (deprecated alias)",
  'Menu.LiveListJoinLive': "Join live room & pull stream",
  'Menu.LiveListLeaveLive': "Leave live room",
  'Menu.LiveListEndLive': "End live room (host)",
  'Menu.LiveListUpdateLiveInfo': "Update live room info",
  'Menu.LiveListQueryMetaData': "Query metadata",
  'Menu.LiveListUpdateLiveMetaData': "Update metadata",

  // FetchLiveList card
  'Card.LiveListFetchLiveListDesc':
    'Paginate the live list by cursor; the result is written into the reactive state for consumption.',
  'Card.LiveListFetchLiveListNoteSummary': 'fetchLiveList',
  'Card.LiveListStateDesc':
    'Snapshot of reactive state: liveList (live list) / liveListCursor (pagination cursor) / currentLive (current live room).',
  'Card.LiveListStateNoteSummary': 'live-list.state · Auto-pull on open',
  'Card.LiveListStateNote0Item0':
    'Opening this card auto-calls fetchLiveList({ count: 20 }) to load the latest live list into reactive state liveList / liveListCursor — no need to click the fetchLiveList card. Results show live in the "Reactive State" panel above.',
  'Card.LiveListFetchLiveListNote0Head': 'Key points',
  'Card.LiveListFetchLiveListNote0Item0':
    'Side-effect API: returns Promise<void>; the data is NOT in the return value but in the reactive refs liveList / liveListCursor exposed by useLiveListState.',
  'Card.LiveListFetchLiveListNote0Item1':
    'cursor is a server-issued continuation token, NOT a page number 1/2/3. Empty on first call triggers a reset; to continue you MUST pass the previous liveListCursor.value; on the last page liveListCursor.value = "".',
  'Card.LiveListFetchLiveListNote0Item2':
    'liveList elements are the LiveInfo processed by the state layer (mapped from the underlying TUILiveInfo by convertToLiveInfo) — this is the type production code consumes.',
  'Card.LiveListFetchLiveListNote1Head': 'Common pitfalls',
  'Card.LiveListFetchLiveListNote1Item0':
    'count is "how many you want THIS call to fetch", NOT "cumulative after fetch". The append branch de-dupes by liveId against existing entries, so you may pass count=1 yet see liveList.length=7 — the 7 is "cumulative".',
  'Card.LiveListFetchLiveListNote1Item1':
    'Do NOT treat the return value as data: `const list = await fetchLiveList(...)` yields undefined. Read liveList.value instead.',
  'Card.LiveListFetchLiveListFieldCursorHelp':
    'Server-issued continuation token (not a page number). Empty triggers reset; to continue, pass the liveListCursor.value after the previous fetch.',
  'Card.LiveListFetchLiveListFieldCountHelp':
    'How many to fetch this call (server may return fewer).',

  // FetchLiveInfo card
  'Card.LiveListFetchLiveInfoFieldLiveIdHelp': 'Empty uses the top-bar liveId.',

  // StartLive card
  'Card.LiveListStartLiveDesc':
    'Any logged-in user can call it; after success this side becomes the host of the live room. '
      + 'The room is fixed to "apply-to-take-seat" mode (audience must be approved by the host to take a seat), so no seatMode option is offered; '
      + 'for audience to take a seat, use [[applyForSeat|applyForSeat]] followed by host or admin approval.',
  'Card.LiveListStartLiveNoteSummary': 'seatTemplate · seat-layout template',
  'Card.LiveListStartLiveNote0Item0':
    'SDK requires "not in a room" state: startLive creates and enters a new live room; the SDK does not accept "start while already in a room". The business side must leaveLive first (audience/admin) or endLive (its previous own live) to return to unassigned, then call startLive. This demo\'s run auto-leaves first when the user is "audience/admin in someone else\'s room" for quick demo; integrators must handle this step explicitly in their own code.',
  'Card.LiveListStartLiveNote0Item1':
    'One-shot decision at room creation: the SDK provides no runtime layout-switch API; switching layout requires endLive then startLive again. If the product needs "switch mode mid-live", guide users to "end current live → reopen with new template"; do NOT expect seamless switching.',
  'Card.LiveListStartLiveNote0Item2':
    'Not passing seatTemplate is legal but usually wrong: the SDK skips seat-config injection, so the room will have no seats (audience cannot apply to take a seat). Only omit it when you need a "pure broadcast live" (no audience seats).',
  'Card.LiveListStartLiveNote0Item3':
    'Always use SeatLayoutTemplate enum constants; do NOT hardcode numbers (e.g. 600/601/200). Numbers may change as the SDK evolves and hardcoding silently breaks.',
  'Card.LiveListStartLiveFieldLiveIdHelp': 'Empty uses the top-bar liveId.',
  'Card.LiveListStartLiveFieldSeatTemplateHelp':
    'Decide once; cannot switch after going live; see "Usage notes" below.',
  'Card.LiveListStartLiveFieldSeatTemplateOpt600Meta':
    'Portrait · dynamic 9 seats, positions rearrange as count changes; the most common voice / video room',
  'Card.LiveListStartLiveFieldSeatTemplateOpt601Meta':
    'Portrait · 1 host + 6 guests floating around, dynamic rearrange; show-room / PK scenarios',
  'Card.LiveListStartLiveFieldSeatTemplateOpt800Meta':
    'Portrait · static 9-grid, seat positions fixed, no rearrange',
  'Card.LiveListStartLiveFieldSeatTemplateOpt801Meta':
    'Portrait · static 1v6 floating, guest positions fixed, no rearrange',
  'Card.LiveListStartLiveFieldSeatTemplateOpt200Meta':
    'Landscape · 4 seats; good for game live / landscape content',

  // CreateLive card
  'Card.LiveListCreateLiveDesc':
    'Deprecated, equivalent to startLive; kept only for backward-compatible old integrations. New integrations should use startLive.',
  'Card.LiveListCreateLiveFieldLiveIdHelp': 'Leave empty to use the liveId at the top',

  // JoinLive card
  'Card.LiveListJoinLiveDesc':
    'End-to-end: after joinLive enters the room, the LiveView below renders the pull-stream picture. The state layer handles entering; the picture is carried by LiveView.',
  'Card.LiveListJoinLiveNoteSummary': 'joinLive',
  'Card.LiveListJoinLiveNote0Item0':
    'SDK requires "not in a room" state: if you are currently in some room (audience/admin/host), leaveLive or endLive first, then joinLive. This demo\'s run auto-leaves first when "audience/admin switches to a different live room" for quick demo; integrators must handle this step explicitly in their own code.',
  'Card.LiveListJoinLiveNote0Item1':
    'After joinLive succeeds, this side\'s role is uniformly "audience"; you can then be promoted to "admin" by the host via setAdministrator; whether you were a host before does not affect this room-entry role.',
  'Card.LiveListJoinLiveNote1Item0':
    'Lifecycle: any role can joinLive to any liveId once it returns to "not in room". Typical multi-scenario combos: host endLive then joinLive someone else\'s live to watch; audience leaveLive then joinLive to another live room.',
  'Card.LiveListJoinLiveFieldLiveIdHelp': 'Empty uses the top-bar liveId.',

  // LeaveLive card
  'Card.LiveListLeaveLiveDesc':
    'Any role can use it to exit the current room; if the host also wants to end the live, use [[endLive|endLive]].',
  'Card.LiveListLeaveLiveNoteSummary': 'leaveLive',
  'Card.LiveListLeaveLiveNote0Item0':
    'leaveLive means "this side leaves the room" and does NOT destroy the room. After leaving, this side returns to "not in room" and can immediately joinLive into another live room.',
  'Card.LiveListLeaveLiveNote0Item1':
    'Host calling leaveLive: the room still exists on the server, other audience do NOT receive onLiveEnded; for a live scenario you should normally use endLive to end the whole live. Only special businesses like multi-host / persistent rooms use leaveLive to let the host "temporarily leave".',

  // UpdateLiveInfo card
  'Card.LiveListUpdateLiveInfoNoteSummary': 'updateLiveInfo',
  'Card.LiveListUpdateLiveInfoNote0Item0':
    'Delete or comment out fields: to change only some fields, delete the lines you don\'t want or comment them with `//`; commented/deleted fields are NOT sent to the SDK at all.',
  'Card.LiveListUpdateLiveInfoNote0Item1':
    'Falsy values are forwarded: `false` / `0` / `[]` / `""` such falsy values ARE really sent to the SDK and are NOT swallowed. E.g. `"isPublicVisible": false` changes the room to not-public.',
  'Card.LiveListUpdateLiveInfoNote0Item2':
    'liveId default: empty means update the current room by default (`currentLive.liveId`); a non-empty value updates the corresponding room.',
  'Card.LiveListUpdateLiveInfoNote0Item3':
    'categoryList is business-defined: an array of integer category IDs; the SDK does not validate its meaning. The example\'s `[101, 205]` is just a placeholder and must align with your business system.',
  'Card.LiveListUpdateLiveInfoNote0Item4':
    '⚠️ layoutTemplate auto-filter: when modifying seat layout, the demo auto-filters other fields and only sends `layoutTemplate`. The JSON may include other fields; they are automatically stripped on submit.',
  'Card.LiveListUpdateLiveInfoNote1Item0':
    'The editor supports `//` line comments (block comments `/* */` and trailing commas are NOT supported).',
  'Card.LiveListUpdateLiveInfoFieldParamsHelp':
    'All fields are open by default; clicking Run sends them all at once. To keep a field unchanged, delete or comment its line. See "Usage notes" below for field descriptions.',

  // QueryMetaData card
  'Card.LiveListQueryMetaDataFieldKeysHelp': 'JSON string array',

  // subscribeEvent / unsubscribeEvent (shared, generated by buildSubscriptionCards)
  'Card.LiveListSubscribeEventDesc':
    'This group subscribes to all [[LiveListEvent|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onLiveEnded]] events by default (demo handler; log rows prefixed with `[demo]<eventName>`). '
      + 'If canceled by the unsubscribeEvent card below, you can re-subscribe here by picking "all" or a single event; '
      + 'if the event is already subscribed, this call is an idempotent no-op.',
  'Card.LiveListSubscribeEventFieldEventHelp': 'Pick "(all events)" to bulk-subscribe every event',
  'Card.LiveListSubscribeEventToastTitle': 'Subscribed',
  'Card.LiveListSubscribeEventToastDesc':
    'Next time the event fires, EventLog will also show a log row prefixed with "[demo]"',
  'Card.LiveListUnsubscribeEventDesc':
    'Unsubscribe one or all events from [[LiveListEvent|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onLiveEnded]]. After unsubscribing, when the event fires again the "[demo] xxx" '
      + 'prefixed log row no longer appears (the unprefixed regular rows are still captured by the site\'s always-on log subscription). '
      + '⚠️ In real integrations the call MUST pass the EXACT SAME handler reference as subscribeEvent, otherwise the SDK cannot find it and silently fails.',
  'Card.LiveListUnsubscribeEventFieldEventHelp': 'Pick "(all events)" to bulk-unsubscribe every event',
  'Card.LiveListUnsubscribeEventToastTitle': 'Unsubscribed',
  'Card.LiveListUnsubscribeEventToastDesc':
    'Next time the event fires, EventLog will no longer show the "[demo]" prefixed log row',

  // Live-list group intro (G2): currentLive = "which room am I in"
  'Card.LiveListIntroSummary': 'Live list & room lifecycle: query directory + start / join / leave / end',
  'Card.LiveListIntro0Head': 'Key points',
  'Card.LiveListIntro0Item0':
    'The hook returns three refs: liveList (public live directory), liveListCursor (pagination token), currentLive (the live room you are currently in); they differ in duty — liveList is filled by fetchLiveList and is independent of room entry, only currentLive is established by startLive / joinLive.',
  'Card.LiveListIntro0Item1':
    'To tell "am I in a room", check whether currentLive.value?.liveId has a value — do NOT just check the truthiness of currentLive.value: after your own leaveLive / endLive it becomes an empty object (still truthy), only being kicked or the room being dismissed sets it to null.',
  'Card.LiveListIntro0Item2':
    'leaveLive and endLive are worlds apart: leaveLive just means you leave — the room stays online and others do NOT receive an end event; endLive (host) truly dissolves the room and everyone receives onLiveEnded.',
  'Card.LiveListIntro0Item3':
    'Both startLive / joinLive require "not currently in any room" (the SDK does not support starting/joining while already in a room); they auto-login for you when not logged in, but before entering please leaveLive / endLive first to return to the unassigned state.',
  'Card.LiveListIntro0Item4':
    'startLive / joinLive only change state — they render NO picture: after entering the room they merely set currentLive.liveId to a valid value; the actual pull-stream picture is the LiveView component\'s job. LiveView is a global singleton that on mount automatically calls startPlayStream to pull the room\'s stream into a fixed container (this demo mounts it at App level as a resident and gates its visibility on currentLive.liveId). So "stream auto-pulls after entering" really means "LiveView auto-starts pulling once currentLive.liveId is ready"; without a mounted LiveView you only see the state flip while the stage stays black.',
  'Card.LiveListIntro0Item5':
    'Pushing a stream requires actively opening the device (the open* family): a host (startLive) must additionally call openLocalCamera / openLocalMicrophone to capture and push their own camera/microphone stream — only then does their picture and audio appear; an audience (joinLive) pulls the host\'s remote stream right after entering and needs no device of their own. Note: entering a room does NOT auto-open the camera/microphone; if you never call open* you always read Off (for the "delayed On / instant Off / pure-device-ops" details, see the "Device Control" group).',
  'Card.LiveListIntro1Head': 'Quick start',
  'Card.LiveListIntro1Item0':
    'To try things fast: first fetchLiveList in this group to see the directory, then startLive (host) or joinLive (audience) to enter a room; only after that will other groups (device, PK, gift, ...) have data.',
};
