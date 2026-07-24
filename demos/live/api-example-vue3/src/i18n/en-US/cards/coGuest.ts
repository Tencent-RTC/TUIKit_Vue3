// English (en-US) i18n resources — Co-guest (Mic-link) state list.
//
// Key set MUST stay identical to `zh-CN/cards/coGuest.ts`; only the value
// differs. See `menuKey()` / `cardKey()` key derivation in the demo.
// zh-CN falls back to the Chinese literals, so only the English side
// needs explicit entries here.

export const coGuest: Record<string, string> = {
  'Card.CoGuestApplyForSeatFieldSeatIndex': "Seat index",
  'Card.CoGuestAcceptApplicationFieldUserId': "User ID",
  'Card.CoGuestRejectApplicationFieldUserId': "User ID",
  'Card.CoGuestInviteToSeatFieldUserId': "User ID",
  'Card.CoGuestInviteToSeatFieldSeatIndex': "Seat index",
  'Card.CoGuestCancelInvitationFieldInviteeId': "Invitee ID",
  'Card.CoGuestAcceptInvitationFieldInviterId': "Inviter ID",
  'Card.CoGuestRejectInvitationFieldInviterId': "Inviter ID",
  'Menu.CoGuest': "Co-guest (Mic-link)",
  'Menu.CoGuestState': "Read co-guest state (connected / applicants / invitees)",
  'Menu.CoGuestApplyForSeat': "Apply for seat (audience / admin)",
  'Menu.CoGuestCancelApplication': "Cancel seat application (audience / admin)",
  'Menu.CoGuestAcceptApplication': "Approve seat application (host / admin)",
  'Menu.CoGuestRejectApplication': "Reject seat application (host / admin)",
  'Menu.CoGuestInviteToSeat': "Invite audience to seat (host / admin)",
  'Menu.CoGuestCancelInvitation': "Cancel co-guest invitation (host / admin)",
  'Menu.CoGuestAcceptInvitation': "Accept co-guest invitation (audience / admin)",
  'Menu.CoGuestRejectInvitation': "Reject co-guest invitation (audience / admin)",
  'Menu.CoGuestDisConnect': "Disconnect co-guest (guest leaves seat)",

  // CoGuestState card
  'Card.CoGuestStateDesc':
    'Connected (on-mic users) / applicants (pending approval) / invitees (pending response) / candidates (candidate pool) — read-only snapshot, updates live with application / invitation events.',

  // ApplyForSeat card
  'Card.CoGuestApplyForSeatDesc':
    'An audience member applies to the host for a seat. The host side must subscribe to [[onGuestApplicationReceived|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onGuestApplicationReceived]] to receive it (see this group\'s host-side cards). '
      + 'The approval result returns to the audience side via [[onGuestApplicationResponded|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onGuestApplicationResponded]].',
  'Card.CoGuestApplyForSeatFieldTimeout': 'timeout (seconds)',
  'Card.CoGuestApplyForSeatFieldTimeoutHelp': '0 means no timeout',
  'Card.CoGuestApplyForSeatToastTitle': 'Seat application sent',
  'Card.CoGuestApplyForSeatToastDesc':
    'Waiting for host approval; the result returns via the [[GuestEvent.onGuestApplicationResponded|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onGuestApplicationResponded]] event',

  // CancelApplication card
  'Card.CoGuestCancelApplicationToastTitle': 'Seat application canceled',
  'Card.CoGuestCancelApplicationToastDesc':
    'The host side will receive [[HostEvent.onGuestApplicationCancelled|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onGuestApplicationCancelled]]',

  // AcceptApplication card
  'Card.CoGuestAcceptApplicationDesc': 'Host approves a specific applicant onto a seat.',
  'Card.CoGuestAcceptApplicationFieldUserIdPlaceholder': 'Applicant userId',
  'Card.CoGuestAcceptApplicationToastTitle': 'Application approved',
  'Card.CoGuestAcceptApplicationToastDesc':
    'The audience member is about to take a seat; confirm in the seat-status view',

  // RejectApplication card
  'Card.CoGuestRejectApplicationToastTitle': 'Application rejected',
  'Card.CoGuestRejectApplicationToastDesc':
    'The audience side will receive [[GuestEvent.onGuestApplicationResponded|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onGuestApplicationResponded]](isAccept=false)',

  // InviteToSeat card
  'Card.CoGuestInviteToSeatDesc': 'Host proactively invites a specific audience member to take a seat.',
  'Card.CoGuestInviteToSeatFieldUserIdPlaceholder': 'Invited audience userId',
  'Card.CoGuestInviteToSeatFieldTimeout': 'timeout (seconds)',
  'Card.CoGuestInviteToSeatFieldTimeoutHelp': '0 means no timeout',
  'Card.CoGuestInviteToSeatToastTitle': 'Co-guest invitation sent',
  'Card.CoGuestInviteToSeatToastDesc':
    'Waiting for the audience to accept; the result returns via [[HostEvent.onHostInvitationResponded|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onHostInvitationResponded]]',

  // CancelInvitation card
  'Card.CoGuestCancelInvitationFieldInviteeIdPlaceholder': 'Invited user userId',
  'Card.CoGuestCancelInvitationToastTitle': 'Co-guest invitation withdrawn',
  'Card.CoGuestCancelInvitationToastDesc':
    'The audience side will receive [[GuestEvent.onHostInvitationCancelled|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onHostInvitationCancelled]]',

  // AcceptInvitation card
  'Card.CoGuestAcceptInvitationDesc': 'Audience accepts the host\'s co-guest invitation and takes a seat.',
  'Card.CoGuestAcceptInvitationFieldInviterIdPlaceholder': 'Inviting host userId',
  'Card.CoGuestAcceptInvitationToastTitle': 'Invitation accepted',
  'Card.CoGuestAcceptInvitationToastDesc':
    'About to take a seat; confirm in the seat-status view',

  // RejectInvitation card
  'Card.CoGuestRejectInvitationToastTitle': 'Invitation rejected',
  'Card.CoGuestRejectInvitationToastDesc':
    'The host side will receive [[HostEvent.onHostInvitationResponded|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onHostInvitationResponded]](isAccept=false)',

  // DisConnect card
  'Card.CoGuestDisConnectDesc': 'Disconnect the co-guest (the guest leaves the seat).',
  'Card.CoGuestDisConnectToastTitle': 'Left the seat',
  'Card.CoGuestDisConnectToastDesc': 'The seat-status view will update accordingly',

  // subscribeEvent / unsubscribeEvent (shared, generated by buildSubscriptionCards)
  'Card.CoGuestSubscribeEventDesc':
    'This group subscribes to all [[HostEvent | GuestEvent|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onGuestApplicationReceived]] events by default (demo handler; log rows prefixed with `[demo]<eventName>`). '
      + 'If a card below (unsubscribeEvent) canceled it, you can re-subscribe here by picking "all" or a single event; '
      + 'if the event is already subscribed, this call is an idempotent no-op.',
  'Card.CoGuestSubscribeEventFieldEventHelp': 'Pick "(all events)" to bulk-subscribe every event',
  'Card.CoGuestSubscribeEventToastTitle': 'Subscribed',
  'Card.CoGuestSubscribeEventToastDesc':
    'Next time the event fires, EventLog will also show a log row prefixed with "[demo]"',
  'Card.CoGuestUnsubscribeEventDesc':
    'Unsubscribe one or all events from [[HostEvent | GuestEvent|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onGuestApplicationReceived]]. After unsubscribing, when the event fires again the "[demo] xxx" '
      + 'prefixed log row no longer appears (the unprefixed regular rows are still captured by the site\'s always-on log subscription). '
      + '⚠️ In real integrations the call MUST pass the EXACT SAME handler reference used for subscribeEvent, otherwise the SDK cannot find it and silently fails.',
  'Card.CoGuestUnsubscribeEventFieldEventHelp': 'Pick "(all events)" to bulk-unsubscribe every event',
  'Card.CoGuestUnsubscribeEventToastTitle': 'Unsubscribed',
  'Card.CoGuestUnsubscribeEventToastDesc':
    'Next time the event fires, EventLog will no longer show the "[demo]" prefixed log row',

  // ApplyForSeat card — usage notes (G5)
  'Card.CoGuestApplyForSeatNoteSummary': 'applyForSeat · prerequisite',
  'Card.CoGuestApplyForSeatNote0Item0':
    'Must first joinLive to enter the room (the audience is already inside), then call applyForSeat to request a seat. Calling without being in the room is rejected by the underlying RoomEngine with an error.',
  'Card.CoGuestApplyForSeatNote0Item1':
    'The call itself resolves immediately, but the actual seat-taking waits for the host to approve after receiving [[onGuestApplicationReceived|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onGuestApplicationReceived]]; the result returns to the audience side via [[onGuestApplicationResponded|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onGuestApplicationResponded]].',
  // Group intro — verified against CoGuestState source
  'Card.CoGuestIntroSummary': 'This group owns "seat application / invitation"; which seat is taken lives in the live-seat group',
  'Card.CoGuestIntro0Head': 'Key points',
  'Card.CoGuestIntro0Item0':
    'Two independent seat paths exist: the audience actively APPLIES (applyForSeat → host acceptApplication/rejectApplication) and the host actively INVITES (inviteToSeat → audience acceptInvitation/rejectInvitation). The two lines are recorded in separate maps (applyRequest / inviteRequest) and do not share.',
  'Card.CoGuestIntro0Item1':
    'Whether someone is on-seat belongs to the live-seat group: this group\'s connected is only the on-mic user list derived from seat state. The actual seat occupancy is in live-seat.',
  'Card.CoGuestIntro0Item2':
    'Applications / invitations all carry a timeout (default 30; unit per card). On timeout the request disappears and triggers onXxxNoResponse.',
  'Card.CoGuestIntro0Item3':
    'Switching live rooms auto-clears all pending applications and invitations.',
  'Card.CoGuestIntro1Head': 'Common pitfalls',
  'Card.CoGuestIntro1Item0':
    'applyForSeat / inviteToSeat resolving only means "the request was sent" — the actual seat-taking happens after the other side accepts; confirm via seatList / connected.',
  'Card.CoGuestIntro1Item1':
    'acceptApplication / acceptInvitation require the corresponding request to still be in the map; if the other side already timed out / canceled, the call silently does nothing.',
  'Card.CoGuestIntro1Item2':
    'In the invitation event, the "who is the other side" is hostUser (from request.fromUser) — do NOT take request.userId, that is the invited audience (yourself).',
};
