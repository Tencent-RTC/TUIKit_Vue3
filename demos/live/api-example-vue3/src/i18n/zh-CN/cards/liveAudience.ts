// 简体中文 (zh-CN) i18n 资源 — 与 `en-US/cards/liveAudience.ts` 键集合保持一致；仅值不同。

export const liveAudience: Record<string, string> = {
  'Card.LiveAudienceSetAdministratorFieldUserId': "userId",
  'Menu.LiveAudience': "观众管理",
  'Menu.LiveAudienceState': "读取观众状态（audienceList / audienceCount / messageBannedUserList）",
  'Menu.LiveAudienceFetchAudienceList': "拉取观众列表",
  'Menu.LiveAudienceSetAdministrator': "设为管理员（主播）",
  'Menu.LiveAudienceRevokeAdministrator': "撤销管理员（主播）",
  'Menu.LiveAudienceKickUserOutOfRoom': "踢出房间（主播 / 管理员）",
  'Menu.LiveAudienceDisableSendMessage': "禁言 / 解禁（主播 / 管理员）",
  'Card.LiveAudienceFetchAudienceListDesc':
    '手动拉取观众列表（最多 200；超出为降级行为）。返回数量及前若干用户。',
  'Card.LiveAudienceFetchAudienceListFieldUserIdPlaceholder': '目标观众 userId',
  'Card.LiveAudienceSetAdministratorFieldUserIdPlaceholder': '目标观众 userId',
  'Card.LiveAudienceRevokeAdministratorFieldUserId': 'userId',
  'Card.LiveAudienceKickUserOutOfRoomFieldUserId': 'userId',
  'Card.LiveAudienceDisableSendMessageFieldUserId': 'userId',
  'Card.LiveAudienceDisableSendMessageFieldIsDisable': 'isDisable（禁言）',
  'Card.LiveAudienceSubscribeEventDesc': "本组挂载时已默认订阅 [[LiveAudienceEvent|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onOwnerJoined]] 全部事件（演示 handler；带 `[demo]<事件名>` 前缀的日志行）。若被下方 unsubscribeEvent 卡片取消，可在此选择\"全部\"或单个事件重新订阅；若该事件已在订阅中，本次调用是幂等空操作。",
  'Card.LiveAudienceSubscribeEventFieldEventHelp': "选 (all events) 表示对全部事件批量订阅",
  'Card.LiveAudienceSubscribeEventToastTitle': "已订阅",
  'Card.LiveAudienceSubscribeEventToastDesc': "该事件下次触发时，EventLog 会同时出现 \"[demo]\" 前缀的日志行",
  'Card.LiveAudienceUnsubscribeEventDesc': "从 [[LiveAudienceEvent|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onOwnerJoined]] 中取消订阅一个或全部事件。取消后该事件再次触发时，EventLog 里 \"[demo] xxx\" 前缀的日志行不再出现（不带前缀的常规事件行仍由站点的常驻日志订阅捕获）。⚠️ 真实业务中调用必须传与 subscribeEvent 时「完全相同」的 handler 引用，否则 SDK 会查找不到并静默失败。",
  'Card.LiveAudienceUnsubscribeEventFieldEventHelp': "选 (all events) 表示对全部事件批量取消订阅",
  'Card.LiveAudienceUnsubscribeEventToastTitle': "已取消订阅",
  'Card.LiveAudienceUnsubscribeEventToastDesc': "该事件下次触发时，EventLog 不再出现 \"[demo]\" 前缀的日志行",
  // Group intro — verified against LiveAudienceState source
  'Card.LiveAudienceIntroSummary': '观众列表不会自己出现，管理动作成败由底层 RoomEngine 决定',
  'Card.LiveAudienceIntro0Head': '关键点',
  'Card.LiveAudienceIntro0Item0':
    'audienceList 在进房后才会自动拉一次并填充（watch currentLive.liveId）；进房前它一直是空数组。',
  'Card.LiveAudienceIntro0Item1':
    'audienceCount 由房间总人数驱动，不完全等于列表长度：总人数超过 200 时按「总人数 − 1(房主)」计算，因为本地列表最多只留 200 人，且房主被主动排除在列表外。',
  'Card.LiveAudienceIntro0Item2':
    '管理类动作(setAdministrator / revokeAdministrator / kickUserOutOfRoom / disableSendMessage) 只是转发给底层 RoomEngine，本模块不判断权限——非主播 / 管理员调用会被底层直接拒绝。',
  'Card.LiveAudienceIntro1Head': '常见陷阱',
  'Card.LiveAudienceIntro1Item0':
    '本地观众列表最多保留 200 人，列表里看不到的观众不代表不在房间，只是没被本地记录。',
  'Card.LiveAudienceIntro1Item1':
    'fetchAudienceList 会先清空再重建列表（不是增量追加），且依赖进房状态才有数据，进房前调用拿到空列表。',
  'Card.LiveAudienceIntro1Item2':
    'audienceList / audienceCount 是响应式、随进房 / 退房 / 禁言事件实时变，不要当一次性快照缓存。',

  // Note keys — mirror the example's Chinese fallback literals so the key
  // set stays identical to en-US (the project's i18n invariant).
  'Card.LiveAudienceFetchAudienceListNoteSummary': 'fetchAudienceList · 前置与语义',
  'Card.LiveAudienceStateDesc':
    'audienceList（观众列表）/ audienceCount（观众数）/ messageBannedUserList（被禁言用户）的响应式状态快照，随进房 / 退房 / 房间人数变化 / 禁言事件实时变化。',
  'Card.LiveAudienceStateNoteSummary': 'live-audience.state · 进入自动拉取',
  'Card.LiveAudienceStateNote0Item0':
    '进入本卡片时，会自动调用 fetchAudienceList() 拉取观众列表并写入响应式状态 audienceList / audienceCount，无需手动点击 fetchAudienceList 卡片。需在已进房（currentLive.liveId 存在）后才有数据。',
  'Card.LiveAudienceFetchAudienceListNote0Item0':
    'audienceList / audienceCount 是响应式 ref，随进房 / 退房 / 房间人数变化实时变化；本 API 是手动按需拉取，本地 audienceList 最多保留 200 人，二者互补。',
  'Card.LiveAudienceFetchAudienceListNote0Item1':
    '必须在已进房（currentLive.liveId 存在）后调用；进房前调用得到空列表。',
  'Card.LiveAudienceSetAdministratorNoteSummary': 'setAdministrator · 前置条件',
  'Card.LiveAudienceSetAdministratorNote0Item0':
    '是否允许与成败由底层 RoomEngine 决定（仅主播等有权角色调用才会成功）；未进房 / 非主播调用会被底层 RoomEngine 拒绝。',
  'Card.LiveAudienceSetAdministratorNote0Item1':
    '被设为目标的管理员仍在房间内才生效；目标 userId 应填当前房间内的观众 userId。',
  'Card.LiveAudienceRevokeAdministratorNoteSummary': 'revokeAdministrator · 前置条件',
  'Card.LiveAudienceRevokeAdministratorNote0Item0':
    '是否允许与成败由底层 RoomEngine 决定（仅主播等有权角色调用才会成功）；未进房 / 非主播调用会被底层 RoomEngine 拒绝。',
  'Card.LiveAudienceKickUserOutOfRoomNoteSummary': 'kickUserOutOfRoom · 前置条件',
  'Card.LiveAudienceKickUserOutOfRoomNote0Item0':
    '是否允许与成败由底层 RoomEngine 决定（仅主播 / 管理员等有权角色调用才会成功）；未进房 / 无权限调用会被底层 RoomEngine 拒绝。',
  'Card.LiveAudienceKickUserOutOfRoomNote0Item1':
    '目标 userId 应填当前房间内的观众 userId；被踢用户会收到 onAudienceLeft。',
  'Card.LiveAudienceDisableSendMessageNoteSummary': 'disableSendMessage · 前置条件',
  'Card.LiveAudienceDisableSendMessageNote0Item0':
    '是否允许与成败由底层 RoomEngine 决定（仅主播 / 管理员等有权角色调用才会成功）；未进房 / 无权限调用会被底层 RoomEngine 拒绝。',
  'Card.LiveAudienceDisableSendMessageNote0Item1':
    'isDisable=true 禁言、false 解禁；被禁言用户进入 messageBannedUserList，可通过该 ref 观察结果。',
};
