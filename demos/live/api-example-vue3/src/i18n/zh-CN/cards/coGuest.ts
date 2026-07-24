// 简体中文 (zh-CN) i18n 资源 — 与 `en-US/cards/coGuest.ts` 键集合保持一致；仅值不同。

export const coGuest: Record<string, string> = {
  'Card.CoGuestApplyForSeatFieldSeatIndex': "seatIndex",
  'Card.CoGuestAcceptApplicationFieldUserId': "userId",
  'Card.CoGuestRejectApplicationFieldUserId': "userId",
  'Card.CoGuestInviteToSeatFieldUserId': "userId",
  'Card.CoGuestInviteToSeatFieldSeatIndex': "seatIndex",
  'Card.CoGuestCancelInvitationFieldInviteeId': "inviteeId",
  'Card.CoGuestAcceptInvitationFieldInviterId': "inviterId",
  'Card.CoGuestRejectInvitationFieldInviterId': "inviterId",
  'Menu.CoGuest': "连麦嘉宾",
  'Menu.CoGuestState': "读取连麦状态（connected / applicants / invitees）",
  'Menu.CoGuestApplyForSeat': "申请上麦（观众 / 管理员）",
  'Menu.CoGuestCancelApplication': "取消上麦申请（观众 / 管理员）",
  'Menu.CoGuestAcceptApplication': "同意上麦申请（主播 / 管理员）",
  'Menu.CoGuestRejectApplication': "拒绝上麦申请（主播 / 管理员）",
  'Menu.CoGuestInviteToSeat': "邀请观众上麦（主播 / 管理员）",
  'Menu.CoGuestCancelInvitation': "取消连麦邀请（主播 / 管理员）",
  'Menu.CoGuestAcceptInvitation': "接受连麦邀请（观众 / 管理员）",
  'Menu.CoGuestRejectInvitation': "拒绝连麦邀请（观众 / 管理员）",
  'Menu.CoGuestDisConnect': "断开连麦（连麦嘉宾下麦）",
  'Card.CoGuestStateDesc':
    'Connected（上麦用户）/ applicants（待审批）/ invitees（待应答）/ candidates（候选池）—— 只读快照，随申请 / 邀请事件实时更新。',
  'Card.CoGuestApplyForSeatDesc':
    '观众向主播申请上麦。主播侧需订阅 [[onGuestApplicationReceived|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onGuestApplicationReceived]] 才能收到（见本组主播侧卡片）。审批结果通过 [[onGuestApplicationResponded|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onGuestApplicationResponded]] 返回观众侧。',
  'Card.CoGuestApplyForSeatFieldTimeout': 'timeout（秒）',
  'Card.CoGuestApplyForSeatFieldTimeoutHelp': '0 表示不超时',
  'Card.CoGuestApplyForSeatToastTitle': '上麦申请已发送',
  'Card.CoGuestApplyForSeatToastDesc':
    '等待主播审批；结果通过 [[GuestEvent.onGuestApplicationResponded|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onGuestApplicationResponded]] 事件返回',
  'Card.CoGuestCancelApplicationToastTitle': '上麦申请已取消',
  'Card.CoGuestCancelApplicationToastDesc':
    '主播侧将收到 [[HostEvent.onGuestApplicationCancelled|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onGuestApplicationCancelled]]',
  'Card.CoGuestAcceptApplicationDesc': '主播批准某位申请者上麦。',
  'Card.CoGuestAcceptApplicationFieldUserIdPlaceholder': '申请者 userId',
  'Card.CoGuestAcceptApplicationToastTitle': '申请已通过',
  'Card.CoGuestAcceptApplicationToastDesc':
    '该观众即将上麦；请在麦位状态视图确认',
  'Card.CoGuestRejectApplicationToastTitle': '申请已拒绝',
  'Card.CoGuestRejectApplicationToastDesc':
    '观众侧将收到 [[GuestEvent.onGuestApplicationResponded|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onGuestApplicationResponded]](isAccept=false)',
  'Card.CoGuestInviteToSeatDesc': '主播主动邀请指定观众上麦。',
  'Card.CoGuestInviteToSeatFieldUserIdPlaceholder': '被邀请的观众 userId',
  'Card.CoGuestInviteToSeatFieldTimeout': 'timeout（秒）',
  'Card.CoGuestInviteToSeatFieldTimeoutHelp': '0 表示不超时',
  'Card.CoGuestInviteToSeatToastTitle': '连麦邀请已发送',
  'Card.CoGuestInviteToSeatToastDesc':
    '等待观众接受；结果通过 [[HostEvent.onHostInvitationResponded|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onHostInvitationResponded]] 返回',
  'Card.CoGuestCancelInvitationFieldInviteeIdPlaceholder': '被邀请用户 userId',
  'Card.CoGuestCancelInvitationToastTitle': '连麦邀请已撤回',
  'Card.CoGuestCancelInvitationToastDesc':
    '观众侧将收到 [[GuestEvent.onHostInvitationCancelled|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onHostInvitationCancelled]]',
  'Card.CoGuestAcceptInvitationDesc': '观众接受主播的连麦邀请并上麦。',
  'Card.CoGuestAcceptInvitationFieldInviterIdPlaceholder': '邀请方主播 userId',
  'Card.CoGuestAcceptInvitationToastTitle': '邀请已接受',
  'Card.CoGuestAcceptInvitationToastDesc':
    '即将上麦；请在麦位状态视图确认',
  'Card.CoGuestRejectInvitationToastTitle': '邀请已拒绝',
  'Card.CoGuestRejectInvitationToastDesc':
    '主播侧将收到 [[HostEvent.onHostInvitationResponded|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onHostInvitationResponded]](isAccept=false)',
  'Card.CoGuestDisConnectDesc': '断开连麦（连麦嘉宾下麦）。',
  'Card.CoGuestDisConnectToastTitle': '已下麦',
  'Card.CoGuestDisConnectToastDesc': '麦位状态视图将相应更新',
  'Card.CoGuestSubscribeEventDesc': "本组挂载时已默认订阅 [[HostEvent | GuestEvent|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onGuestApplicationReceived]] 全部事件（演示 handler；带 `[demo]<事件名>` 前缀的日志行）。若被下方 unsubscribeEvent 卡片取消，可在此选择\"全部\"或单个事件重新订阅；若该事件已在订阅中，本次调用是幂等空操作。",
  'Card.CoGuestSubscribeEventFieldEventHelp': "选 (all events) 表示对全部事件批量订阅",
  'Card.CoGuestSubscribeEventToastTitle': "已订阅",
  'Card.CoGuestSubscribeEventToastDesc': "该事件下次触发时，EventLog 会同时出现 \"[demo]\" 前缀的日志行",
  'Card.CoGuestUnsubscribeEventDesc': "从 [[HostEvent | GuestEvent|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onGuestApplicationReceived]] 中取消订阅一个或全部事件。取消后该事件再次触发时，EventLog 里 \"[demo] xxx\" 前缀的日志行不再出现（不带前缀的常规事件行仍由站点的常驻日志订阅捕获）。⚠️ 真实业务中调用必须传与 subscribeEvent 时「完全相同」的 handler 引用，否则 SDK 会查找不到并静默失败。",
  'Card.CoGuestUnsubscribeEventFieldEventHelp': "选 (all events) 表示对全部事件批量取消订阅",
  'Card.CoGuestUnsubscribeEventToastTitle': "已取消订阅",
  'Card.CoGuestUnsubscribeEventToastDesc': "该事件下次触发时，EventLog 不再出现 \"[demo]\" 前缀的日志行",
  // Group intro — verified against CoGuestState source
  'Card.CoGuestIntroSummary': '本组管「上麦申请 / 邀请」，真正坐到哪个麦位看 live-seat 组',
  'Card.CoGuestIntro0Head': '关键点',
  'Card.CoGuestIntro0Item0':
    '存在两条独立上麦路径：观众主动「申请」(applyForSeat → 主播 acceptApplication/rejectApplication) 和主播主动「邀请」(inviteToSeat → 观众 acceptInvitation/rejectInvitation)，两条线分别用 applyRequest / inviteRequest 记录，互不通用。',
  'Card.CoGuestIntro0Item1':
    '「是否已上麦」归 live-seat 组管：本组的 connected 只是从麦位状态推导出的已上麦用户列表，真正的麦位占用要看 live-seat。',
  'Card.CoGuestIntro0Item2':
    '申请 / 邀请都带超时（默认 30，单位以各卡片为准），超时后请求自动消失并触发 onXxxNoResponse。',
  'Card.CoGuestIntro0Item3':
    '切换直播间会自动清空所有待处理申请与邀请。',
  'Card.CoGuestIntro1Head': '常见陷阱',
  'Card.CoGuestIntro1Item0':
    'applyForSeat / inviteToSeat 的 Promise 成功只代表「请求已发出」，真正上麦要等对方接受后才发生，需去 seatList / connected 确认。',
  'Card.CoGuestIntro1Item1':
    'acceptApplication / acceptInvitation 等动作要求对应请求还在记录里；对方已超时 / 取消会静默无操作。',
  'Card.CoGuestIntro1Item2':
    '邀请事件里的「对方是谁」要看 hostUser（来自 request.fromUser），不要直接拿 request.userId，那会是被邀请的自己。',

  // Note keys — mirror the example's Chinese fallback literals so the key
  // set stays identical to en-US (the project's i18n invariant).
  'Card.CoGuestApplyForSeatNoteSummary': 'applyForSeat · 前置条件',
  'Card.CoGuestApplyForSeatNote0Item0':
    '必须先 joinLive 进入房间（观众已在房内），再调用 applyForSeat 申请上麦。未进房调用会被底层 RoomEngine 拒绝并抛错。',
  'Card.CoGuestApplyForSeatNote0Item1':
    '调用本身立即 resolve，但真正上麦要等主播在 [[onGuestApplicationReceived|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onGuestApplicationReceived]] 收到后审批；审批结果通过 [[onGuestApplicationResponded|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onGuestApplicationResponded]] 回到观众侧。',
};
