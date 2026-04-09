# UIKit Component Vue3

腾讯云 RTC UIKit 的 **Vue 3 核心组件库**，为 Chat（即时通信）、Live（互动直播）、Room（多人音视频房间）三大场景提供开箱即用的 UI 组件与响应式状态管理。

## 核心能力

| 能力 | 说明 |
|------|------|
| **场景化 UI 组件** | 覆盖 Chat、Live、Room 三大场景，每个组件可独立使用或自由组合 |
| **响应式状态管理** | 每个组件提供细粒度的响应式数据与操作方法 |
| **按场景导出** | 通过 `subEntry/chat`、`subEntry/live`、`subEntry/room` 按需引入，减小打包体积 |
| **国际化** | 内置 i18next 多语言支持 |
| **类型安全** | 完整的 TypeScript 类型定义 |

## 组件目录结构 (`src/components/`)

### Chat 场景

| 组件 | 说明 |
|------|------|
| `ConversationList/` | 会话列表，包含会话预览、会话搜索、会话操作等子组件 |
| `MessageList/` | 消息列表，包含消息渲染、自定义消息等子组件 |
| `MessageInput/` | 消息输入框，包含表情、图片、文件、视频、音视频通话等 Picker |
| `ChatSetting/` | 会话设置面板（C2C / 群组设置） |
| `ContactList/` | 联系人列表与联系人详情 |
| `Search/` | 全局搜索与消息搜索 |

### Live 场景

| 组件 | 说明 |
|------|------|
| `LiveView/` | 直播视图（推流 / 拉流） |
| `LiveList/` | 直播间列表 |
| `LiveScenePanel/` | 直播场景面板（功能入口聚合） |
| `BarrageInput/` | 弹幕输入 |
| `BarrageList/` | 弹幕消息列表 |
| `LiveGift/` | 礼物面板与礼物动效 |
| `LiveAudienceList/` | 观众列表 |
| `LiveMonitorView/` | 直播监控视图 |
| `CoGuestPanel/` | 连麦面板 |
| `CoHostPanel/` | 主播 PK 面板 |
| `StreamMixer/` | 混流控制 |

### Room 场景

| 组件 | 说明 |
|------|------|
| `RoomView/` | 音视频房间主视图 |
| `RoomParticipantList/` | 参会人列表 |
| `RoomParticipantView/` | 参会人视频视图 |
| `ScheduleRoomPanel/` | 预约会议面板 |
| `VirtualBackgroundPanel/` | 虚拟背景设置 |
| `FreeBeautyPanel/` | 美颜设置面板 |
| `ASRTools/` | 语音识别工具（字幕、实时消息转写） |

### 通用组件

| 组件 | 说明 |
|------|------|
| `Avatar/` | 头像组件 |
| `UserPicker/` | 用户选择器 |

## 状态管理 (`src/states/`)

每个业务领域对应一个独立的 State 模块，通过 `useXxxState()` Hook 暴露响应式数据和操作方法：


- **Common**: `LoginState`
- **Chat**: `ConversationListState`、`MessageListState`、`MessageInputState`、`ContactListState`、`SearchState`、`C2CSettingState`、`GroupSettingState`、`MessageActionState`
- **Live**: `LiveListState`、`LivePlayerState`、`LiveSeatState`、`LiveGiftState`、`BarrageState`、`BattleState`、`CoGuestState`、`CoHostState`、`LiveAudienceState`、`LiveMonitorState`、`VideoMixerState`
- **Room**: `RoomState`、`RoomParticipantState`、`DeviceState`、`AITranscriberState`、`FreeBeautyState`、`VirtualBackgroundState`

## 导出机制 (`src/subEntry/`)

```
subEntry/
├── common/    # 通用导出：LoginState、Avatar、UserPicker
├── chat/      # Chat 场景导出：会话、消息、联系人、搜索等组件和状态
├── live/      # Live 场景导出：直播视图、弹幕、礼物、连麦等组件和状态
└── room/      # Room 场景导出：房间视图、参会人、虚拟背景等组件和状态
```

上层包按场景选择性地 re-export，例如 `@tencentcloud/chat-uikit-vue3` 只导出 `common` + `chat`。

## Demo 目录 (`demos/`)

`demos/` 目录包含基于该组件库构建的可运行示例工程和场景化展示项目。

| Demo | 说明 |
|------|------|
| `rtcube-vite-vue3/` | 综合性的 RTC 体验 Demo，聚合了腾讯云 RTC 多种场景与产品能力，包括 Chat、Call 以及其他体验型页面。适合作为理解整体接入方式的首个入口。 |
| `live-monitor-vue3/` | 实时直播监播 Demo，用于并发查看和管理多个直播间。项目同时包含 Vue 3 前端和轻量级 `server/` 后端，适合参考监播类业务流程。 |
| `industry-showcase/` | 行业化展示 Demo 目录，当前包含医疗问诊等垂直场景示例，演示如何基于 Chat UIKit 做行业定制，例如主题 UI、自定义卡片、快捷回复、患者信息面板和音视频通话集成。 |
