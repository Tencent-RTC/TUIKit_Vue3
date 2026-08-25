# Aegis 数据上报事件文档

本文档记录了 RTCube Demo 中所有的 Aegis 数据上报事件。

## 事件总览

| 事件名 | 说明 | 使用页面 |
|-------|------|---------|
| `scene_select` | 主场景选择 | home, detail |
| `industry_switcher_click` | 子场景切换（chat 内部） | detail |
| `link_click` | 链接点击 | home, detail, sideBar |
| `qrcode_view` | 二维码查看 | home, sideBar |
| `page_leave` | 页面停留时长 | detail |
| `medical_picker_click` | 医疗场景 Picker 点击 | detail |
| `medical_showroom_click` | 医疗展厅点击 | detail |

---

## 一、scene_select - 主场景选择

主场景切换事件，包括 chat、call、room、live 之间的切换。

### ext1 格式

| 页面 | 触发位置 | ext1 格式 |
|-----|---------|----------|
| home | SceneCard 点击 | `home \| {scene} \| {subScene}` |
| detail | Bar 场景切换 | `detail \| {targetScene}` |

### ext1 完整示例

```
# Home 页面 - SceneCard 点击
home | chat | general
home | chat | medical
home | call | 
home | room | 
home | live | 

# Detail 页面 - Bar 场景切换
detail | chat
detail | call
detail | room
detail | live
```

### 源文件

- `src/views/Home/index.vue`
- `src/views/Detail/Bar/index.vue`

---

## 二、industry_switcher_click - 子场景切换

chat 内部的子场景切换事件（general/medical）。

### ext1 格式

| 页面 | 触发位置 | ext1 格式 |
|-----|---------|----------|
| detail | IndustrySwitcher | `detail \| chat \| {subScene}` |

### ext1 完整示例

```
detail | chat | general
detail | chat | medical
```

### 源文件

- `src/components/IndustrySwitcher/IndustrySwitcher.vue`

---

## 三、link_click - 链接点击

统一的链接点击事件，包括文档、控制台、外部链接、扩展能力平台等。

### ext1 格式

| 页面 | 类型 | ext1 格式 |
|-----|------|----------|
| home | 快速接入 | `home \| {productId} \| {platform} \| {url}` |
| sideBar | 文档链接 | `sideBar \| {scene} \| doc \| {url}` |
| sideBar | 控制台链接 | `sideBar \| {scene} \| console \| {url}` |
| sideBar | 外部链接 | `sideBar \| {scene} \| external_link \| {url}` |
| sideBar | 扩展能力平台 | `sideBar \| {scene} \| {capabilityId} \| {platform} \| {url}` |
| detail | 能力推荐体验 | `detail \| chat \| experience \| {cardId}` |
| detail | 能力推荐文档 | `detail \| chat \| doc \| {url}` |

### ext1 完整示例

```
# Home 页面 - 快速接入 (QuickAccess)
home | chat | web | https://cloud.tencent.com/document/product/269/68823
home | chat | android | https://cloud.tencent.com/document/product/269/68824
home | chat | ios | https://cloud.tencent.com/document/product/269/68825
home | chat | flutter | https://cloud.tencent.com/document/product/269/68826
home | chat | rn | https://cloud.tencent.com/document/product/269/68827
home | chat | uni-app | https://cloud.tencent.com/document/product/269/68828
home | call | web | https://cloud.tencent.com/document/product/647/78731
home | call | android | https://cloud.tencent.com/document/product/647/78732
home | call | ios | https://cloud.tencent.com/document/product/647/78733
home | call | flutter | https://cloud.tencent.com/document/product/647/78734
home | room | web | https://cloud.tencent.com/document/product/647/81962
home | room | android | https://cloud.tencent.com/document/product/647/81963
home | room | ios | https://cloud.tencent.com/document/product/647/81964
home | room | flutter | https://cloud.tencent.com/document/product/647/81965
home | live | web | https://cloud.tencent.com/document/product/647/81966
home | live | android | https://cloud.tencent.com/document/product/647/81967
home | live | ios | https://cloud.tencent.com/document/product/647/81968
home | live | flutter | https://cloud.tencent.com/document/product/647/81969

# SideBar - 文档链接
sideBar | chat | doc | https://cloud.tencent.com/document/product/269
sideBar | call | doc | https://cloud.tencent.com/document/product/647
sideBar | room | doc | https://cloud.tencent.com/document/product/647
sideBar | live | doc | https://cloud.tencent.com/document/product/647

# SideBar - 控制台链接
sideBar | chat | console | https://console.cloud.tencent.com/im
sideBar | call | console | https://console.cloud.tencent.com/trtc
sideBar | room | console | https://console.cloud.tencent.com/trtc
sideBar | live | console | https://console.cloud.tencent.com/trtc

# SideBar - 外部链接
sideBar | chat | external_link | https://github.com/Tencent-RTC/TUIKit_Vue3
sideBar | call | external_link | https://github.com/Tencent-RTC/TUICallKit
sideBar | room | external_link | https://github.com/Tencent-RTC/TUIRoomKit
sideBar | live | external_link | https://github.com/Tencent-RTC/TUILiveKit

# SideBar - 扩展能力平台链接
sideBar | chat | translation | web | https://cloud.tencent.com/document/product/269/85380
sideBar | chat | translation | android | https://cloud.tencent.com/document/product/269/85381
sideBar | chat | translation | ios | https://cloud.tencent.com/document/product/269/85382
sideBar | chat | moderation | web | https://cloud.tencent.com/document/product/269/83795
sideBar | chat | moderation | android | https://cloud.tencent.com/document/product/269/83796
sideBar | chat | moderation | ios | https://cloud.tencent.com/document/product/269/83797
sideBar | chat | push | android | https://cloud.tencent.com/document/product/269/75428
sideBar | chat | push | ios | https://cloud.tencent.com/document/product/269/75429

# Detail 页面 - 能力推荐 (CapabilityRecommend)
# 体验 Demo 按钮点击
detail | chat | experience | call
detail | chat | experience | room
detail | chat | experience | live
# 查看文档按钮点击
detail | chat | doc | https://cloud.tencent.com/document/product/647/78731
detail | chat | doc | https://cloud.tencent.com/document/product/647/81962
detail | chat | doc | https://cloud.tencent.com/document/product/647/81966
```

### 源文件

- `src/components/QuickAccess/QuickAccess.vue`
- `src/views/Detail/SideBar/index.vue`
- `src/scenes/Chat/components/CapabilityRecommend/CapabilityRecommend.vue`

---

## 四、qrcode_view - 二维码查看

二维码查看事件，用户查看移动端体验二维码时触发。

### ext1 格式

| 页面 | 触发位置 | ext1 格式 |
|-----|---------|----------|
| home | PlatformExperience | `home \| {platform}` |
| sideBar | MobileExperience | `sideBar \| {scene} \| {platform}` |

### ext1 完整示例

```
# Home 页面 - PlatformExperience
home | android
home | ios
home | miniprogram

# SideBar - MobileExperience
sideBar | chat | android
sideBar | chat | ios
sideBar | chat | miniprogram
sideBar | call | android
sideBar | call | ios
sideBar | call | miniprogram
sideBar | room | android
sideBar | room | ios
sideBar | room | miniprogram
sideBar | live | android
sideBar | live | ios
sideBar | live | miniprogram
```

### 源文件

- `src/components/PlatformExperience/PlatformExperience.vue`
- `src/views/Detail/SideBar/index.vue`

---

## 五、page_leave - 页面停留时长

页面离开时上报停留时长。

### ext1 格式

| 页面 | ext1 格式 |
|-----|----------|
| detail | `{page} \| {scene} \| {subScene} \| {durationMs}` |

### ext1 完整示例

```
detail | chat | general | 5000
detail | chat | general | 12345
detail | chat | general | 60000
detail | chat | medical | 8000
detail | chat | medical | 30000
detail | call |  | 15000
detail | room |  | 20000
detail | live |  | 10000
```

### 源文件

- `src/utils/aegis.ts` (createPageLeaveTracker)

---

## 六、medical_picker_click - 医疗场景 Picker 点击

医疗场景中各种 Picker 工具的点击事件。

### ext1 格式

| 触发位置 | ext1 格式 |
|---------|----------|
| 所有医疗 Picker | `detail \| chat \| medical \| {picker_type}` |

### ext1 完整示例

```
detail | chat | medical | file
detail | chat | medical | image
detail | chat | medical | emoji
detail | chat | medical | video_call
detail | chat | medical | audio_call
detail | chat | medical | medical_record
detail | chat | medical | prescription
detail | chat | medical | quick_reply
detail | chat | medical | quick_rate
```

### picker_type 说明

| picker_type | 说明 | 源文件 |
|------------|------|-------|
| `file` | 文件选择器 | `MedicalFilePicker.vue` |
| `image` | 图片选择器 | `MedicalImagePicker.vue` |
| `emoji` | 表情选择器 | `MedicalEmojiPicker.vue` |
| `video_call` | 视频通话 | `MedicalVideoCallPicker.vue` |
| `audio_call` | 语音通话 | `MedicalAudioCallPicker.vue` |
| `medical_record` | 病历发送 | `MedicalRecordPicker.vue` |
| `prescription` | 处方开具 | `PrescriptionPicker.vue` |
| `quick_reply` | 快捷回复 | `QuickReplyPicker.vue` |
| `quick_rate` | 快捷评价 | `QuickRatePicker.vue` |

### 源文件

- `src/scenes/Chat/components/Medical/pickers/*.vue`

---

## 七、medical_showroom_click - 医疗展厅点击

医疗场景中展厅按钮的点击事件。

### ext1 格式

| 触发位置 | ext1 格式 |
|---------|----------|
| 展厅按钮 | `detail \| chat \| medical \| showroom` |

### ext1 完整示例

```
detail | chat | medical | showroom
```

### 源文件

- `src/scenes/Chat/MedicalChat.vue`

---

## 八、Call 场景 API 事件

Call 场景使用对象格式的 reportEvent，与上述事件格式不同。

### 事件列表

| apiName | 说明 | 源文件 |
|---------|------|-------|
| `call.start` | 发起1v1通话 | `useCall.ts` |
| `call.success` | 1v1通话成功 | `useCall.ts` |
| `call.fail` | 1v1通话失败 | `useMessage.ts` |
| `groupCall.start` | 发起群组通话 | `useGroupCall.ts` |
| `groupCall.success` | 群组通话成功 | `useGroupCall.ts` |
| `groupCall.fail` | 群组通话失败 | `useMessage.ts` |
| `openNewWindow.start` | 打开创建用户窗口 | `CreateUserTip.vue` |

### 源文件

- `src/scenes/Call/pages/Call/useCall.ts`
- `src/scenes/Call/pages/GroupCall/useGroupCall.ts`
- `src/scenes/Call/hooks/useMessage.ts`
- `src/scenes/Call/components/CreateUserTip/CreateUserTip.vue`

---

## 变量说明

| 变量名 | 可能的值 | 说明 |
|-------|---------|------|
| `{page}` | `home`, `detail`, `sideBar` | 页面标识 |
| `{scene}` | `chat`, `call`, `room`, `live` | 主场景标识 |
| `{subScene}` | `general`, `medical` | 子场景标识（仅 chat） |
| `{targetScene}` | `chat`, `call`, `room`, `live` | 目标场景标识 |
| `{platform}` | `web`, `android`, `ios`, `flutter`, `rn`, `uni-app`, `electron`, `miniprogram` | 平台标识 |
| `{productId}` | `chat`, `call`, `room`, `live` | 产品标识 |
| `{capabilityId}` | `translation`, `moderation`, `push`, `call`, `room`, `live` | 扩展能力标识 |
| `{picker_type}` | `file`, `image`, `emoji`, `video_call`, `audio_call`, `medical_record`, `prescription`, `quick_reply`, `quick_rate` | Picker 类型 |
| `{url}` | 完整 URL | 链接地址 |
| `{durationMs}` | 数字字符串 | 停留时长（毫秒） |

---

## ext1 完整汇总

以下是所有可能的 ext1 值的完整列表：

```
# scene_select
home | chat | general
home | chat | medical
home | call | 
home | room | 
home | live | 
detail | chat
detail | call
detail | room
detail | live

# industry_switcher_click
detail | chat | general
detail | chat | medical

# link_click - home 快速接入
home | chat | web | {url}
home | chat | android | {url}
home | chat | ios | {url}
home | chat | flutter | {url}
home | chat | rn | {url}
home | chat | uni-app | {url}
home | call | web | {url}
home | call | android | {url}
home | call | ios | {url}
home | call | flutter | {url}
home | room | web | {url}
home | room | android | {url}
home | room | ios | {url}
home | room | flutter | {url}
home | live | web | {url}
home | live | android | {url}
home | live | ios | {url}
home | live | flutter | {url}

# link_click - sideBar 文档
sideBar | chat | doc | {url}
sideBar | call | doc | {url}
sideBar | room | doc | {url}
sideBar | live | doc | {url}

# link_click - sideBar 控制台
sideBar | chat | console | {url}
sideBar | call | console | {url}
sideBar | room | console | {url}
sideBar | live | console | {url}

# link_click - sideBar 外部链接
sideBar | chat | external_link | {url}
sideBar | call | external_link | {url}
sideBar | room | external_link | {url}
sideBar | live | external_link | {url}

# link_click - sideBar 扩展能力
sideBar | chat | translation | web | {url}
sideBar | chat | translation | android | {url}
sideBar | chat | translation | ios | {url}
sideBar | chat | moderation | web | {url}
sideBar | chat | moderation | android | {url}
sideBar | chat | moderation | ios | {url}
sideBar | chat | push | android | {url}
sideBar | chat | push | ios | {url}

# link_click - detail 能力推荐
detail | chat | experience | call
detail | chat | experience | room
detail | chat | experience | live
detail | chat | doc | {url}

# qrcode_view
home | android
home | ios
home | miniprogram
sideBar | chat | android
sideBar | chat | ios
sideBar | chat | miniprogram
sideBar | call | android
sideBar | call | ios
sideBar | call | miniprogram
sideBar | room | android
sideBar | room | ios
sideBar | room | miniprogram
sideBar | live | android
sideBar | live | ios
sideBar | live | miniprogram

# page_leave
detail | chat | general | {durationMs}
detail | chat | medical | {durationMs}
detail | call |  | {durationMs}
detail | room |  | {durationMs}
detail | live |  | {durationMs}

# medical_picker_click
detail | chat | medical | file
detail | chat | medical | image
detail | chat | medical | emoji
detail | chat | medical | video_call
detail | chat | medical | audio_call
detail | chat | medical | medical_record
detail | chat | medical | prescription
detail | chat | medical | quick_reply
detail | chat | medical | quick_rate

# medical_showroom_click
detail | chat | medical | showroom
```
