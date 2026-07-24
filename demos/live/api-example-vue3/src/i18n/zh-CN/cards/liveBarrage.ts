// 简体中文 (zh-CN) i18n 资源 — 与 `en-US/cards/liveBarrage.ts` 键集合保持一致；仅值不同。

export const liveBarrage: Record<string, string> = {
  'Card.LiveBarrageSendTextMessageFieldText': "text",
  'Card.LiveBarrageSendTextMessageFieldExtensionInfo': "extensionInfo (JSON)",
  'Card.LiveBarrageSendCustomMessageFieldBusinessId': "businessId",
  'Card.LiveBarrageSendCustomMessageFieldData': "data (string)",
  'Card.LiveBarrageAppendLocalTipFieldText': "tip text",
  'Menu.LiveBarrage': "弹幕",
  'Menu.LiveBarrageState': "读取弹幕状态（messageList）",
  'Menu.LiveBarrageSendTextMessage': "发送文本弹幕",
  'Menu.LiveBarrageSendCustomMessage': "发送自定义业务消息",
  'Menu.LiveBarrageAppendLocalTip': "追加本地系统提示",
  'Card.LiveBarrageStateDesc': '响应式状态：全房间文本弹幕队列。',
  'Card.LiveBarrageStateNoteSummary': 'messageList · 存了什么',
  'Card.LiveBarrageStateNote0Item0':
    '只存放「文本弹幕」（SDK 转发 + appendLocalTip 本地注入）；自定义业务消息不会进入 messageList —— 需自行订阅 onCustomMessageReceived 来处理。',
  'Card.LiveBarrageSendTextMessageDesc': '向当前直播间发送一条文本弹幕。',
  'Card.LiveBarrageSendTextMessageFieldTextPlaceholder': '要发送的文本内容',
  'Card.LiveBarrageSendTextMessageFieldExtensionInfoHelp':
    '可选；必须是值为字符串的 JSON 对象。SDK 不解析，仅透传。',
  'Card.LiveBarrageSendTextMessageToastTitle': '弹幕已发送',
  'Card.LiveBarrageSendTextMessageToastDesc':
    '接收方触发 onBarrageReceived，并自动加入 messageList',
  'Card.LiveBarrageSendCustomMessageDesc':
    '发送自定义业务消息（礼物 / 福袋 / 进场通知等）。',
  'Card.LiveBarrageSendCustomMessageNoteSummary': 'sendCustomMessage · 与文本弹幕的区别',
  'Card.LiveBarrageSendCustomMessageNote0Item0':
    '自定义消息不进入 messageList：只通过 onCustomMessageReceived 事件转发。接收方必须订阅该事件并自行解析 `data`（通常是 JSON 字符串）；SDK 不做 schema 校验。',
  'Card.LiveBarrageSendCustomMessageFieldBusinessIdPlaceholder':
    '业务标识，自定义字符串（如 gift / lucky_bag / entrance）',
  'Card.LiveBarrageSendCustomMessageFieldDataHelp':
    '任意字符串；通常是 JSON 序列化后的业务 payload —— 结构由业务侧约定。',
  'Card.LiveBarrageSendCustomMessageToastTitle': '自定义消息已发送',
  'Card.LiveBarrageSendCustomMessageToastDesc':
    '接收方通过 onCustomMessageReceived 收到；不进入 messageList',
  'Card.LiveBarrageAppendLocalTipDesc': '在本地构造一条 Barrage 并直接推入 messageList。',
  'Card.LiveBarrageAppendLocalTipNoteSummary': 'appendLocalTip · 仅本地',
  'Card.LiveBarrageAppendLocalTipNote0Item0':
    '仅本地：不会发往服务端，因此对端看不到。用于纯客户端的 UX 提示，如「欢迎 X」「主播即将开播」，且不占用真实弹幕名额。',
  'Card.LiveBarrageAppendLocalTipFieldTextPlaceholder': '要追加的本地提示文本',
  'Card.LiveBarrageAppendLocalTipToastTitle': '本地提示已追加',
  'Card.LiveBarrageAppendLocalTipToastDesc': '仅更新本地 messageList；对端不会收到',
  'Card.LiveBarrageSubscribeEventDesc': "本组挂载时已默认订阅 [[BarrageEvent|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onBarrageReceived]] 全部事件（演示 handler；带 `[demo]<事件名>` 前缀的日志行）。若被下方 unsubscribeEvent 卡片取消，可在此选择\"全部\"或单个事件重新订阅；若该事件已在订阅中，本次调用是幂等空操作。",
  'Card.LiveBarrageSubscribeEventFieldEventHelp': "选 (all events) 表示对全部事件批量订阅",
  'Card.LiveBarrageSubscribeEventToastTitle': "已订阅",
  'Card.LiveBarrageSubscribeEventToastDesc': "该事件下次触发时，EventLog 会同时出现 \"[demo]\" 前缀的日志行",
  'Card.LiveBarrageUnsubscribeEventDesc': "从 [[BarrageEvent|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onBarrageReceived]] 中取消订阅一个或全部事件。取消后该事件再次触发时，EventLog 里 \"[demo] xxx\" 前缀的日志行不再出现（不带前缀的常规事件行仍由站点的常驻日志订阅捕获）。⚠️ 真实业务中调用必须传与 subscribeEvent 时「完全相同」的 handler 引用，否则 SDK 会查找不到并静默失败。",
  'Card.LiveBarrageUnsubscribeEventFieldEventHelp': "选 (all events) 表示对全部事件批量取消订阅",
  'Card.LiveBarrageUnsubscribeEventToastTitle': "已取消订阅",
  'Card.LiveBarrageUnsubscribeEventToastDesc': "该事件下次触发时，EventLog 不再出现 \"[demo]\" 前缀的日志行",
  // Group intro — verified against BarrageState source
  'Card.LiveBarrageIntroSummary': 'Barrage 没有开关，能否收发只取决于是否进房',
  'Card.LiveBarrageIntro0Head': '关键点',
  'Card.LiveBarrageIntro0Item0':
    '源码里没有弹幕的「开启 / 关闭」开关(startBarrage/stopBarrage 不存在)，能否收发只取决于是否进房；未进房时发送会被底层 RoomEngine 拒绝。',
  'Card.LiveBarrageIntro0Item1':
    '两类消息走不同通道：文本弹幕自动进 messageList 并触发 onBarrageReceived；自定义消息不进 messageList，只通过 onCustomMessageReceived 透传，业务层需自行解析 data。',
  'Card.LiveBarrageIntro0Item2':
    '发送依赖 roomEngine 实例存在（即已进房），未进房调用会静默失败 / 抛错。',
  'Card.LiveBarrageIntro1Head': '常见陷阱',
  'Card.LiveBarrageIntro1Item0':
    '用 sendCustomMessage 发礼物后 messageList 长度不变，必须订阅 onCustomMessageReceived 才能拿到，否则「发了像没发」。',
  'Card.LiveBarrageIntro1Item1':
    'appendLocalTip 是纯本地 push 进 messageList，不发服务端，误当「另一种发送」会让对方收不到。',
  'Card.LiveBarrageIntro1Item2':
    '自定义消息的 data 是原始字符串，SDK 不校验格式，业务侧必须自己约定 schema 并 JSON.parse。',
};
