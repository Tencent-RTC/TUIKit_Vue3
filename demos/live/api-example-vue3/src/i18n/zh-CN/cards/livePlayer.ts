// 简体中文 (zh-CN) i18n 资源 — 与 `en-US/cards/livePlayer.ts` 键集合保持一致；仅值不同。

export const livePlayer: Record<string, string> = {
  'Card.LivePlayerStateNote1Item0': "播放器对上层屏蔽了底层拉流来源差异，对外统一暴露 pause / resume / setVolume / switchResolution 等控制；底层具体是实时拉流还是 CDN 拉流由引擎按拉流 URL 协议自动选择，接入方无需感知。",
  'Card.LivePlayerSetVolumeFieldVolume': "volume(0-100)",
  'Card.LivePlayerSetAutoHideDelayFieldDelay': "delay(ms)",
  'Menu.LivePlayer': "播放控制",
  'Menu.LivePlayerState': "播放器渲染舞台 + 读取状态",
  'Menu.LivePlayerPause': "暂停",
  'Menu.LivePlayerResume': "恢复播放",
  'Menu.LivePlayerRefresh': "刷新（恢复音量/分辨率）",
  'Menu.LivePlayerSetVolume': "设置音量",
  'Menu.LivePlayerMute': "静音",
  'Menu.LivePlayerUnmute': "取消静音",
  'Menu.LivePlayerRequestFullscreen': "进入全屏",
  'Menu.LivePlayerExitFullscreen': "退出全屏",
  'Menu.LivePlayerRequestPictureInPicture': "进入画中画",
  'Menu.LivePlayerExitPictureInPicture': "退出画中画",
  'Menu.LivePlayerSwitchResolution': "切换分辨率",
  'Menu.LivePlayerAddCustomButtons': "注入自定义按钮（experimental）",
  'Menu.LivePlayerShowControlBar': "显示控制条",
  'Menu.LivePlayerHideControlBar': "隐藏控制条",
  'Menu.LivePlayerSetAutoHideDelay': "设置控制条自动隐藏延时",
  'Card.LivePlayerStateDesc': '播放状态（isPlaying / volume / resolution 等）的响应式快照。',
  'Card.LivePlayerStateNoteSummary': '播放控制前置条件',
  'Card.LivePlayerStateNote0Item0':
    'LiveView 是所有播放控制的可观察前置：暂停 / 恢复 / setVolume / switchResolution 都只作用于当前已挂载的 LiveView。本卡片下方就挂载了一个 LiveView —— 若看不到画面，请先在本卡片确认它已就绪。',
  'Card.LivePlayerSwitchResolutionFieldIndex': '分辨率',
  'Card.LivePlayerSwitchResolutionFieldIndexHelp':
    '必须先开始播放；resolutionList 在播放开始后才填充',
  'Card.LivePlayerSwitchResolutionFieldIndexOpt':
    '— 等待 resolutionList（请先开始播放）',
  'Card.LivePlayerSubscribeEventDesc': "本组挂载时已默认订阅 [[PlayerControlEvent|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-PlayStateChange]] 全部事件（演示 handler；带 `[demo]<事件名>` 前缀的日志行）。若被下方 unsubscribeEvent 卡片取消，可在此选择\"全部\"或单个事件重新订阅；若该事件已在订阅中，本次调用是幂等空操作。",
  'Card.LivePlayerSubscribeEventFieldEventHelp': "选 (all events) 表示对全部事件批量订阅",
  'Card.LivePlayerSubscribeEventToastTitle': "已订阅",
  'Card.LivePlayerSubscribeEventToastDesc': "该事件下次触发时，EventLog 会同时出现 \"[demo]\" 前缀的日志行",
  'Card.LivePlayerUnsubscribeEventDesc': "从 [[PlayerControlEvent|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-PlayStateChange]] 中取消订阅一个或全部事件。取消后该事件再次触发时，EventLog 里 \"[demo] xxx\" 前缀的日志行不再出现（不带前缀的常规事件行仍由站点的常驻日志订阅捕获）。⚠️ 真实业务中调用必须传与 subscribeEvent 时「完全相同」的 handler 引用，否则 SDK 会查找不到并静默失败。",
  'Card.LivePlayerUnsubscribeEventFieldEventHelp': "选 (all events) 表示对全部事件批量取消订阅",
  'Card.LivePlayerUnsubscribeEventToastTitle': "已取消订阅",
  'Card.LivePlayerUnsubscribeEventToastDesc': "该事件下次触发时，EventLog 不再出现 \"[demo]\" 前缀的日志行",
  // Group intro — verified against LivePlayerState source
  'Card.LivePlayerIntroSummary': '进房后播放自动开始，本组只提供播放之上的控制',
  'Card.LivePlayerIntro0Head': '关键点',
  'Card.LivePlayerIntro0Item0':
    '你不需要也不能主动「开始播放」：进入直播间(或上麦)后播放由内部自动开始，isPlaying 在拿到 liveId 时即置 true；本组只提供暂停 / 恢复 / 刷新等「已挂载播放器」之上的控制，没有 startPlay/stopPlay。',
  'Card.LivePlayerIntro0Item1':
    '拉流来源差异(实时 / CDN)对上层不可见，引擎按拉流 URL 协议自动选择，本组统一只暴露 pause/resume/setVolume/switchResolution 等控制。',
  'Card.LivePlayerIntro0Item2':
    '分辨率列表 resolutionList 初始为空，只有播放开始后才填充；在此之前 switchResolution 没有可切换目标。',
  'Card.LivePlayerIntro1Head': '常见陷阱',
  'Card.LivePlayerIntro1Item0':
    '未进房 / 未开始播放就调用控制 API，可能因引擎实例或播放态问题失败抛错；switchResolution 在 resolutionList 为空时无目标。',
  'Card.LivePlayerIntro1Item1':
    'requestFullscreen() 返回 FullscreenResult 且不抛异常：失败时 success=false、isFullscreen 不会被置真，调用方需自行判断返回值，不要只读 isFullscreen。',
  'Card.LivePlayerIntro1Item2':
    'switchResolution 必须传 resolutionList 里的 {label,value} 对象，不能直接传数字；setVolume 只接受 0–100，越界会直接 throw。',
  'Card.LivePlayerIntro1Item3':
    'hideControlBar() 把控制条「锁死」隐藏，悬停 / 点击画面都不会再弹出，必须显式 showControlBar() 才恢复。',
};
