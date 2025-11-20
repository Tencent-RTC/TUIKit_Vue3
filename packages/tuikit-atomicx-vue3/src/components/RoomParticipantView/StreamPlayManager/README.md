# StreamPlayManager 开发指南

> 🎥 高性能视频流播放管理器，支持懒加载和自动质量切换

## 📖 目录

- [快速开始](#-快速开始)
- [核心概念](#-核心概念)
- [完整使用指南](#-完整使用指南)
- [API 参考](#-api-参考)
- [配置参数](#-配置参数)
- [架构详解](#-架构详解)
- [常见问题](#-常见问题)
- [版本历史](#-版本历史)

---

## 🚀 快速开始

### 什么是 StreamPlayManager？

`StreamPlayManager` 是一个**视频流播放管理系统**，它能自动处理：
- ✅ 视频流的播放和停止
- ✅ 懒加载（DOM 可见时才播放）
- ✅ 自动质量切换（大流/小流智能切换）
- ✅ 多视图绑定管理

### 30 秒上手

```typescript
import { StreamPlayManager } from './StreamPlayManager';
import { VideoStreamType } from '../../../types';

// 1. 获取管理器实例（单例）
const streamManager = StreamPlayManager.getInstance();

// 2. 绑定视图，启用懒加载
streamManager.bindView({
  userId: 'user123',
  streamType: VideoStreamType.Camera,
  view: 'video-container-id',
  lazyLoad: { enable: true }
});

// 3. 组件销毁时解绑
streamManager.unbindView({
  userId: 'user123',
  streamType: VideoStreamType.Camera,
  view: 'video-container-id'
});
```

### 在 Vue 组件中使用

```vue
<template>
  <div ref="videoContainerRef" class="video-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { StreamPlayManager } from './StreamPlayManager';

const props = defineProps<{
  userId: string;
  streamType: VideoStreamType;
}>();

const videoContainerRef = ref<HTMLDivElement>();
const streamManager = StreamPlayManager.getInstance();

onMounted(() => {
  streamManager.bindView({
    userId: props.userId,
    streamType: props.streamType,
    view: videoContainerRef.value!,
    lazyLoad: { enable: true }
  });
});

onBeforeUnmount(() => {
  streamManager.unbindView({
    userId: props.userId,
    streamType: props.streamType,
    view: videoContainerRef.value!
  });
});
</script>
```

**就这么简单！** 🎉 系统会自动处理：
- DOM 进入视区时开始播放
- DOM 离开视区时停止播放
- 根据 DOM 尺寸自动切换大流/小流
- 最多同时播放 6 个大流

---

## 💡 核心概念

### 模块化架构

系统由 **5 个独立模块** 组成，每个模块职责单一：

```
StreamPlayManager/
├── index.ts                    👑 协调器 - 统一入口，协调其他模块
├── StreamPlayer.ts             🎬 流播放器 - 执行播放/停止操作
├── StreamInfoManager.ts        📊 流信息管理器 - 管理流状态和视图绑定
├── LazyLoadManager.ts          👁️ 懒加载管理器 - 监控 DOM 可见性
└── VideoQualityManager.ts      🎯 视频质量管理器 - 管理质量切换
```

### 核心流程

```
用户操作 bindView()
    ↓
StreamPlayManager（协调器）
    ↓
StreamInfoManager（记录流信息）
    ↓
LazyLoadManager（监听 DOM 可见性）
    ↓
DOM 进入视区？
    ├─ 是 → StreamPlayer.startPlayVideo()
    └─ 否 → 等待，不播放
    ↓
VideoQualityManager（监听 DOM 尺寸）
    ↓
根据尺寸自动切换大流/小流
```

### 关键特性

| 特性 | 说明 | 优势 |
|-----|------|-----|
| 🚀 **懒加载** | DOM 可见时才播放流 | 节省带宽，提升性能 |
| 🎯 **智能质量切换** | 根据 DOM 尺寸自动切换大流/小流 | 优化带宽使用 |
| 📊 **多视图支持** | 一个流可绑定多个 DOM 元素 | 灵活的 UI 布局 |
| 🔄 **自动管理** | 完全自动化，无需手动控制 | 降低开发复杂度 |

---

## 📚 完整使用指南

### 基础场景

#### 1. 启用懒加载（推荐）

适用于会议场景，多人视频列表：

```typescript
streamManager.bindView({
  userId: 'user123',
  streamType: VideoStreamType.Camera,
  view: 'video-container-id',
  lazyLoad: {
    enable: true,
    viewport: 'scroll-container-id' // 可选：指定滚动容器
  }
});
```

#### 2. 禁用懒加载（立即播放）

适用于单人视频或重要视频流：

```typescript
streamManager.bindView({
  userId: 'user123',
  streamType: VideoStreamType.Camera,
  view: 'video-container-id',
  lazyLoad: {
    enable: false  // 立即播放，不等待 DOM 可见
  }
});
```

#### 3. 屏幕分享流

屏幕分享流自动使用大流：

```typescript
streamManager.bindView({
  userId: 'user123',
  streamType: VideoStreamType.Screen,  // 屏幕分享
  view: 'screen-container-id',
  lazyLoad: { enable: false }
});
```

### 高级场景

#### 1. 一个流绑定多个视图

```typescript
// 主视图
streamManager.bindView({
  userId: 'user123',
  streamType: VideoStreamType.Camera,
  view: 'main-view',
  lazyLoad: { enable: false }
});

// 缩略图视图（同一个流）
streamManager.bindView({
  userId: 'user123',
  streamType: VideoStreamType.Camera,  // 同一个 userId + streamType
  view: 'thumbnail-view',
  lazyLoad: { enable: true }
});

// 两个视图共享同一个流，自动同步播放状态
```

#### 2. 监听用户视频状态变化

```typescript
// StreamPlayManager 会自动监听 TUIRoomEvents.onUserVideoStateChanged
// 当用户开启/关闭摄像头时，自动开始/停止播放
// 无需手动处理
```

#### 3. 设置渲染参数

```typescript
streamManager.setStreamConfig({
  userId: 'user123',
  streamType: VideoStreamType.Camera,
  renderParams: {
    fillMode: FillMode.Fill,      // 填充模式
    mirror: MirrorType.Enable,    // 镜像
    rotation: '90'                // 旋转角度
  }
});
```

### 状态查询

```typescript
// 检查流是否正在播放
const isPlaying = streamManager.isStreamPlaying('user123', VideoStreamType.Camera);

// 检查流是否有可见的视图
const hasVisibleView = streamManager.hasVisibleView('user123', VideoStreamType.Camera);

// 获取流信息
const streamInfo = streamManager.getStreamInfo('user123', VideoStreamType.Camera);
console.log(streamInfo);
// {
//   userId: 'user123',
//   streamType: 'camera',
//   views: [HTMLDivElement, HTMLDivElement],
//   isPlaying: true,
//   videoQuality: 'HD'
// }
```

### 资源清理

```typescript
// 组件销毁时解绑视图
onBeforeUnmount(() => {
  streamManager.unbindView({
    userId: props.userId,
    streamType: props.streamType,
    view: videoContainerRef.value!
  });
});

// 应用退出时清理所有资源
streamManager.cleanup();
```

---

## 📋 API 参考

### StreamPlayManager（协调器）

#### 静态方法

```typescript
// 获取单例实例
StreamPlayManager.getInstance(): StreamPlayManager

// 销毁单例实例（一般不需要调用）
StreamPlayManager.destroyInstance(): Promise<void>
```

#### 核心方法

```typescript
// 绑定视图到流
bindView(options: {
  userId: string;
  streamType: VideoStreamType;
  view: string | HTMLDivElement;
  lazyLoad?: {
    enable: boolean;
    viewport?: string | HTMLDivElement;
  };
}): Promise<void>

// 解绑视图
unbindView(options: {
  userId: string;
  streamType: VideoStreamType;
  view: string | HTMLDivElement;
}): Promise<void>

// 设置流配置
setStreamConfig(options: {
  userId: string;
  streamType: VideoStreamType;
  videoQuality?: VideoStreamQuality;
  renderParams?: {
    fillMode?: FillMode;
    mirror?: MirrorType;
    rotation?: VideoRotation;
  };
}): Promise<void>
```

#### 查询方法

```typescript
// 检查流是否正在播放
isStreamPlaying(userId: string, streamType: VideoStreamType): boolean

// 检查流是否有可见的视图
hasVisibleView(userId: string, streamType: VideoStreamType): boolean

// 获取流信息
getStreamInfo(userId: string, streamType: VideoStreamType): StreamInfo | undefined

// 清理所有资源
cleanup(): Promise<void>
```

### 类型定义

```typescript
// 视频流类型
enum VideoStreamType {
  Camera = 'camera',    // 摄像头流
  Screen = 'screen'     // 屏幕分享流
}

// 视频质量
enum VideoStreamQuality {
  HD = 'HD',  // 大流（高清）
  LD = 'LD'   // 小流（低清）
}

// 流信息
interface StreamInfo {
  userId: string;
  streamType: VideoStreamType;
  views: (string | HTMLDivElement)[];
  isPlaying: boolean;
  videoQuality?: VideoStreamQuality;
  fillMode?: FillMode;
}

// 填充模式
enum FillMode {
  Fit = 'fit',    // 适应（保持比例）
  Fill = 'fill'   // 填充（可能裁剪）
}

// 镜像类型
enum MirrorType {
  Enable = 'enable',
  Disable = 'disable',
  Auto = 'auto'
}

// 旋转角度
type VideoRotation = '0' | '90' | '180' | '270';
```

---

## ⚙️ 配置参数

### 质量切换阈值

在 `VideoQualityManager.ts` 中配置：

```typescript
const HIGH_QUALITY_NUMBER = 6;         // 最大大流数量
const QUALITY_THRESHOLD_WIDTH = 480;   // 大流宽度阈值（px）
const QUALITY_THRESHOLD_HEIGHT = 270;  // 大流高度阈值（px）
const QUALITY_HYSTERESIS = 1.15;       // 滞后系数（避免频繁切换）
```

### 防抖时间

```typescript
const RESIZE_DEBOUNCE_TIME = 300;  // DOM 尺寸变化防抖时间（ms）
```

### 自动质量切换策略

系统会根据以下规则自动切换视频质量：

| 场景 | 策略 | 说明 |
|-----|------|------|
| 屏幕分享流 | 永远使用 **大流** | 确保清晰度 |
| DOM 尺寸 < 480×270 | 使用 **小流** | 节省带宽 |
| DOM 尺寸 ≥ 480×270 | 尝试使用 **大流** | 提升清晰度 |
| 大流数量 < 6 | 允许新增大流 | 优先大流 |
| 大流数量 = 6 | 淘汰面积最小的大流 | 智能分配 |

**滞后机制**：
- 从小流切换到大流：DOM 尺寸需要 > 阈值 × 1.15
- 从大流切换到小流：DOM 尺寸需要 < 阈值 / 1.15
- 目的：避免在阈值附近频繁切换

---

## 🏗️ 架构详解

### 设计理念

**核心思想**：单一职责原则（SRP）+ 模块化设计

将复杂的流播放管理系统拆分为 5 个独立模块，每个模块只负责一件事：

```
┌─────────────────────────────────────────┐
│   StreamPlayManager (协调器)         │  👑 统一入口
│   - 协调各模块                           │
│   - 提供统一 API                         │
└───────────┬─────────────────────────────┘
            │ 调用
    ┌───────┼───────┬──────────┬──────────┐
    │       │       │          │          │
┌───▼──┐ ┌─▼──┐ ┌──▼───┐ ┌───▼───┐ ┌───▼────┐
│Stream│ │Info│ │Lazy  │ │Video  │ │Room    │
│Player│ │Mgr │ │Load  │ │Quality│ │Engine  │
│      │ │    │ │Mgr   │ │Mgr    │ │        │
└──────┘ └────┘ └──────┘ └───────┘ └────────┘
  播放      数据   可见性    质量      底层SDK
  执行      管理   监控      管理
```

### 模块职责

#### 1. StreamPlayManager（协调器）
- **文件**：`index.ts`
- **职责**：协调各个模块，提供统一接口
- **特点**：单例模式，纯协调器，无具体业务逻辑

#### 2. StreamPlayer（流播放器）
- **文件**：`StreamPlayer.ts`
- **职责**：执行流播放操作
- **功能**：
  - 调用 RoomEngine API 播放/停止流
  - 设置渲染参数（fillMode、mirror、rotation）
  - 处理本地流和远程流的差异

#### 3. StreamInfoManager（流信息管理器）
- **文件**：`StreamInfoManager.ts`
- **职责**：管理流状态和视图绑定
- **功能**：
  - 存储流信息（userId、streamType、views、isPlaying 等）
  - 提供流信息 CRUD 操作
  - 管理视图列表

#### 4. LazyLoadManager（懒加载管理器）
- **文件**：`LazyLoadManager.ts`
- **职责**：监控 DOM 可见性
- **功能**：
  - 使用 IntersectionObserver 监听 DOM 可见性
  - DOM 进入视区时触发回调
  - DOM 离开视区时触发回调

#### 5. VideoQualityManager（视频质量管理器）
- **文件**：`VideoQualityManager.ts`
- **职责**：管理视频质量切换
- **功能**：
  - 使用 ResizeObserver 监听 DOM 尺寸
  - 计算最优视频质量（HD/LD）
  - 管理大流分配（最多 6 个）
  - 防抖优化性能

### 通信机制

```typescript
// 1. 回调通信（监控器 → 协调器）
LazyLoadManager      → StreamPlayManager.handleVisibilityChange()
VideoQualityManager  → StreamPlayManager.handleQualityChange()

// 2. 直接调用（协调器 → 其他模块）
StreamPlayManager → StreamInfoManager.addView()
StreamPlayManager → StreamPlayer.startPlayVideo()
StreamPlayManager → LazyLoadManager.observe()
StreamPlayManager → VideoQualityManager.observe()
```

### 数据流向

```
用户调用 bindView()
    ↓
StreamPlayManager.bindView()
    ↓
StreamInfoManager.addView()  // 记录视图绑定
    ↓
LazyLoadManager.observe()    // 开始监听可见性
    ↓
[等待 DOM 进入视区]
    ↓
LazyLoadManager 触发回调
    ↓
StreamPlayManager.handleVisibilityChange()
    ↓
StreamPlayer.startPlayVideo()  // 开始播放
    ↓
VideoQualityManager.observe()  // 监听尺寸变化
    ↓
[尺寸变化]
    ↓
VideoQualityManager 触发回调
    ↓
StreamPlayManager.handleQualityChange()
    ↓
StreamPlayer.updateVideoQuality()  // 切换质量
```

### 命名规范

为了提高代码可读性和一致性，系统采用统一的命名规范：

| 类型 | 命名规则 | 示例 | 说明 |
|-----|---------|------|-----|
| 管理器 | `XxxManager` | `StreamInfoManager` | 负责管理某类资源或状态 |
| 执行器 | `XxxPlayer` / `XxxExecutor` | `StreamPlayer` | 负责执行具体操作 |
| 协调器 | `XxxManager` / `XxxCoordinator` | `StreamPlayManager` | 负责协调多个模块 |

**为什么 StreamPlayer 不叫 StreamManager？**
- `StreamPlayer` 是"执行器"，直接调用 RoomEngine API 执行播放操作
- `StreamInfoManager` 是"管理器"，管理流信息和状态
- 名称区分体现了职责差异

### 架构优势

| 优势 | 说明 |
|-----|------|
| 🎯 **单一职责** | 每个模块职责清晰，易于理解和维护 |
| 🔧 **低耦合** | 模块间通过接口通信，相互独立 |
| 📈 **可扩展** | 新增功能只需扩展对应模块 |
| 🛠️ **易调试** | 每个模块都有独立的日志 |
| ✅ **可测试** | 模块独立，便于单元测试 |

---

## ❓ 常见问题

### Q1: bindView 后视频不播放？

**可能原因**：
1. 启用了懒加载，但 DOM 元素不在视区内
2. 用户的摄像头未开启
3. DOM 元素 ID 不正确

**解决方案**：
```typescript
// 1. 检查是否启用了懒加载
streamManager.bindView({
  lazyLoad: { enable: false }  // 临时禁用懒加载测试
});

// 2. 检查流是否正在播放
const isPlaying = streamManager.isStreamPlaying(userId, streamType);
console.log('isPlaying:', isPlaying);

// 3. 检查是否有可见视图
const hasVisible = streamManager.hasVisibleView(userId, streamType);
console.log('hasVisibleView:', hasVisible);
```

### Q2: 如何强制使用大流？

**回答**：系统会自动根据 DOM 尺寸和大流数量限制进行质量切换。如果需要强制大流：

```typescript
// 1. 确保 DOM 尺寸足够大（>= 480×270）
// 2. 禁用自动质量切换（不推荐）
// 注意：目前系统不支持完全禁用自动质量切换
// 这是设计决策，为了优化带宽使用
```

### Q3: 一个流可以绑定多少个视图？

**回答**：理论上无限制，但建议不超过 3 个：

```typescript
// 主视图
streamManager.bindView({ view: 'main-view', ... });

// 缩略图视图
streamManager.bindView({ view: 'thumbnail-view', ... });

// 画中画视图
streamManager.bindView({ view: 'pip-view', ... });

// 三个视图共享同一个流，自动同步播放状态
```

### Q4: 如何知道当前有多少个大流？

**回答**：使用内部方法查询（仅用于调试）：

```typescript
const streamManager = StreamPlayManager.getInstance();

// 通过私有属性访问（仅开发环境）
console.log((streamManager as any).videoQualityManager.getHighQualityCount());
```

**正式环境不建议直接访问私有属性。**

### Q5: StreamPlay.vue 为什么只负责视图绑定？

**回答**：这是架构设计决策，遵循单一职责原则：

- **StreamPlay.vue**：UI 组件，负责视图渲染和生命周期管理
- **StreamPlayManager**：业务逻辑，负责流播放控制和状态管理

**好处**：
- ✅ 组件逻辑简单，易于理解
- ✅ 业务逻辑集中，便于复用
- ✅ 测试更容易，UI 和业务分离

### Q6: 如何调试流播放问题？

**步骤**：

```typescript
// 1. 开启控制台日志
// 所有模块都会输出日志，格式：[ModuleName] message

// 2. 检查流信息
const streamInfo = streamManager.getStreamInfo(userId, streamType);
console.log('Stream Info:', streamInfo);

// 3. 检查播放状态
const isPlaying = streamManager.isStreamPlaying(userId, streamType);
console.log('Is Playing:', isPlaying);

// 4. 检查可见性
const hasVisible = streamManager.hasVisibleView(userId, streamType);
console.log('Has Visible View:', hasVisible);

// 5. 检查 DOM 元素
const view = document.getElementById('video-container-id');
console.log('View Element:', view);
console.log('View Size:', view?.clientWidth, view?.clientHeight);
```

### Q7: 性能优化建议？

**建议**：

1. **启用懒加载**：多人会议场景必须启用
```typescript
lazyLoad: { enable: true }
```

2. **及时解绑视图**：组件销毁时立即解绑
```typescript
onBeforeUnmount(() => {
  streamManager.unbindView({ ... });
});
```

3. **使用虚拟滚动**：参与人数 > 20 时使用虚拟滚动
```typescript
// 配合 vue-virtual-scroller 等库使用
```

4. **合理设置大流数量**：默认 6 个，可根据网络状况调整
```typescript
// 在 VideoQualityManager.ts 中修改
const HIGH_QUALITY_NUMBER = 4;  // 网络较差时降低
```

---

## 📜 版本历史

### v2.0 (当前版本) - 2024-11

**重大更新**：重构命名规范，统一使用 `Manager` 后缀

**重命名映射**：
- `StreamController` → `StreamPlayer` (流播放器)
- `ViewManager` → `StreamInfoManager` (流信息管理器)
- `IntersectionMonitor` → `LazyLoadManager` (懒加载管理器)
- `ResizeMonitor` → `VideoQualityManager` (视频质量管理器)

**优化点**：
- ✅ 统一命名规范，提高代码可读性
- ✅ 清晰的职责划分，降低理解成本
- ✅ 专业的命名方式，符合工程规范
- ✅ 完善的文档和示例

### v1.0 - 2024-10

**初始版本**：
- ✅ 模块化架构设计
- ✅ 懒加载功能
- ✅ 自动质量切换
- ✅ 多视图支持

---

## 📝 注意事项

### 开发注意事项

1. **DOM 元素 ID**：确保传入的 DOM 元素 ID 存在且唯一
2. **内存管理**：及时调用 `unbindView` 解绑不需要的视图
3. **资源清理**：应用退出时调用 `cleanup()` 清理资源
4. **单例模式**：使用 `getInstance()` 获取实例，避免创建多个实例

### 最佳实践

```typescript
// ✅ 推荐：使用单例
const streamManager = StreamPlayManager.getInstance();

// ❌ 不推荐：创建新实例
const streamManager = new StreamPlayManager();  // 无效，会返回单例

// ✅ 推荐：启用懒加载
lazyLoad: { enable: true }

// ✅ 推荐：及时解绑
onBeforeUnmount(() => {
  streamManager.unbindView({ ... });
});

// ✅ 推荐：使用 TypeScript 类型
import { VideoStreamType, VideoStreamQuality } from '../../../types';
```

---

## 🔗 相关资源

- **源码位置**：`ui-component/packages/uikit-component-vue3/src/components/RoomParticipantView/StreamPlayManager/`
- **使用示例**：`StreamPlay.vue`
- **类型定义**：`ui-component/packages/uikit-component-vue3/src/types/`

---

## 📮 反馈与支持

如有问题或建议，请联系团队或提交 Issue。

---

**Happy Coding! 🚀**
