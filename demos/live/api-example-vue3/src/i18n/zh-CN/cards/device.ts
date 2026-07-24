// 简体中文 (zh-CN) i18n 资源 — 与 `en-US/cards/device.ts` 键集合保持一致；仅值不同。

export const device: Record<string, string> = {
  'Card.DeviceSetCurrentCameraFieldDeviceId': "deviceId",
  'Card.DeviceSetCurrentMicrophoneFieldDeviceId': "deviceId",
  'Card.DeviceSetCaptureVolumeFieldVolume': "volume(0-100)",
  'Card.DeviceSetOutputVolumeFieldVolume': "volume(0-100)",
  'Card.DeviceStartScreenShareDesc': "开始屏幕分享（可选携带系统音频 screenAudio、指定分享视图 view）。底层调用 RoomEngine.startScreenSharing，依赖已进房且上麦。",
  'Card.DeviceStartScreenShareNoteSummary': "startScreenShare · 角色前置条件与限制",
  'Card.DeviceStartScreenShareNote0Item0': "主播：开播后（startLive 已完成）即可调用。",
  'Card.DeviceStartScreenShareNote0Item1': "观众：需先 joinLive 进入房间，再通过 applyForSeat 申请上麦并被主播同意（进入 seatList 后）才可调用。未进房或未上麦调用会被底层 RoomEngine 拒绝并抛错。",
  'Card.DeviceStartScreenShareNote1Item0': '本 demo 不会将屏幕分享流合入混流：当摄像头同时开启时，观众通过 startPlayStream 观看只能看到摄像头画面，看不到屏幕分享内容。屏幕分享预览仅在本地 ScreenShareStage 窗口中可见。若需让观众看到屏幕分享，可先关闭摄像头（使屏幕分享成为唯一视频源），或接入 VideoMixerState 构建包含屏幕分享流的自定义混图布局。',
  'Card.DeviceStartScreenShareFieldScreenAudio': "screenAudio(系统音频)",
  'Card.DeviceStartScreenShareFieldView': "view（分享视图 ID）",
  'Card.DeviceStartScreenShareFieldViewHelp': '本地屏幕分享预览的容器元素 ID；默认使用全局 ScreenShareStage',
  'Card.DeviceStopScreenShareDesc': "停止当前屏幕分享。摄像头 / 麦克风采集（若已开启）不受影响，继续推流。",
  'Card.DeviceStateDesc':
    '摄像头 / 麦克风开关状态、当前选中设备、设备列表数量、采集 / 播放音量、屏幕分享状态等响应式状态快照。',
  'Card.DeviceStateNoteSummary': 'device.state · 进入自动拉取',
  'Card.DeviceStateNote0Item0':
    '进入本卡片时，会自动调用 getCameraList() / getMicrophoneList() 枚举设备并写入 cameraList / microphoneList，无需手动点击对应枚举卡片。结果实时展示在上方「响应式状态」面板。',
  'Menu.Device': "设备控制",
  'Menu.DeviceState': "读取设备状态（cameraStatus / microphoneStatus / 设备列表 / 音量）",
  'Menu.DeviceStartCameraTest': "本地摄像头预览（开启摄像头测试）",
  'Menu.DeviceStopCameraTest': "停止本地预览",
  'Menu.DeviceOpenLocalCamera': "开启摄像头采集",
  'Menu.DeviceCloseLocalCamera': "关闭摄像头采集",
  'Menu.DeviceOpenLocalMicrophone': "开启麦克风采集",
  'Menu.DeviceCloseLocalMicrophone': "关闭麦克风采集",
  'Menu.DeviceStartScreenShare': "开始屏幕分享",
  'Menu.DeviceStopScreenShare': "停止屏幕分享",
  'Menu.DeviceGetCameraList': "枚举摄像头设备",
  'Menu.DeviceSetCurrentCamera': "切换摄像头设备",
  'Menu.DeviceGetMicrophoneList': "枚举麦克风设备",
  'Menu.DeviceSetCurrentMicrophone': "切换麦克风设备",
  'Menu.DeviceSetCaptureVolume': "设置采集音量",
  'Menu.DeviceSetOutputVolume': "设置播放音量",
  'Card.DeviceStartCameraTestDesc':
    '端到端：开播前 / 后的本地预览。状态层只负责采集；画面渲染到全局浮层容器（右下角）。进入房间前也可使用。',
  'Card.DeviceOpenLocalCameraDesc': '开启本地摄像头采集并推流。',
  'Card.DeviceOpenLocalCameraNoteSummary': 'openLocalCamera · 角色前置条件',
  'Card.DeviceOpenLocalCameraNote0Item0': '主播：开播（startLive 完成）后即可调用。',
  'Card.DeviceOpenLocalCameraNote0Item1':
    '观众：需先 joinLive 进入房间，再通过 applyForSeat 申请上麦，并经主播批准（出现在 seatList）后才能调用。未进房或未上麦时调用会被底层 RoomEngine 报错拒绝。',
  'Card.DeviceCloseLocalCameraDesc':
    '主播或已上麦观众用于停止本地摄像头采集。',
  'Card.DeviceOpenLocalMicrophoneDesc': '开启本地麦克风采集并推流。',
  'Card.DeviceOpenLocalMicrophoneNoteSummary': 'openLocalMicrophone · 角色前置条件',
  'Card.DeviceOpenLocalMicrophoneNote0Item0': '主播：开播（startLive 完成）后即可调用。',
  'Card.DeviceOpenLocalMicrophoneNote0Item1':
    '观众：必须先通过 applyForSeat 申请上麦，并经主播批准（出现在 seatList）后才能调用。未上麦时调用会被底层 RoomEngine 报错拒绝。',
  'Card.DeviceCloseLocalMicrophoneDesc':
    '主播或已上麦观众用于停止本地麦克风采集。',
  'Card.DeviceSetCurrentCameraFieldDeviceIdHelp': '先运行「枚举摄像头设备」获取 deviceId',
  'Card.DeviceSetCurrentMicrophoneFieldDeviceIdHelp': '先运行「枚举麦克风设备」获取 deviceId',

  // SetCurrentCamera / SetCurrentMicrophone / SetCaptureVolume / SetOutputVolume 调用条件（notes，保持键集合与 en-US 一致）
  'Card.DeviceSetCurrentCameraNoteSummary': 'setCurrentCamera · 调用条件',
  'Card.DeviceSetCurrentCameraNote0Item0':
    '进房前 / 进房后均可调用；只要 SDK 已就绪（已登录）即可，不依赖进房 / 上麦。设备「切换 / 枚举」属于纯设备操作，与采集开关相互独立。',
  'Card.DeviceSetCurrentCameraNote1Item0':
    '若当前正在推流（已开摄像头），切换会实时改变上行画面所用的摄像头；推流前切换则只改变默认设备。',
  'Card.DeviceSetCurrentMicrophoneNoteSummary': 'setCurrentMicrophone · 调用条件',
  'Card.DeviceSetCurrentMicrophoneNote0Item0':
    '进房前 / 进房后均可调用；只要 SDK 已就绪（已登录）即可，不依赖进房 / 上麦。设备「切换 / 枚举」属于纯设备操作，与采集开关相互独立。',
  'Card.DeviceSetCurrentMicrophoneNote1Item0':
    '若当前正在推流（已开麦克风），切换会实时改变上行音频所用的麦克风；推流前切换则只改变默认设备。',
  'Card.DeviceSetCaptureVolumeNoteSummary': 'setCaptureVolume · 调用条件',
  'Card.DeviceSetCaptureVolumeNote0Item0':
    '进房前 / 进房后均可调用；只要 SDK 已就绪（已登录）即可，不依赖进房 / 上麦。',
  'Card.DeviceSetCaptureVolumeNote0Item1':
    '控制的是「本端上行音频的采集音量」，影响对端听到你的音量大小，不影响本地监听。',
  'Card.DeviceSetCaptureVolumeNote1Item0':
    '进房前设置的值，进房推流后依然生效，无需重复设置。',
  'Card.DeviceSetOutputVolumeNoteSummary': 'setOutputVolume · 调用条件',
  'Card.DeviceSetOutputVolumeNote0Item0':
    '进房前 / 进房后均可调用；只要 SDK 已就绪（已登录）即可，不依赖进房 / 上麦。',
  'Card.DeviceSetOutputVolumeNote0Item1':
    '控制的是「本地播放远端音频的音量」，属于本端听感，不影响对端或其他观众。',
  'Card.DeviceSetOutputVolumeNote1Item0':
    '进房前（尚无远端流）设置仅记录数值，进房拉流后自动生效。',
  'Card.DeviceSubscribeEventDesc': "本组挂载时已默认订阅 DeviceEvent 全部事件（演示 handler；带 `[demo]<事件名>` 前缀的日志行）。若被下方 unsubscribeEvent 卡片取消，可在此选择\"全部\"或单个事件重新订阅；若该事件已在订阅中，本次调用是幂等空操作。",
  'Card.DeviceSubscribeEventFieldEventHelp': "选 (all events) 表示对全部事件批量订阅",
  'Card.DeviceSubscribeEventToastTitle': "已订阅",
  'Card.DeviceSubscribeEventToastDesc': "该事件下次触发时，EventLog 会同时出现 \"[demo]\" 前缀的日志行",
  'Card.DeviceUnsubscribeEventDesc': "从 DeviceEvent 中取消订阅一个或全部事件。取消后该事件再次触发时，EventLog 里 \"[demo] xxx\" 前缀的日志行不再出现（不带前缀的常规事件行仍由站点的常驻日志订阅捕获）。⚠️ 真实业务中调用必须传与 subscribeEvent 时「完全相同」的 handler 引用，否则 SDK 会查找不到并静默失败。",
  'Card.DeviceUnsubscribeEventFieldEventHelp': "选 (all events) 表示对全部事件批量取消订阅",
  'Card.DeviceUnsubscribeEventToastTitle': "已取消订阅",
  'Card.DeviceUnsubscribeEventToastDesc': "该事件下次触发时，EventLog 不再出现 \"[demo]\" 前缀的日志行",

  // Device group intro (G6): what the status flags actually mean
  'Card.DeviceIntroSummary': 'cameraStatus / microphoneStatus 等状态 = 当前是否真的在采集并推流',
  'Card.DeviceIntro0Item0':
    '调用 openLocalCamera / openLocalMicrophone 之后，SDK 需要一点时间真正打开设备并开始推流，状态会在「稍等片刻」后才变成 On，不是瞬间完成——所以不要在 open 之后立刻断言状态已经是 On。注意：进入房间不会自动开摄像头 / 麦克风，不主动调用 openLocalCamera / openLocalMicrophone，读到的永远是 Off。另外 openLocalCamera / openLocalMicrophone 还有角色前置：主播需已 startLive 开播；观众需先 applyForSeat 上麦、经主播批准出现在 seatList 后才能调用，否则调用被底层 RoomEngine 报错拒绝（详见各 API 卡片的「使用须知」）。',
  'Card.DeviceIntro0Item1':
    'closeLocalCamera / closeLocalMicrophone 会立即把状态置为 Off，无需等待；屏幕分享若被系统弹窗「停止共享」，screenStatus 也会自动回到 Off，不用你手动处理。',
  'Card.DeviceIntro0Item2':
    'startCameraTest 只是本地摄像头预览（不推流），和 openLocalCamera 的「采集并推流」互不影响，不进房也能用，且不会随 endLive / leaveLive 自动结束，记得显式调用 stopCameraTest()。getCameraList / getMicrophoneList / setCurrentCamera / setCurrentMicrophone 是纯设备操作，随时可调用，跟是否进房、是否推流都无关。',
};
