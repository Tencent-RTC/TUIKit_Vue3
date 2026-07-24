// 简体中文 (zh-CN) i18n 资源 — 与 `en-US/cards/liveSeat.ts` 键集合保持一致；仅值不同。

export const liveSeat: Record<string, string> = {
  // Menu
  'Menu.LiveSeat': "麦位管理",
  'Menu.LiveSeatState': "读取麦位状态（seatList / canvas / speakingUsers / networkQualities / avStatistics）",
  'Menu.LiveSeatTakeSeat': "上麦",
  'Menu.LiveSeatLeaveSeat': "下麦",
  'Menu.LiveSeatLockSeat': "锁定麦位（主播 / 管理员）",
  'Menu.LiveSeatUnlockSeat': "解锁麦位（主播 / 管理员）",
  'Menu.LiveSeatKickUserOutOfSeat': "踢用户下麦（主播 / 管理员）",
  'Menu.LiveSeatMoveUserToSeat': "移动用户到指定麦位（主播 / 管理员）",
  'Menu.LiveSeatOpenRemoteCamera': "开启远端摄像头 — 管理员解锁（主播 / 管理员）",
  'Menu.LiveSeatCloseRemoteCamera': "关闭远端摄像头（主播 / 管理员）",
  'Menu.LiveSeatOpenRemoteMicrophone': "开启远端麦克风 — 管理员解锁（主播 / 管理员）",
  'Menu.LiveSeatCloseRemoteMicrophone': "关闭远端麦克风（主播 / 管理员）",
  'Menu.LiveSeatMuteMicrophone': "静音本地麦克风",
  'Menu.LiveSeatUnmuteMicrophone': "取消静音本地麦克风",
  'Menu.LiveSeatStartPlayStream': "开始播放流",
  'Menu.LiveSeatStopPlayStream': "停止播放流",
  'Menu.LiveSeatSubscribeEvent': "订阅 LiveSeatEvent",
  'Menu.LiveSeatUnsubscribeEvent': "取消订阅 LiveSeatEvent",

  // state card
  'Card.LiveSeatStateDesc':
    '麦位布局、画布、正在说话用户、网络质量、音视频统计的响应式快照。',

  // takeSeat card
  'Card.LiveSeatTakeSeatDesc':
    '主播和管理员直接上麦，无需申请。观众和管理员推荐使用 [[applyForSeat|applyForSeat]]（发送申请后由主播或管理员批准）。',
  'Card.LiveSeatTakeSeatFieldSeatIndex': "seatIndex",
  'Card.LiveSeatTakeSeatToastTitle': "上麦成功",
  'Card.LiveSeatTakeSeatToastDesc': "你已上到 #${seatIndex} 号麦位",

  // leaveSeat card
  'Card.LiveSeatLeaveSeatDesc':
    '离开当前麦位，释放麦位给其他用户。',
  'Card.LiveSeatLeaveSeatToastTitle': "已下麦",
  'Card.LiveSeatLeaveSeatToastDesc': "你已离开麦位",

  // lockSeat card
  'Card.LiveSeatLockSeatDesc':
    '锁定麦位，锁定后用户无法上麦。仅限主播 / 管理员。',
  'Card.LiveSeatLockSeatFieldSeatIndex': "seatIndex",
  'Card.LiveSeatLockSeatToastTitle': "麦位已锁定",
  'Card.LiveSeatLockSeatToastDesc': "#${seatIndex} 号麦位已锁定",

  // unlockSeat card
  'Card.LiveSeatUnlockSeatDesc':
    '解锁之前锁定的麦位。仅限主播 / 管理员。',
  'Card.LiveSeatUnlockSeatFieldSeatIndex': "seatIndex",
  'Card.LiveSeatUnlockSeatToastTitle': "麦位已解锁",
  'Card.LiveSeatUnlockSeatToastDesc': "#${seatIndex} 号麦位已解锁",

  // kickUserOutOfSeat card
  'Card.LiveSeatKickUserOutOfSeatDesc':
    '强制将用户踢下麦位。仅限主播 / 管理员。',
  'Card.LiveSeatKickUserOutOfSeatFieldUserId': "userId",
  'Card.LiveSeatKickUserOutOfSeatToastTitle': "用户已被踢下麦",
  'Card.LiveSeatKickUserOutOfSeatToastDesc': "该用户已被强制下麦",

  // moveUserToSeat card
  'Card.LiveSeatMoveUserToSeatDesc':
    '将用户移动到其他麦位，支持冲突策略。仅限主播 / 管理员。',
  'Card.LiveSeatMoveUserToSeatFieldUserId': "userId",
  'Card.LiveSeatMoveUserToSeatFieldTargetIndex': "targetIndex",
  'Card.LiveSeatMoveUserToSeatFieldPolicy': "policy",
  // Option values are MoveSeatPolicy enum numbers (0/1/2); cardKey uses String(value).
  'Card.LiveSeatMoveUserToSeatFieldPolicyOpt0': "AbortWhenOccupied",
  'Card.LiveSeatMoveUserToSeatFieldPolicyOpt0Meta': "目标麦位被占用则中止",
  'Card.LiveSeatMoveUserToSeatFieldPolicyOpt1': "ForceReplace",
  'Card.LiveSeatMoveUserToSeatFieldPolicyOpt1Meta': "强制替换目标麦位上的用户",
  'Card.LiveSeatMoveUserToSeatFieldPolicyOpt2': "SwapPosition",
  'Card.LiveSeatMoveUserToSeatFieldPolicyOpt2Meta': "与目标麦位上的用户互换位置",
  'Card.LiveSeatMoveUserToSeatToastTitle': "用户已移动",
  'Card.LiveSeatMoveUserToSeatToastDesc': "该用户已移动到目标麦位",

  // openRemoteCamera card
  'Card.LiveSeatOpenRemoteCameraDesc':
    "解锁上麦用户的摄像头，使其可以自行开启。仅限主播 / 管理员。",
  'Card.LiveSeatOpenRemoteCameraFieldUserId': "userId",
  'Card.LiveSeatOpenRemoteCameraToastTitle': "摄像头已解锁",
  'Card.LiveSeatOpenRemoteCameraToastDesc': "该用户现在可以开启摄像头",

  // closeRemoteCamera card
  'Card.LiveSeatCloseRemoteCameraDesc':
    "强制关闭上麦用户的摄像头。仅限主播 / 管理员。",
  'Card.LiveSeatCloseRemoteCameraFieldUserId': "userId",
  'Card.LiveSeatCloseRemoteCameraToastTitle': "摄像头已关闭",
  'Card.LiveSeatCloseRemoteCameraToastDesc': "该用户的摄像头已被关闭",

  // openRemoteMicrophone card
  'Card.LiveSeatOpenRemoteMicrophoneDesc':
    "解锁上麦用户的麦克风，使其可以自行开启。仅限主播 / 管理员。",
  'Card.LiveSeatOpenRemoteMicrophoneFieldUserId': "userId",
  'Card.LiveSeatOpenRemoteMicrophoneToastTitle': "麦克风已解锁",
  'Card.LiveSeatOpenRemoteMicrophoneToastDesc': "该用户现在可以开启麦克风",

  // closeRemoteMicrophone card
  'Card.LiveSeatCloseRemoteMicrophoneDesc':
    "强制关闭上麦用户的麦克风。仅限主播 / 管理员。",
  'Card.LiveSeatCloseRemoteMicrophoneFieldUserId': "userId",
  'Card.LiveSeatCloseRemoteMicrophoneToastTitle': "麦克风已关闭",
  'Card.LiveSeatCloseRemoteMicrophoneToastDesc': "该用户的麦克风已被关闭",

  // muteMicrophone card
  'Card.LiveSeatMuteMicrophoneDesc':
    '在麦位上静音自己的麦克风，仅影响本地音频。',
  'Card.LiveSeatMuteMicrophoneToastTitle': "麦克风已静音",
  'Card.LiveSeatMuteMicrophoneToastDesc': "你的麦克风已静音",

  // unmuteMicrophone card
  'Card.LiveSeatUnmuteMicrophoneDesc':
    '在麦位上取消静音自己的麦克风。',
  'Card.LiveSeatUnmuteMicrophoneToastTitle': "麦克风已取消静音",
  'Card.LiveSeatUnmuteMicrophoneToastDesc': "你的麦克风已激活",

  // startPlayStream card
  'Card.LiveSeatStartPlayStreamDesc':
    '开始将直播混流播放到指定视频容器。',
  'Card.LiveSeatStartPlayStreamFieldView': "view（容器 id）",
  'Card.LiveSeatStartPlayStreamToastTitle': "流已开始播放",
  'Card.LiveSeatStartPlayStreamToastDesc': "直播流正在播放",

  // stopPlayStream card
  'Card.LiveSeatStopPlayStreamDesc':
    '停止播放直播混流。',
  'Card.LiveSeatStopPlayStreamToastTitle': "流已停止播放",
  'Card.LiveSeatStopPlayStreamToastDesc': "直播流已停止",

  // subscribe / unsubscribe (shared, generated by buildSubscriptionCards)
  'Card.LiveSeatSubscribeEventDesc':
    "本组挂载时已默认订阅 [[LiveSeatEvent|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onLocalCameraOpenedByAdmin]] 全部事件（演示 handler；带 `[demo]<事件名>` 前缀的日志行）。若被下方 [[unsubscribeEvent|live-seat.unsubscribeEvent]] 卡片取消，可在此选择\"全部\"或单个事件重新订阅；若该事件已在订阅中，本次调用是幂等空操作。",
  'Card.LiveSeatSubscribeEventFieldEventHelp': "选择\"全部事件\"批量订阅",
  'Card.LiveSeatSubscribeEventToastTitle': "已订阅",
  'Card.LiveSeatSubscribeEventToastDesc': "下次事件触发时，EventLog 中也会出现带 \"[demo]\" 前缀的日志行",
  'Card.LiveSeatUnsubscribeEventDesc':
    "从 [[LiveSeatEvent|https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html#event-onLocalCameraOpenedByAdmin]] 中取消订阅一个或全部事件。取消后该事件再次触发时，EventLog 里 \"[demo] xxx\" 前缀的日志行不再出现（不带前缀的常规事件行仍由站点的常驻日志订阅捕获）。⚠️ 真实业务中调用必须传与 subscribeEvent 时「完全相同」的 handler 引用，否则 SDK 会查找不到并静默失败。",
  'Card.LiveSeatUnsubscribeEventFieldEventHelp': "选择\"全部事件\"批量取消订阅",
  'Card.LiveSeatUnsubscribeEventToastTitle': "已取消订阅",
  'Card.LiveSeatUnsubscribeEventToastDesc': "下次事件触发时，EventLog 中不再出现带 \"[demo]\" 前缀的日志行",

  // Group intro
  'Card.LiveSeatIntroSummary': "麦位生命周期、管理员设备控制、本地麦克风静音",
  'Card.LiveSeatIntro0Head': "关键点",
  'Card.LiveSeatIntro0Item0': "所有麦位操作都要求已在房间内（currentLive.liveId 非空），否则直接抛错。",
  'Card.LiveSeatIntro0Item1': "takeSeat 适用于主播 / 管理员直接上麦；观众连麦应使用 useCoGuestState.applyForSeat（发送申请后由主播批准）。",
  'Card.LiveSeatIntro0Item2': "lockSeat / unlockSeat / kickUserOutOfSeat / moveUserToSeat / openRemoteCamera / closeRemoteCamera / openRemoteMicrophone / closeRemoteMicrophone 仅限主播 / 管理员，普通用户调用会被 SDK 拒绝并返回权限错误。",
  'Card.LiveSeatIntro0Item3': "seatList / canvas 由 SDK 通过 onSeatLayoutChanged 自动更新，调用方无需手动写入。",
  'Card.LiveSeatIntro0Item4': "speakingUsers 和 networkQualities 分别为 Map<string, number> / Map<string, NetworkInfo>，由 SDK 事件实时驱动。",
};
