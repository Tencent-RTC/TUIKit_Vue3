// 简体中文 (zh-CN) i18n 资源 — 与 `en-US/cards/liveGift.ts` 键集合保持一致；仅值不同。

export const liveGift: Record<string, string> = {
  'Card.LiveGiftSendGiftFieldGiftId': "giftId",
  'Card.LiveGiftSendGiftFieldCount': "count",
  'Card.LiveGiftSendLikesFieldCount': "count",
  'Card.LiveGiftSetLanguageFieldLanguage': "language",
  'Card.LiveGiftSetLanguageFieldLanguageOptzh-Hans': "zh-Hans",
  'Card.LiveGiftSetLanguageFieldLanguageOpten': "en",
  'Menu.LiveGift': "礼物 & 点赞",
  'Menu.LiveGiftState': "读取礼物状态（giftInfoList / totalLikeCount）",
  'Menu.LiveGiftRefreshGiftList': "刷新礼物列表",
  'Menu.LiveGiftSendGift': "发送礼物",
  'Menu.LiveGiftSendLikes': "发送点赞",
  'Menu.LiveGiftSetLanguage': "设置礼物信息显示语言",
  'Menu.LiveGiftGetGiftList': "获取礼物列表（已废弃，仅兼容旧接入）",
  'Card.LiveGiftStateDesc': '礼物分类列表与累计点赞数的响应式快照。',
  'Card.LiveGiftRefreshGiftListDesc':
    '从服务端拉取当前直播间的礼物分类与列表。',
  'Card.LiveGiftRefreshGiftListNoteSummary': 'refreshGiftList',
  'Card.LiveGiftStateNoteSummary': 'live-gift.state · 进入自动拉取',
  'Card.LiveGiftStateNote0Item0':
    '进入本卡片时，会自动调用 refreshGiftList() 拉取礼物分类与清单并写入响应式状态 giftInfoList，无需手动点击 refreshGiftList 卡片。需在已进房（currentLive.liveId 存在）后才有数据。',
  'Card.LiveGiftRefreshGiftListNote0Item0':
    '必须先进入房间：currentLive.liveId 为空时调用会抛错。观众先 joinLive，主播先 startLive。',
  'Card.LiveGiftRefreshGiftListNote0Item1':
    '副作用：结果写入响应式 giftInfoList；同时预加载礼物特效资源（减少首次送礼的白屏）。',
  'Card.LiveGiftRefreshGiftListToastTitle': '礼物列表已刷新',
  'Card.LiveGiftRefreshGiftListToastDesc':
    '可在下方 sendGift 卡片的 giftId 下拉里选择礼物',
  'Card.LiveGiftSendGiftDesc': '向当前直播间送出指定礼物。',
  'Card.LiveGiftSendGiftFieldGiftIdHelp':
    '从下方礼物卡片中选择；为空时请先运行上方 refreshGiftList',
  'Card.LiveGiftSendGiftFieldGiftIdOpt': '（请先调用 refreshGiftList 拉取礼物列表）',
  'Card.LiveGiftSendGiftFieldGiftIdOptMeta': '点击上方 refreshGiftList 卡片',
  'Card.LiveGiftSendGiftToastTitle': '礼物已送出',
  'Card.LiveGiftSendGiftToastDesc':
    '接收方触发 onReceiveGiftMessage 与 onGiftCountChanged',
  'Card.LiveGiftSendLikesDesc': '向当前直播间发送点赞。',
  'Card.LiveGiftSendLikesToastTitle': '点赞已发送',
  'Card.LiveGiftSendLikesToastDesc':
    '接收方触发 onReceiveLikesMessage；totalLikeCount 更新',
  'Card.LiveGiftSetLanguageDesc':
    '设置礼物名称 / 描述等信息的显示语言。',
  'Card.LiveGiftSetLanguageNoteSummary': 'setLanguage',
  'Card.LiveGiftSetLanguageNote0Item0':
    '设置后必须重新调用 refreshGiftList 才能看到新语言下的名称 / 描述；仅切换语言不会重新拉取已缓存的礼物列表。',
  'Card.LiveGiftSetLanguageFieldLanguageOptzh-HansMeta': '简体中文',
  'Card.LiveGiftSetLanguageFieldLanguageOptenMeta': '英文',
  'Card.LiveGiftSetLanguageToastTitle': '语言已切换',
  'Card.LiveGiftSetLanguageToastDesc':
    '重新调用 refreshGiftList，使礼物名称 / 描述使用新语言',
  'Card.LiveGiftGetGiftListDesc':
    '已废弃，等价于 refreshGiftList，但同步返回礼物分类数组。',
  'Card.LiveGiftSubscribeEventDesc': "本组挂载时已默认订阅 [[LiveGiftEvents|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-ON_RECEIVE_GIFT_MESSAGE]] 全部事件（演示 handler；带 `[demo]<事件名>` 前缀的日志行）。若被下方 unsubscribeEvent 卡片取消，可在此选择\"全部\"或单个事件重新订阅；若该事件已在订阅中，本次调用是幂等空操作。",
  'Card.LiveGiftSubscribeEventFieldEventHelp': "选 (all events) 表示对全部事件批量订阅",
  'Card.LiveGiftSubscribeEventToastTitle': "已订阅",
  'Card.LiveGiftSubscribeEventToastDesc': "该事件下次触发时，EventLog 会同时出现 \"[demo]\" 前缀的日志行",
  'Card.LiveGiftUnsubscribeEventDesc': "从 [[LiveGiftEvents|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-ON_RECEIVE_GIFT_MESSAGE]] 中取消订阅一个或全部事件。取消后该事件再次触发时，EventLog 里 \"[demo] xxx\" 前缀的日志行不再出现（不带前缀的常规事件行仍由站点的常驻日志订阅捕获）。⚠️ 真实业务中调用必须传与 subscribeEvent 时「完全相同」的 handler 引用，否则 SDK 会查找不到并静默失败。",
  'Card.LiveGiftUnsubscribeEventFieldEventHelp': "选 (all events) 表示对全部事件批量取消订阅",
  'Card.LiveGiftUnsubscribeEventToastTitle': "已取消订阅",
  'Card.LiveGiftUnsubscribeEventToastDesc': "该事件下次触发时，EventLog 不再出现 \"[demo]\" 前缀的日志行",
  // Group intro — verified against LiveGiftState source
  'Card.LiveGiftIntroSummary': '所有能力都要求已进房；礼物列表不会自动加载',
  'Card.LiveGiftIntro0Head': '关键点',
  'Card.LiveGiftIntro0Item0':
    '发礼物 / 发点赞 / 拉礼物列表都要求 currentLive.liveId 不为空（已进房），未进房调用会直接抛错——主播先 startLive、观众先 joinLive。',
  'Card.LiveGiftIntro0Item1':
    '礼物列表不会自动加载：giftInfoList 初始为空，必须先主动 refreshGiftList()（或已废弃的 getGiftList()）写进响应式数据，sendGift 前务必先拉列表。',
  'Card.LiveGiftIntro0Item2':
    '累计点赞 totalLikeCount 不是你自己发完就累加，而是别人 / 自己收到服务端点赞事件时整体覆盖；你 sendLikes 后本地数字不会立刻变化。',
  'Card.LiveGiftIntro0Item3':
    '礼物与点赞不区分角色、与是否上麦无关：主播 / 观众 / 管理员都可发，仅校验是否进房。',
  'Card.LiveGiftIntro1Head': '常见陷阱',
  'Card.LiveGiftIntro1Item0':
    '接收礼物 / 点赞要自己 subscribeEvent(LiveGiftEvents.<事件>, cb) 注册回调；getGiftList 是异步 Promise（已废弃），新代码用 refreshGiftList。',
  'Card.LiveGiftIntro1Item1':
    'setLanguage 切语言后必须再调一次 refreshGiftList 才会用新语言展示，单独切语言不会重新拉取已缓存列表。',
};
