// 简体中文 (zh-CN) i18n 资源 — 与 `en-US/cards/coHost.ts` 键集合保持一致；仅值不同。

export const coHost: Record<string, string> = {
  'Card.CoHostGetCoHostCandidatesFieldCursor': "cursor",
  'Card.CoHostRequestHostConnectionFieldLiveId': "target liveId",
  'Card.CoHostRequestHostConnectionFieldLayoutTemplate': "layoutTemplate",
  'Card.CoHostRequestHostConnectionFieldTimeout': "timeout (seconds)",
  'Card.CoHostRequestHostConnectionFieldExtensionInfo': "extensionInfo",
  'Card.CoHostCancelHostConnectionFieldLiveId': "target liveId",
  'Card.CoHostAcceptHostConnectionFieldLiveId': "inviter liveId",
  'Card.CoHostRejectHostConnectionFieldLiveId': "inviter liveId",
  'Card.CoHostMuteRemoteHostAudioFieldLiveId': "remote host liveId",
  'Card.CoHostMuteRemoteHostAudioFieldIsMuted': "isMuted",
  'Menu.CoHost': "主播跨房连线",
  'Menu.CoHostState': "读取跨房连线状态（coHostStatus / connected / applicant / invitees / candidates）",
  'Menu.CoHostGetCoHostCandidates': "拉取可连线主播候选列表",
  'Menu.CoHostRequestHostConnection': "发起跨房连线邀请（仅主播）",
  'Menu.CoHostCancelHostConnection': "取消已发出的连线邀请（仅主播）",
  'Menu.CoHostAcceptHostConnection': "接受对方连线申请（仅主播）",
  'Menu.CoHostRejectHostConnection': "拒绝对方连线申请（仅主播）",
  'Menu.CoHostExitHostConnection': "结束跨房连线（仅主播）",
  'Menu.CoHostMuteRemoteHostAudio': "静音 / 恢复对端主播音频（仅主播）",
  'Card.CoHostStateDesc': '跨房连线相关响应式状态快照。',
  'Card.CoHostStateNote0Item0':
    "useCoHostState 初始化（TUIRoomEngine ready 时）就会自动调用 getCoHostCandidates('') 拉取候选列表；进入本卡片也会再拉一次刷新 candidates / candidatesCursor，无需手动点击 getCoHostCandidates 卡片。",
  'Card.CoHostGetCoHostCandidatesDesc':
    '按游标翻页拉取可发起跨房连线的其他主播，结果写入响应式 candidates。',
  'Card.CoHostGetCoHostCandidatesNoteSummary': 'getCoHostCandidates',
  'Card.CoHostStateNoteSummary': 'co-host.state · 进入自动拉取',
  'Card.CoHostGetCoHostCandidatesNote0Item0':
    'cursor 语义：首次拉取传空串 ""；续拉传当前 candidatesCursor.value；位于最后一页时 candidatesCursor.value = ""。',
  'Card.CoHostGetCoHostCandidatesNote0Item1':
    '与 fetchLiveList 相互独立：候选列表与直播列表是 SDK 的两条独立分页流。拉了直播列表不代表候选就绪。必须在 requestHostConnection 之前先运行本卡片。',
  'Card.CoHostGetCoHostCandidatesFieldCursorPlaceholder': '首次拉取传空串，续拉传当前 candidatesCursor',
  'Card.CoHostGetCoHostCandidatesFieldCursorHelp': '空串 = 从头拉；非空 = 分页续拉',
  'Card.CoHostGetCoHostCandidatesToastTitle': '候选主播列表已刷新',
  'Card.CoHostGetCoHostCandidatesToastDesc': '可在 requestHostConnection 卡片的 target 下拉里选择目标房间',
  'Card.CoHostRequestHostConnectionDesc':
    '向另一位主播发起跨房连线邀请。',
  'Card.CoHostRequestHostConnectionNoteSummary': 'requestHostConnection',
  'Card.CoHostRequestHostConnectionNote0Item0':
    '目标是「对方主播的 liveId」而非 userId：跨房协议以房间为单位，请求投递到目标房间的主播。事件回调里的 inviter / invitee.liveId 即对方房间号。',
  'Card.CoHostRequestHostConnectionNote0Item1':
    '返回值是 Map<liveId, TUIConnectionCode>：SDK 底层按「批量目标」设计，因此即便单个目标也走同一入口。业务侧需读取该 code 判断本次邀请是否合法送达。',
  'Card.CoHostRequestHostConnectionNote0Item2':
    '必须先运行 getCoHostCandidates：候选列表为空时，target 下拉除占位项外没有其他可选项。',
  'Card.CoHostRequestHostConnectionFieldLiveIdHelp': '从候选列表里选；空时请先运行 getCoHostCandidates',
  'Card.CoHostRequestHostConnectionFieldLiveIdOpt': '（请先运行 getCoHostCandidates 拉取候选主播列表）',
  'Card.CoHostRequestHostConnectionFieldLiveIdOptMeta': '点击本组的 getCoHostCandidates 卡片',
  'Card.CoHostRequestHostConnectionFieldLayoutTemplateHelp': '混流布局模板',
  'Card.CoHostRequestHostConnectionFieldLayoutTemplateOpt600Meta': '动态宫格（600）· 随主播数量变化自动重排；PK 常用',
  'Card.CoHostRequestHostConnectionFieldLayoutTemplateOpt601Meta': '1v6 动态（601）· 主播居中 + 周围 6 位嘉宾',
  'Card.CoHostRequestHostConnectionFieldLayoutTemplateOpt400Meta': '横屏 2 席（400）· 位置固定',
  'Card.CoHostRequestHostConnectionFieldExtensionInfoPlaceholder': '可选，透传给对端的业务字符串',
  'Card.CoHostRequestHostConnectionFieldExtensionInfoHelp': 'SDK 不解析，仅透传',
  'Card.CoHostRequestHostConnectionToastTitle': '跨房连线邀请已发送',
  'Card.CoHostRequestHostConnectionToastDesc':
    '对端主播将收到 onCoHostRequestReceived；应答后本端触发 onCoHostRequestAccepted / Rejected / Timeout',
  'Card.CoHostCancelHostConnectionDesc':
    '在对端应答前取消跨房连线邀请。',
  'Card.CoHostCancelHostConnectionFieldLiveIdPlaceholder': '取消对哪个房间的邀请',
  'Card.CoHostCancelHostConnectionFieldLiveIdHelp': '需与 requestHostConnection 时传入的 liveId 保持一致',
  'Card.CoHostCancelHostConnectionToastTitle': '邀请已取消',
  'Card.CoHostCancelHostConnectionToastDesc':
    '对端将收到 onCoHostRequestCancelled，本地 invitees 已移除该条',
  'Card.CoHostAcceptHostConnectionDesc': '接受收到的跨房连线申请。',
  'Card.CoHostAcceptHostConnectionFieldLiveIdPlaceholder': '申请方主播的 liveId',
  'Card.CoHostAcceptHostConnectionFieldLiveIdHelp': '收到申请后自动填充；也可手动输入',
  'Card.CoHostAcceptHostConnectionToastTitle': '已接受跨房连线',
  'Card.CoHostAcceptHostConnectionToastDesc':
    '双方 connected 列表更新；对端触发 onCoHostRequestAccepted',
  'Card.CoHostRejectHostConnectionDesc': '拒绝收到的跨房连线申请。',
  'Card.CoHostRejectHostConnectionFieldLiveIdPlaceholder': '申请方主播的 liveId',
  'Card.CoHostRejectHostConnectionToastTitle': '已拒绝',
  'Card.CoHostRejectHostConnectionToastDesc':
    '对端将收到 onCoHostRequestRejected，本地 applicant 已清空',
  'Card.CoHostExitHostConnectionDesc': '主动断开当前的跨房连线。',
  'Card.CoHostExitHostConnectionNoteSummary': 'exitHostConnection',
  'Card.CoHostExitHostConnectionNote0Item0':
    '任意一端调用都会结束整条连线：双方 connected 列表清空，且双方都收到 onCoHostUserLeft。不存在「单方退出」语义（与 Battle 不同）。',
  'Card.CoHostExitHostConnectionNote0Item1':
    '与 BattleState 的协同：若房间内正在 PK，退出连线前应先妥善结束 PK，避免残留 battle 状态。BattleState 内部会 watch(coHostStatus)，断开时自动重置，但显式清理更可控。',
  'Card.CoHostExitHostConnectionToastTitle': '已结束跨房连线',
  'Card.CoHostExitHostConnectionToastDesc':
    '双方 connected 列表清空；双方均收到 onCoHostUserLeft',
  'Card.CoHostMuteRemoteHostAudioDesc':
    '在本端静音 / 恢复对端主播的音频。',
  'Card.CoHostMuteRemoteHostAudioNoteSummary': 'muteRemoteHostAudio',
  'Card.CoHostMuteRemoteHostAudioNote0Item0':
    '仅作用于本端：不会通知对端「你被静音」，也不影响对端自己观众听到的声音。这是「本端播放听感控制」，不同于推流层的静音。',
  'Card.CoHostMuteRemoteHostAudioFieldLiveIdHelp': '需为 connected 列表中的对端 liveId',
  'Card.CoHostMuteRemoteHostAudioFieldLiveIdPlaceholder': '已 connected 主播的 liveId',
  'Card.CoHostMuteRemoteHostAudioFieldIsMutedHelp': 'true = 静音，false = 恢复',
  'Card.CoHostMuteRemoteHostAudioToastTitle': '本端播放音频已调整',
  'Card.CoHostMuteRemoteHostAudioToastDesc': '仅影响本端听感，不影响对端与其他观众',
  'Card.CoHostSubscribeEventDesc': "本组挂载时已默认订阅 [[CoHostEvent|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onCoHostRequestReceived]] 全部事件（演示 handler；带 `[demo]<事件名>` 前缀的日志行）。若被下方 unsubscribeEvent 卡片取消，可在此选择\"全部\"或单个事件重新订阅；若该事件已在订阅中，本次调用是幂等空操作。",
  'Card.CoHostSubscribeEventFieldEventHelp': "选 (all events) 表示对全部事件批量订阅",
  'Card.CoHostSubscribeEventToastTitle': "已订阅",
  'Card.CoHostSubscribeEventToastDesc': "该事件下次触发时，EventLog 会同时出现 \"[demo]\" 前缀的日志行",
  'Card.CoHostUnsubscribeEventDesc': "从 [[CoHostEvent|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onCoHostRequestReceived]] 中取消订阅一个或全部事件。取消后该事件再次触发时，EventLog 里 \"[demo] xxx\" 前缀的日志行不再出现（不带前缀的常规事件行仍由站点的常驻日志订阅捕获）。⚠️ 真实业务中调用必须传与 subscribeEvent 时「完全相同」的 handler 引用，否则 SDK 会查找不到并静默失败。",
  'Card.CoHostUnsubscribeEventFieldEventHelp': "选 (all events) 表示对全部事件批量取消订阅",
  'Card.CoHostUnsubscribeEventToastTitle': "已取消订阅",
  'Card.CoHostUnsubscribeEventToastDesc': "该事件下次触发时，EventLog 不再出现 \"[demo]\" 前缀的日志行",
  // Group intro — verified against CoHostState source
  'Card.CoHostIntroSummary': '主播 ↔ 其它房间主播的跨房连线，PK 由 BattleState 管',
  'Card.CoHostIntro0Head': '关键点',
  'Card.CoHostIntro0Item0':
    '这是主播与其他房间主播的「跨房连线」，不是同房间观众上麦；连线以直播间(liveId)为单位，邀请 / 接受 / 拒绝用的都是对端 liveId，不是 userId。',
  'Card.CoHostIntro0Item1':
    'coHostStatus 只有 Connected / Disconnected 两态，由「自己是否在 connected 列表里」自动算出，不是 SDK 直接赋值。',
  'Card.CoHostIntro0Item2':
    '任意一端断开都会结束整场连线：两端 connected 同时清空、都收到 onCoHostUserLeft，不存在「单方退出」。',
  'Card.CoHostIntro0Item3':
    '候选列表与直播列表分页不是一回事：getCoHostCandidates 复用同一套 fetchLiveList 但用独立游标 candidatesCursor（每页 20 条）。',
  'Card.CoHostIntro1Head': '常见陷阱',
  'Card.CoHostIntro1Item0':
    '不先拉候选列表就发邀请，candidates 为空、无可选项；useCoHostState 初始化会拉一次，但想拿最新仍需手动再跑。',
  'Card.CoHostIntro1Item1':
    'requestHostConnection 返回 Map<liveId, TUIConnectionCode>：只有对应 code 为 Success 时，invitees 才会记录这条待响应邀请，不要不看返回值就假设成功。',
  'Card.CoHostIntro1Item2':
    'muteRemoteHostAudio 只对本端播放生效，不会通知对端，也不影响对端自家观众。',
};
