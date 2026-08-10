## [6.5.3] (2026-08-09)

### feat
* Room: 弹幕（Barrage）功能迁移至 RoomKit，并同步升级 `@tencentcloud/lite-chat` 依赖至 1.6.18

### fix
* Room: 优化 `RoomView` 视频播放逻辑，避免无效调用导致的日志报错
* Room: 修复标准房间和研讨会房间的报错信息及表现异常问题（研讨会房间偶现本地流黑屏、标准会议播放流日志报错，`roomState` 新增关键节点日志）
* Room: 修复白板本地预览走 `videoMixer` 导致的显示异常
* Room: 修复白板众测反馈的体验问题
* Live: 优化直播播放器视觉表现，并修复横屏语音连麦下设备控制菜单交互问题
* Live: 修复直播列表刷新时 chat 插件未注册、room engine 未登录导致的报错
* Chat: 修复误移除的、room 场景使用的 `useMessageAction`

### refactor
* Live: 直播相关 states 的事件绑定改为惰性绑定（lazyBind），避免模块加载时立即执行绑定
* Room: 移除虚拟背景冗余代码，SDK 已兼容未开启摄像头时的背景保存

### perf
* Room: 优化 RoomKit 构建耗时，降低 `KeyMetricsStats` 上报频率并调低日志级别
