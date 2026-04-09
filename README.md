# Tencent Cloud RTC TUIKit for Vue 3

[English](./README.md) | [简体中文](./README_ZH.md)

A **core Vue 3 component library** for Tencent Cloud RTC TUIKit, designed for three major real-time scenarios: **Chat** (instant messaging), **Live** (interactive live streaming), and **Room** (multi-user audio/video rooms).

It provides production-ready UI components together with reactive state modules, so you can either use components independently or compose them into complete scenario-based experiences.

## Key Features

| Feature | Description |
| ------ | ------ |
| **Scenario-oriented UI components** | Covers Chat, Live, and Room scenarios. Components can be used individually or freely composed. |
| **Reactive state management** | Each component is backed by fine-grained reactive data and action methods. |
| **Scenario-based exports** | Import only what you need through `./chat`, `./live`, and `./room` sub-entries to reduce bundle size. |
| **Internationalization** | Built-in multi-language support based on i18next. |
| **Type safety** | Ships with complete TypeScript type definitions. |

## Component Structure (`src/components/`)

### Chat

| Component | Description |
| ------ | ------ |
| `ConversationList/` | Conversation list with conversation preview, search, and actions. |
| `MessageList/` | Message list with message rendering and custom message support. |
| `MessageInput/` | Message input box with emoji, image, file, video, and audio/video call pickers. |
| `ChatSetting/` | Conversation settings panel for C2C and group chats. |
| `ContactList/` | Contact list and contact detail modules. |
| `Search/` | Global search and message search. |

### Live

| Component | Description |
| ------ | ------ |
| `LiveView/` | Live streaming view for pushing and playing streams. |
| `LiveList/` | Live room list. |
| `LiveScenePanel/` | Aggregated panel for live-scene feature entry points. |
| `BarrageInput/` | Barrage input. |
| `BarrageList/` | Barrage message list. |
| `LiveGift/` | Gift panel and gift animation effects. |
| `LiveAudienceList/` | Audience list. |
| `LiveMonitorView/` | Live monitoring view. |
| `CoGuestPanel/` | Co-guest panel. |
| `CoHostPanel/` | Host PK panel. |
| `StreamMixer/` | Stream mixing control. |

### Room

| Component | Description |
| ------ | ------ |
| `RoomView/` | Main audio/video room view. |
| `RoomParticipantList/` | Participant list. |
| `RoomParticipantView/` | Participant video view. |
| `ScheduleRoomPanel/` | Scheduled meeting panel. |
| `VirtualBackgroundPanel/` | Virtual background settings. |
| `FreeBeautyPanel/` | Beauty effect settings panel. |
| `ASRTools/` | Speech recognition tools, including subtitles and real-time transcription. |

### Common

| Component | Description |
| ------ | ------ |
| `Avatar/` | Avatar component. |
| `UserPicker/` | User picker. |

## State Management (`src/states/`)

Each business domain maps to an independent state module. Every module exposes reactive data and action methods through `useXxxState()` hooks.

- **Common**: `LoginState`
- **Chat**: `ConversationListState`, `MessageListState`, `MessageInputState`, `ContactListState`, `SearchState`, `C2CSettingState`, `GroupSettingState`, `MessageActionState`
- **Live**: `LiveListState`, `LivePlayerState`, `LiveSeatState`, `LiveGiftState`, `BarrageState`, `BattleState`, `CoGuestState`, `CoHostState`, `LiveAudienceState`, `LiveMonitorState`, `VideoMixerState`
- **Room**: `RoomState`, `RoomParticipantState`, `DeviceState`, `AITranscriberState`, `FreeBeautyState`, `VirtualBackgroundState`

## Export Strategy (`src/subEntry/`)

```text
subEntry/
├── common/    # shared exports: LoginState, Avatar, UserPicker
├── chat/      # chat exports: conversation, message, contact, search components and states
├── live/      # live exports: live view, barrage, gifts, co-guest, and related states
└── room/      # room exports: room view, participants, virtual background, and related states
```

The upper-level packages can selectively re-export modules by scenario. For example, `@tencentcloud/chat-uikit-vue3` only re-exports `common` and `chat`.

## Package Entry Overview

The core package in this repository is `tuikit-atomicx-vue3`, which exposes the following entry points:

- `tuikit-atomicx-vue3`
- `tuikit-atomicx-vue3/chat`
- `tuikit-atomicx-vue3/live`
- `tuikit-atomicx-vue3/room`

This makes it easier to build scenario-specific applications while keeping imports explicit and tree-shakable.

## Demo Projects (`demos/`)

The `demos/` directory contains runnable sample applications and scenario showcases built on top of this component library.

| Demo | Description |
| ------ | ------ |
| `rtcube-vite-vue3/` | A comprehensive RTC experience demo that combines multiple Tencent Cloud RTC scenarios and products, including Chat, Call, and other experience-oriented pages. It is the best starting point if you want to see how different capabilities work together in one app. |
| `live-monitor-vue3/` | A real-time live stream monitoring demo for viewing and managing multiple live rooms concurrently. It includes both a Vue 3 frontend and a lightweight `server/` backend for monitoring-related workflows. |
| `industry-showcase/` | A directory for vertical-industry showcases. It currently includes a medical consultation demo and shows how Chat UIKit can be customized with industry-specific UI, cards, quick replies, patient information panels, and call integration. |
