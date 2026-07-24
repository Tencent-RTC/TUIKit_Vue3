// 简体中文 (zh-CN) i18n 资源 — 全局（非 state 列表）通用文案。
//
// 键集合必须与 `en-US/ui.ts` 完全一致；仅值不同（中文 vs 英文）。
// 各 state 列表的资源（菜单分组标题、示例标题、卡片描述）位于 `./cards/*`。

export const ui: Record<string, string> = {
  // Common
  'Common.Login': '登录',
  'Common.Logout': '退出',
  'Common.LoggingIn': '登录中…',
  'Common.Copy': '复制',
  'Common.Copied': '已复制',
  'Common.Run': '运行',
  'Common.Stop': '停止',
  'Common.Expand': '展开',
  'Common.Collapse': '收起',
  'Common.Hide': '隐藏',
  'Common.Show': '显示',
  'Common.Loading': '加载中…',
  'Common.Search': '搜索 API...',
  'Common.CopyLiveIdSuccess': '已复制 liveId 到剪贴板',
  'Common.CopyLiveIdFailed': '复制失败，请手动复制',
  'Common.Save': '保存',
  'Common.Saving': '保存中…',

  // Topbar
  'Topbar.Brand': 'LiveKit Vue3',
  'Topbar.Subtitle': 'API Example · tuikit-atomicx-vue3',
  'Topbar.GoHome': '返回初始页面',
  'Topbar.Role': '角色',
  'Topbar.CurrentLive': '当前直播间',
  'Topbar.CopyLiveId': '复制 liveId',
  'Topbar.StartLive': '开播',
  'Topbar.JoinLive': '加入直播间',
  'Topbar.UserIdPlaceholder': 'userId（dev 快速登录）',
  'Topbar.UserIdNoChinese': '不支持输入中文',
  'Topbar.LoggedIn': '已登录：',
  'Topbar.UserName': '用户名',
  'Topbar.AvatarUrl': '头像 URL',
  'Topbar.AvatarPlaceholder': '输入头像图片地址',
  'Topbar.UserId': 'userId',
  'Topbar.LoginDisabledHint': '请先填写 userId 再点击登录',
  'Login.UserIdRequired': 'userId 不能为空',
  'Login.KickedOfflineTitle': '账号在其他设备登录',
  'Login.KickedOfflineDesc': '您的账号已在其他设备登录，您已被迫下线。',
  'Login.ExpiredTitle': '登录已过期',
  'Login.ExpiredDesc': '您的登录凭证已过期，请重新登录。',

  // Role
  'Role.Unassigned': '未进房',
  'Role.Host': '主播',
  'Role.Audience': '观众',
  'Role.Admin': '管理员',
  'Role.TooltipUnassignedLoggedOut': '请先登录，然后选择以下方式进入直播间：\n• startLive 创建直播间 → 成为主播\n• joinLive 加入他人直播间 → 成为观众\n• 主播调用 setAdministrator 可将观众提升为管理员',
  'Role.TooltipUnassignedLoggedIn': '未进入直播间，选择以下方式开始：\n• startLive 创建直播间 → 成为主播\n• joinLive 加入他人直播间 → 成为观众\n• 主播调用 setAdministrator 可将观众提升为管理员',
  'Role.TooltipHost': '你是主播 · 通过 startLive 创建直播间后自动获得此身份\n• 可推流、管理观众、设置管理员\n• endLive 结束直播后回到「未进房」',
  'Role.TooltipAudience': '你是观众 · 通过 joinLive 加入他人直播间后自动获得此身份\n• 可观看直播、发弹幕、申请连麦\n• 主播调用 setAdministrator 可将你提升为管理员\n• leaveLive 离开后回到「未进房」',
  'Role.TooltipAdmin': '你是管理员 · 主播调用 setAdministrator 将你设为管理员后获得此身份\n• 拥有观众的所有能力\n• 可协助主播管理观众（踢人、禁言等）\n• 主播撤销管理员权限后回到观众身份',

  // Placeholder / home page
  'Placeholder.Title': '直播 State API Example',
  'Placeholder.Intro': '从左侧选择一个 API 查看：签名 · 入参 · 运行结果 · 事件日志 · 可复制片段。',
  'Placeholder.Hint1': '提示：先在右上角用任意 userId 完成 dev 登录。角色是「用户与某个直播间的关系」，只在进房后才成立 —— 登录完成时徽标显示「未进房」；调用 startLive 开播后自动变为「主播」，调用 joinLive 进入他人直播间后为「观众」，主播对你调 setAdministrator 后升为「管理员」；leaveLive / endLive 后回落「未进房」。角色由 SDK 状态自动推导，无需（也无法）手动切换。',
  'Placeholder.Hint2': '多角色联动：在另一个浏览器窗口（独立 userId）登录后进入相同 liveId，可以分别扮演主播 / 观众 / 管理员，便于观察 setAdministrator 等跨端事件。',

  // EventLog
  'EventLog.Title': 'Event Log',
  'EventLog.Export': '导出 JSON',
  'EventLog.Clear': '清空',
  'EventLog.Filter': '筛选',
  'EventLog.All': '全部',
  'EventLog.Empty': '暂无事件。订阅的事件触发后会实时显示在这里。',
  'EventLog.DockExpandTitle': '点击展开 Event Log · 全局事件日志',
  'EventLog.DockCollapseTitle': '收起 Event Log',
  'EventLog.DockUnreadCount': '未读事件数',
  'EventLog.DockLatest': '最新：',
  'EventLog.DockExpandHint': '点击展开 / 查看全部',
  'EventLog.DockCollapseHint': '点击收起',

  // Toast
  'Toast.StartLiveSuccess': '开播成功',
  'Toast.StartLiveDesc': '下一步：开启摄像头开始推流',
  'Toast.StartLiveAction': '开启摄像头推流',
  'Toast.JoinLiveSuccess': '已进入直播间',
  'Toast.JoinLiveDesc': '拉流画面已在右下角全局舞台展示',
  'Toast.JoinLiveAction': '查看播放控制',
  'Toast.LeaveLiveSuccess': '已离开直播间',
  'Toast.LeaveLiveDesc': '全局拉流舞台将自动隐藏',
  'Toast.EndLiveSuccess': '直播已结束',
  'Toast.EndLiveDesc': '观众端将收到 onLiveEnded',
  'Toast.CopyLiveIdSuccess': '已复制 liveId 到剪贴板',
  'Toast.CopyLiveIdFailed': '复制失败，请手动复制',
  'Toast.MicNotOpened': '提示：麦克风未开启',
  'Toast.MicNotOpenedDesc': '已开启摄像头，建议您同时开启麦克风以获得更好的直播体验',
  'Toast.MicNotOpenedAction': '开启麦克风',
  'Toast.RoleHost': '角色变更 · 主播',
  'Toast.RoleHostDesc': '开播成功，你已成为直播间主播',
  'Toast.RoleAudience': '角色变更 · 观众',
  'Toast.RoleAudienceDesc': '已进入直播间，当前身份为普通观众',
  'Toast.RoleAdmin': '角色变更 · 管理员',
  'Toast.RoleAdminDesc': '主播已将你设为直播间管理员',
  'Toast.RoleAdminRevoked': '角色变更 · 观众',
  'Toast.RoleAdminRevokedDesc': '主播已撤销你的管理员权限',
  'Toast.RoleLeftHost': '角色变更 · 未进房',
  'Toast.RoleLeftHostDesc': '直播已结束',
  'Toast.RoleLeft': '角色变更 · 未进房',
  'Toast.RoleLeftDesc': '已离开直播间',
  'Toast.CtaPrefix': '跳转到',
  'Toast.Dismiss': '关闭',

  // Suggested follow-up action labels (event-driven toast CTAs)
  'Toast.Action.AcceptGuestApplication': '同意上麦申请',
  'Toast.Action.AcceptHostInvitation': '接受连麦邀请',
  'Toast.Action.ViewSeatState': '查看麦位状态',
  'Toast.Action.ViewCoGuestState': '查看连麦状态',
  'Toast.Action.RefreshLiveList': '刷新直播列表',

  // Global stages
  'Stage.CameraTitle': '摄像头预览',
  'Stage.ScreenShareTitle': '屏幕分享',
  'Stage.LiveTitle': '直播画面',
  'Stage.ShowLive': '显示直播画面',

  // SDK source picker
  'Sdk.Switching': '切换中…',
  'Sdk.LocalSource': '本地源码',
  'Sdk.PanelTitle': '切换 SDK 版本 · tuikit-atomicx-vue3',
  'Sdk.WorkspaceTitle': '本地源码',
  'Sdk.WorkspaceSub': '使用仓库内 ui-component/packages 的源码（默认）',
  'Sdk.OnlineTitle': 'npm 已发布版本',
  'Sdk.Refresh': '从 npm 刷新版本列表',
  'Sdk.Loading': '加载中…',
  'Sdk.LoadingVersions': '正在从 npm 加载版本列表…',
  'Sdk.NoVersions': '暂无已发布版本',
  'Sdk.NpmError': '无法访问 npm',
  'Sdk.NpmErrorSuffix': '仅显示本地已安装的版本',
  'Sdk.Prereleases': '预发布版本',
  'Sdk.MissingExports': '当前 SDK 缺少',
  'Sdk.MissingExportsSuffix': '个 demo 依赖的导出',
  'Sdk.MissingMore': '还有',
  'Sdk.MissingMoreSuffix': '个',
  'Sdk.Peers': '关联依赖',
  'Sdk.InstallPlaceholder': '如 6.2.5 / latest / next',
  'Sdk.Install': '安装',
  'Sdk.Installing': '安装中…',
  'Sdk.Installed': '已安装',
  'Sdk.InstalledClickToSwitch': '，点击上方对应版本切换',
  'Sdk.InstallFailed': '安装失败',
  'Sdk.SwitchFailed': '切换失败',
  'Sdk.NotAvailable': '当前构建不支持安装功能',
  'Sdk.LoadStateFailed': '加载 SDK 状态失败',
  'Sdk.OverlayRestarting': '正在切换到',
  'Sdk.OverlayRestartingGeneric': '正在切换 SDK 版本…',
  'Sdk.OverlaySwitching': '正在切换到',
  'Sdk.OverlaySwitchingGeneric': '正在切换 SDK 源…',
  'Sdk.OverlayInstalling': '正在安装',
  'Sdk.OverlayInstallingGeneric': '正在安装 SDK…',
  'Sdk.OverlayRestartSub': 'Vite 正在重启，页面将自动刷新',
  'Sdk.OverlaySwitchSub': 'Vite 即将重启',
  'Sdk.OverlayInstallSub': '正在通过 npm 下载包及关联依赖，可能需要一分钟',
  'Sdk.TooltipWorkspace': 'tuikit-atomicx-vue3（本地源码）\n来自仓库内 ui-component/packages/uikit-component-vue3，点击切换',
  'Sdk.TooltipOnline': '来自 npm 已发布版本，点击切换',
  'Sdk.VersionOnDisk': '已下载 · 兼容',
  'Sdk.VersionIncompatible': '缺少',
  'Sdk.VersionIncompatibleSuffix': '个导出 — 受影响的 API 卡片将被禁用',
  'Sdk.VersionInstalling': '安装中…',
  'Sdk.VersionPreviously': '曾安装',
  'Sdk.VersionPublished': '发布于',
  'Sdk.VersionInstallSwitch': '安装并切换',
  'Sdk.VersionReinstallSwitch': '重新安装并切换',
  'Sdk.VersionTitlePublished': '发布于',
  'Sdk.VersionTitleOnDisk': '已下载到本地，点击切换',
  'Sdk.VersionTitleReinstall': '之前安装过，点击重新安装并切换',
  'Sdk.VersionTitleInstall': '点击安装并切换',
  'Sdk.VersionTitleIncompatiblePrefix': '缺少 demo 依赖的导出',
  'Sdk.VersionTitleIncompatibleSuffix': '点击仍可切换，受影响的 API 卡片将被禁用',

  // Left API list status badges. Group/example titles are the Chinese
  // source literals used as i18n keys, so zh-CN falls back to the key
  // itself — only the badges need explicit entries here.
  'Menu.Pending': '规划中',
  'Menu.SdkUnavailable': 'SDK 不可用',

  // Language switcher
  'Lang.Switch': '中/EN',
  'Lang.SwitchLanguage': '切换语言',

  // Card UI (shared chrome across all API cards)
  'Card.ApiSignature': 'API 签名',
  'Card.Inputs': '输入参数',
  'Card.Output': '输出',
  'Card.Error': '错误',
  'Card.CodeSnippet': '代码片段',
  'Card.Run': '运行',
  'Card.Running': '运行中…',
  'Card.NotImplemented': '该示例暂未实现 run 逻辑',
  'Card.LoginRequired': '请先在顶部登录',
  'Card.RoleRestricted': "当前角色不可用，仅限：",
  'Card.NotInRoom': '未在直播间中——请先加入或开始直播',
  'Card.AlreadyOnSeat': '已在麦位上——请先下麦',
  'Card.AutoFill': '自动填充',
  'Card.AutoFillTitle': '将随事件自动填充',
  'Card.UsageNotes': '使用须知',
  'Card.GroupIntroLabel': '本组说明',
  'Card.RenderCarrier': '渲染载体',
  'Card.LiveViewCarrier': 'LiveView 拉流（全局）',
  'Card.CameraCarrier': '本地摄像头预览（全局）',
  'Card.NoteHeadMust': '接入须知',
  'Card.NoteHeadEnv': '业务 / 环境前提',
  'Card.NoChineseInline': '不支持输入中文',
  'Card.RequiredFieldEmpty': '{{field}} 不能为空',
  'Card.AlreadyLoggedIn': '已登录',
  // Card helper text
  'Card.CameraPreviewStartedLead': '摄像头预览已开启（右下角全局悬浮） · 运行',
  'Card.CameraPreviewStartedTail': '或点击悬浮窗「停止」按钮关闭',
  'Card.CameraPreviewNotStartedLead': '摄像头预览未开启：运行',
  'Card.CameraPreviewNotStartedTail': '后右下角会自动出现本地画面。',
  'Card.LiveViewMountedLead': '全局 LiveView 已挂载（右下角） · 当前直播间',
  'Card.LiveViewNotJoinedLead': '尚未进入直播间：观众先运行',
  'Card.LiveViewNotJoinedMid': '，主播先运行',
  'Card.LiveViewNotJoinedTail': '，进房后右下角会自动出现拉流画面。',

  // Default success-toast description (used when an example's
  // `successToast` has no `description`). See ExampleCard.vue.
  'Card.SuccessToastDefault': '调用成功',

  // Mount-carrier Usage notes — LiveView (rendered by ExampleCard.vue)
  'Card.MountNotesSummaryLiveView': 'LiveView',
  'Card.LiveViewMustItem0':
    '<strong>全局单实例</strong>：LiveView 渲染固定容器 <code>#atomicx-live-stream-content</code> 并绑定全局播放器单例，'
    + '整个应用任一时刻只能挂载一份。本站点把 LiveView 提升到 App 级常驻容器（右下角），'
    + '多卡跨切换始终可见；业务接入同样应在路由/布局层做到「单实例常驻」，避免每个页面/卡片重复挂载。',
  'Card.LiveViewMustItem1':
    '<strong>父容器需提供尺寸</strong>：组件根 <code>.live-core-view-container</code> 为 <code>width:100%; height:100%</code>，'
    + '父容器无确定宽高时视频区域会塌陷为 0（全局舞台为 16:9、宽 360px）。',
  'Card.LiveViewMustItem2':
    '<strong>浏览器自动播放策略</strong>：未与页面交互前，浏览器可能拒绝带声音的自动播放（画面黑屏 / 无声）。'
    + 'LiveView 检测到 <code>onAutoPlayFailed</code> 会自动弹出内置 <code>DefaultAutoPlayPrompt</code> 引导用户点击恢复，业务侧无需自行处理该事件；'
    + '若默认浮层样式与产品风格不搭，可用 <code>autoplay-prompt</code> 具名插槽替换为自定义 UI。',
  'Card.LiveViewEnvItem0':
    '<strong>画面来源</strong>：拉流画面取决于房间内是否有主播推流，挂载完成 ≠ 立即有画面。'
    + '双窗口验证：主播窗口 <code>startLive</code> + <code>openLocalCamera</code>，观众窗口 <code>joinLive</code>。',
  'Card.LiveViewEnvItem1':
    '<strong>主题</strong>：依赖 <code>UIKitProvider</code> 注入的全局 CSS 变量，整个 uikit-base 体系的前提，未包裹时所有组件样式异常。',

  // Mount-carrier Usage notes — Camera test (rendered by ExampleCard.vue)
  'Card.MountNotesSummaryCameraTest': 'startCameraTest',
  'Card.NoteHeadEnvCamera': '设备 / 环境前提',
  'Card.CameraTestMustItem0':
    '<strong>渲染目标由 view 决定</strong>：<code>startCameraTest({ view })</code> 把本地预览渲染到调用方传入的 <code>view</code> 容器（DOM id 或元素）。'
    + '它与 <code>openLocalCamera</code>（采集并推流）相互独立、可并存——一个是本地设备预览，一个是对外推流。',
  'Card.CameraTestMustItem1':
    '<strong>调用前 RoomEngine 已 ready</strong>：需在 <code>TUIRoomEngine.once(\'ready\', ...)</code> 之后调用；不依赖是否进房（无需先 startLive / joinLive）。',
  'Card.CameraTestMustItem2':
    '<strong>endLive / leaveLive 不会自动停止预览</strong>：state 接口在退房或关播后不会自动调用 <code>stopCameraTest()</code>，预览会持续占用摄像头。'
    + '务必在合适时机显式调用 <code>stopCameraTest()</code> 释放设备。',
  'Card.CameraTestEnvItem0':
    '<strong>同摄像头仅一路测试流</strong>：同一物理设备只有一条采集流，重复调用 <code>startCameraTest</code> 会接管同一路流。',
  'Card.CameraTestEnvItem1':
    '<strong>权限与 HTTPS</strong>：首次调用触发浏览器权限弹窗；非 HTTPS / 非 localhost 下 <code>getUserMedia</code> 不可用。',

  // State inspector (reactive snapshot panel) — shared render tokens.
  'Card.StateInspector': '响应式状态',
  'State.On': '开',
  'State.Off': '关',
  'State.Count': '{{count}} 个',
  'State.Empty': '(空)',
  // Enum member labels for `kind: 'enum'` rows — key is `State.Enum.<RawEnumMemberName>`.
  'State.Enum.UNKNOWN': '未知',
  'State.Enum.LOGINED': '已登录',
  'State.Enum.Off': '关',
  'State.Enum.On': '开',
  'State.Enum.NoError': '无错误',
  'State.Enum.NoDeviceDetected': '未检测到设备',
  'State.Enum.NoSystemPermission': '无系统权限',
  'State.Enum.NotSupportCapture': '不支持采集',
  'State.Enum.OccupiedError': '设备被占用',
  'State.Enum.UnknownError': '未知错误',
  'State.Enum.Connected': '已连接',
  'State.Enum.Disconnected': '未连接',
  // Per-field format placeholders / units — `t` is passed into `format`.
  'State.Placeholder.NotInLive': '(未进入直播间)',
  'State.Placeholder.None': '(无)',
  'State.Placeholder.NotStarted': '(未进行)',
  'State.Placeholder.NotOnSeat': '(未上麦)',
  'State.Unit.Times': '{{count}} 次',
  'State.Unit.Seconds': '{{count}} 秒',

  // Select placeholder fallback (PrettySelect) when no per-field placeholder is set.
  'Card.PleaseSelect': '请选择',
  // Role-badge tooltip reasons (derivedRole.ts), shown on hover.
  'Role.ReasonNotLoggedIn': '尚未登录 · 角色未定',
  'Role.ReasonUnassigned':
    '未进入任何直播间 · 角色需要通过 startLive（成为主播）或 joinLive（成为观众）后才能确定',
  'Role.ReasonHost': '你是 currentLive.liveOwner（{{userId}}）· 由 useLiveListState 派生',
  'Role.ReasonAdmin': 'SDK getUserInfo / onUserInfoChanged 报告 userRole = TUIRole.kAdministrator',
  'Role.ReasonAudience': '已进入 {{ownerId}} 的直播间，且未被设为管理员',
  // 运行时 run() 抛出的防御性错误（各示例组共用）。
  'Error.BattleUserIdEmpty':
    '目标 userId 为空：请先在 co-host 组运行 requestHostConnection 建立连线，再让对端 acceptHostConnection；连线成功后本卡片下拉才会出现可选项',
  'Error.BattleIdEmpty': 'battleId 不能为空',
  'Error.BattleTargetUserIdEmpty': '目标 userId 不能为空',
  'Error.CoHostLiveIdEmpty':
    '目标 liveId 为空：请先运行 getCoHostCandidates 拉取候选列表，再在下拉中选择目标主播',
  'Error.CoHostTargetLiveIdEmpty': '目标 liveId 不能为空',
  'Error.CoHostInviterLiveIdEmpty': '邀请方 liveId 不能为空',
  'Error.CoHostRemoteLiveIdEmpty': '远端主播 liveId 不能为空',
  'Error.LoginUserIdEmpty': 'userId 不能为空',
  'Error.LoginSelfInfoEmpty': '请至少填写 userName 和 avatarUrl 之一',
  'Error.BarrageTextEmpty': '文本内容不能为空',
  'Error.BarrageBusinessIdEmpty': 'businessId 不能为空',
  'Error.BarrageTipEmpty': '提示文本不能为空',
  'Error.BarrageNotJsonObject': '{{fieldName}} 必须是 JSON 对象（键值对）',
  'Error.BarrageJsonParseFailed': '{{fieldName}} JSON 解析失败：{{reason}}',
  'Error.GiftIdEmpty':
    'giftId 为空：请先运行 refreshGiftList 拉取礼物列表，再在 giftId 下拉中选择具体礼物',
  'Error.DeviceRoomRequired':
    '{{api}} 需要先进入直播间（调用 startLive 或 joinLive）才能使用',
  'Error.DeviceSeatRequired':
    '{{api}} 需要先上麦：观众需通过 useCoGuestState 的 applyForSeat 发起申请，待主播同意后才可以调用',
  'Error.PlayerResListEmpty': 'resolutionList 为空；请先开始播放',
  'Error.PlayerResOutOfRange': 'resolutionList 越界：index={{index}}',
};
