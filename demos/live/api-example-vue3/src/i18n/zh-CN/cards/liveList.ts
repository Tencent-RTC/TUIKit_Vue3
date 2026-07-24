// 简体中文 (zh-CN) i18n 资源 — 与 `en-US/cards/liveList.ts` 键集合保持一致；仅值不同。

export const liveList: Record<string, string> = {
  'Card.LiveListFetchLiveListFieldCursor': "cursor",
  'Card.LiveListFetchLiveListFieldCount': "count",
  'Card.LiveListFetchLiveInfoFieldLiveId': "liveId",
  'Card.LiveListStartLiveFieldLiveId': "liveId",
  'Card.LiveListStartLiveFieldLiveName': "liveName",
  'Card.LiveListStartLiveFieldSeatTemplate': "seatTemplate",
  'Card.LiveListStartLiveFieldEnableMultiPlaybackQuality': "enableMultiPlaybackQuality",
  'Card.LiveListStartLiveFieldEnableMultiPlaybackQualityHelp': '开启多分辨率播放能力，观众可通过 live-player.switchResolution 切换清晰度',
  'Card.LiveListCreateLiveFieldLiveId': "liveId",
  'Card.LiveListCreateLiveFieldLiveName': "liveName",
  'Card.LiveListJoinLiveFieldLiveId': "liveId",
  'Card.LiveListUpdateLiveInfoFieldParams': "params",
  'Card.LiveListQueryMetaDataFieldKeys': "keys",
  'Card.LiveListUpdateLiveMetaDataFieldMetaData': "metaData",
  'Menu.LiveList': "直播间生命周期",
  'Menu.LiveListState': "读取直播列表状态（liveList / liveListCursor / currentLive）",
  'Menu.LiveListFetchLiveList': "拉取直播列表",
  'Menu.LiveListFetchLiveInfo': "查询单个直播间信息",
  'Menu.LiveListStartLive': "开播",
  'Menu.LiveListCreateLive': "开播（已废弃别名）",
  'Menu.LiveListJoinLive': "进入直播间并拉流",
  'Menu.LiveListLeaveLive': "离开直播间",
  'Menu.LiveListEndLive': "解散直播间（主播）",
  'Menu.LiveListUpdateLiveInfo': "更新直播间信息",
  'Menu.LiveListQueryMetaData': "查询元数据",
  'Menu.LiveListUpdateLiveMetaData': "更新元数据",
  'Card.LiveListFetchLiveListDesc':
    '按游标翻页拉取直播列表；结果写入响应式状态供消费。',
  'Card.LiveListFetchLiveListNoteSummary': 'fetchLiveList',
  'Card.LiveListStateDesc':
    'liveList（直播列表）/ liveListCursor（分页游标）/ currentLive（当前所在直播间）的响应式状态快照。',
  'Card.LiveListStateNoteSummary': 'live-list.state · 进入自动拉取',
  'Card.LiveListStateNote0Item0':
    '进入本卡片时，会自动调用 fetchLiveList({ count: 20 }) 拉取最新直播列表并写入响应式状态 liveList / liveListCursor，无需手动点击 fetchLiveList 卡片。结果实时展示在上方「响应式状态」面板。',
  'Card.LiveListFetchLiveListNote0Head': '关键点',
  'Card.LiveListFetchLiveListNote0Item0':
    '副作用型 API：返回 Promise<void>；数据不在返回值里，而在 useLiveListState 暴露的响应式 liveList / liveListCursor 中。',
  'Card.LiveListFetchLiveListNote0Item1':
    'cursor 是服务端下发的续拉令牌，而非第 1/2/3 页页码。首次调用传空串触发重置；续拉必须传上一次的 liveListCursor.value；最后一页时 liveListCursor.value = ""。',
  'Card.LiveListFetchLiveListNote0Item2':
    'liveList 中的元素是状态层处理后的 LiveInfo（由 convertToLiveInfo 从底层 TUILiveInfo 映射而来）—— 这是生产代码消费的类型。',
  'Card.LiveListFetchLiveListNote1Head': '常见坑',
  'Card.LiveListFetchLiveListNote1Item0':
    'count 是「本次想拉取多少条」，不是「拉取后累计多少」。追加分支会按 liveId 与已有条目去重，因此你可能传 count=1 却看到 liveList.length=7 —— 这个 7 是「累计」。',
  'Card.LiveListFetchLiveListNote1Item1':
    '不要把返回值当数据：`const list = await fetchLiveList(...)` 得到的是 undefined。请读取 liveList.value。',
  'Card.LiveListFetchLiveListFieldCursorHelp':
    '服务端下发的续拉令牌（不是页码）。空串触发重置；续拉请传上一次拉取后的 liveListCursor.value。',
  'Card.LiveListFetchLiveListFieldCountHelp':
    '本次拉取多少条（服务端可能返回更少）。',
  'Card.LiveListFetchLiveInfoFieldLiveIdHelp': '留空使用顶栏 liveId。',
  'Card.LiveListStartLiveDesc':
    '任何已登录用户都可调用；成功后本端成为该直播间的主播。房间固定为「申请上麦」模式（观众须经主播批准才能上麦），因此不提供 seatMode 选项；观众上麦请使用 [[applyForSeat|applyForSeat]] 后由主播或管理员审批。',
  'Card.LiveListStartLiveNoteSummary': 'seatTemplate · 座位布局模板',
  'Card.LiveListStartLiveNote0Item0':
    'SDK 要求「未进房」状态：startLive 会创建并进入新直播间；SDK 不接受「已在房间内时再开播」。业务侧必须先 leaveLive（观众/管理员）或 endLive（自己之前的直播）回到未进房状态，再调用 startLive。本 demo 在用户「在他人房间内作为观众/管理员」时会自动先离开以便快速演示；接入方必须在自己的代码里显式处理这一步。',
  'Card.LiveListStartLiveNote0Item1':
    '房间创建时一次性决定：SDK 不提供运行期切换布局的接口；切换布局需 endLive 后再 startLive。若产品需要「直播中切换模式」，请引导用户「结束当前直播 → 用新模板重开」；不要指望无缝切换。',
  'Card.LiveListStartLiveNote0Item2':
    '不传 seatTemplate 合法但通常是错误的：SDK 会跳过座位配置注入，导致房间无座位（观众无法申请上麦）。仅当你需要「纯广播直播」（无观众座位）时才省略它。',
  'Card.LiveListStartLiveNote0Item3':
    '始终使用 SeatLayoutTemplate 枚举常量；不要硬编码数字（如 600/601/200）。数字可能随 SDK 演进而变化，硬编码会静默失效。',
  'Card.LiveListStartLiveFieldLiveIdHelp': '留空使用顶栏 liveId。',
  'Card.LiveListStartLiveFieldSeatTemplateHelp':
    '一次性决定；开播后无法切换；详见下方「使用须知」。',
  'Card.LiveListStartLiveFieldSeatTemplateOpt600Meta':
    '竖屏 · 动态 9 席，随人数变化自动重排；最常见的语音 / 视频房',
  'Card.LiveListStartLiveFieldSeatTemplateOpt601Meta':
    '竖屏 · 1 主播 + 6 嘉宾环绕，动态重排；秀场 / PK 场景',
  'Card.LiveListStartLiveFieldSeatTemplateOpt800Meta':
    '竖屏 · 静态 9 宫格，座位固定，不重排',
  'Card.LiveListStartLiveFieldSeatTemplateOpt801Meta':
    '竖屏 · 静态 1v6 环绕，嘉宾位置固定，不重排',
  'Card.LiveListStartLiveFieldSeatTemplateOpt200Meta':
    '横屏 · 4 席；适合游戏直播 / 横屏内容',
  'Card.LiveListCreateLiveDesc':
    '已废弃，等价于 startLive；仅为向后兼容旧接入保留。新接入请使用 startLive。',
  'Card.LiveListCreateLiveFieldLiveIdHelp': '留空使用顶栏 liveId',
  'Card.LiveListJoinLiveDesc':
    '端到端：joinLive 进入房间后，下方 LiveView 渲染拉流画面。状态层负责进房；画面由 LiveView 承载。',
  'Card.LiveListJoinLiveNoteSummary': 'joinLive',
  'Card.LiveListJoinLiveNote0Item0':
    'SDK 要求「未进房」状态：若你当前在某个房间内（观众/管理员/主播），需先 leaveLive 或 endLive，再 joinLive。本 demo 在「观众/管理员切换到另一个直播间」时会自动先离开以便快速演示；接入方必须在自己的代码里显式处理这一步。',
  'Card.LiveListJoinLiveNote0Item1':
    'joinLive 成功后，本端角色统一为「观众」；之后可由主播通过 setAdministrator 提升为「管理员」；此前是否为主播不影响本次进房角色。',
  'Card.LiveListJoinLiveNote1Item0':
    '生命周期：任意角色在回到「未进房」后都可 joinLive 进入任意 liveId。典型多场景组合：主播 endLive 后 joinLive 他人直播观看；观众 leaveLive 后 joinLive 到另一个直播间。',
  'Card.LiveListJoinLiveFieldLiveIdHelp': '留空使用顶栏 liveId。',
  'Card.LiveListLeaveLiveDesc':
    '任意角色都可用它退出当前房间；若主播还想结束直播，请使用 [[endLive|endLive]]。',
  'Card.LiveListLeaveLiveNoteSummary': 'leaveLive',
  'Card.LiveListLeaveLiveNote0Item0':
    'leaveLive 表示「本端离开房间」，并不会销毁房间。离开后本端回到「未进房」状态，可立即 joinLive 进入另一个直播间。',
  'Card.LiveListLeaveLiveNote0Item1':
    '主播调用 leaveLive：房间在服务端仍然存在，其他观众不会收到 onLiveEnded；直播场景通常应使用 endLive 来结束整场直播。仅多主播 / 常驻房间等特殊业务会用 leaveLive 让主播「临时离开」。',
  'Card.LiveListUpdateLiveInfoNoteSummary': 'updateLiveInfo',
  'Card.LiveListUpdateLiveInfoNote0Item0':
    '删除或注释字段：只想改部分字段时，删掉不想要的行或用 `//` 注释；被注释/删除的字段根本不会发给 SDK。',
  'Card.LiveListUpdateLiveInfoNote0Item1':
    '假值也会发送：`false` / `0` / `[]` / `""` 这类假值确实会发给 SDK，不会被吞掉。例如 `"isPublicVisible": false` 会把房间改为非公开。',
  'Card.LiveListUpdateLiveInfoNote0Item2':
    'liveId 默认值：为空表示默认更新当前房间（`currentLive.liveId`）；非空则更新对应房间。',
  'Card.LiveListUpdateLiveInfoNote0Item3':
    'categoryList 由业务定义：一组整数类目 ID；SDK 不校验其含义。示例的 `[101, 205]` 只是占位，必须与你的业务系统对齐。',
  'Card.LiveListUpdateLiveInfoNote0Item4':
    '⚠️ layoutTemplate 自动过滤：修改座位布局时，demo 会自动过滤掉其他字段，只发送 `layoutTemplate`。JSON 里可能还包含其他字段，提交时会自动剔除。',
  'Card.LiveListUpdateLiveInfoNote1Item0':
    '编辑器支持 `//` 行注释（不支持块注释 `/* */` 和尾随逗号）。',
  'Card.LiveListUpdateLiveInfoFieldParamsHelp':
    '默认所有字段都展开；点击运行会一次性全部发送。想保留某字段不变，请删除或注释它的行。字段说明见下方「使用须知」。',
  'Card.LiveListQueryMetaDataFieldKeysHelp': 'JSON 字符串数组',
  'Card.LiveListSubscribeEventDesc': "本组挂载时已默认订阅 [[LiveListEvent|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onLiveEnded]] 全部事件（演示 handler；带 `[demo]<事件名>` 前缀的日志行）。若被下方 unsubscribeEvent 卡片取消，可在此选择\"全部\"或单个事件重新订阅；若该事件已在订阅中，本次调用是幂等空操作。",
  'Card.LiveListSubscribeEventFieldEventHelp': "选 (all events) 表示对全部事件批量订阅",
  'Card.LiveListSubscribeEventToastTitle': "已订阅",
  'Card.LiveListSubscribeEventToastDesc': "该事件下次触发时，EventLog 会同时出现 \"[demo]\" 前缀的日志行",
  'Card.LiveListUnsubscribeEventDesc': "从 [[LiveListEvent|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onLiveEnded]] 中取消订阅一个或全部事件。取消后该事件再次触发时，EventLog 里 \"[demo] xxx\" 前缀的日志行不再出现（不带前缀的常规事件行仍由站点的常驻日志订阅捕获）。⚠️ 真实业务中调用必须传与 subscribeEvent 时「完全相同」的 handler 引用，否则 SDK 会查找不到并静默失败。",
  'Card.LiveListUnsubscribeEventFieldEventHelp': "选 (all events) 表示对全部事件批量取消订阅",
  'Card.LiveListUnsubscribeEventToastTitle': "已取消订阅",
  'Card.LiveListUnsubscribeEventToastDesc': "该事件下次触发时，EventLog 不再出现 \"[demo]\" 前缀的日志行",

  // Live-list group intro (G2): currentLive = "which room am I in"
  'Card.LiveListIntroSummary': '直播列表与进出房：直播列表查询 + 开播 / 进房 / 退房 / 关播',
  'Card.LiveListIntro0Head': '关键点',
  'Card.LiveListIntro0Item0':
    '钩子返回三个 ref：liveList（公开直播列表）、liveListCursor（分页 token）、currentLive（你当前所在的直播间）；它们职责不同——liveList 由 fetchLiveList 填充、与是否进房无关，只有 currentLive 由 startLive / joinLive 建立。',
  'Card.LiveListIntro0Item1':
    '判断「是否在房间」看 currentLive.value?.liveId 有没有值，不要只看 currentLive.value 真假：自己 leaveLive / endLive 后它变成空对象（仍有值），只有被踢或房间被解散才置 null。',
  'Card.LiveListIntro0Item2':
    'leaveLive 与 endLive 天差地别：leaveLive 只是你离开，房间仍在线、其他人收不到结束事件；endLive（主播）才真正解散房间，所有人收到 onLiveEnded。',
  'Card.LiveListIntro0Item3':
    'startLive / joinLive 都要求「当前未进房」（SDK 不支持在房间内再开播 / 进房）；它们会在你未登录时自动帮你登录，但进房前请先 leaveLive / endLive 回到未进房状态。',
  'Card.LiveListIntro0Item4':
    'startLive / joinLive 只改状态、不渲染画面：进房后它们只把 currentLive.liveId 置为有效，真正的拉流画面由 LiveView 组件负责。LiveView 是全局单例，挂载时自动调用 startPlayStream 把房间内的流拉到固定容器（本 demo 在 App 级常驻挂载，并由 currentLive.liveId 控制是否显示）。所以「进房后默认拉流」= LiveView 在 currentLive.liveId 就绪后自动开拉；没有 LiveView 实例，你只看到状态变了、舞台却是黑屏。',
  'Card.LiveListIntro0Item5':
    '推流必须主动开设备（open* 类 API）：主播（startLive）开播后还须主动调用 openLocalCamera / openLocalMicrophone 把自己的摄像头 / 麦克风采集并推流，画面与声音才会出现；观众（joinLive）进房后拉的是主播的远端流，无需自己开设备。注意：进房不会自动开摄像头 / 麦克风，不调用 open* 读到的永远是 Off（设备开关的「延迟变 On / 立即 Off / 纯设备操作」细节见「设备控制」组）。',
  'Card.LiveListIntro1Head': '快速开始',
  'Card.LiveListIntro1Item0':
    '想快速体验：先在本组 fetchLiveList 查看直播列表，再用 startLive（主播）或 joinLive（观众）进房，之后切到其它组（设备、PK、礼物等）才有数据。',
};
