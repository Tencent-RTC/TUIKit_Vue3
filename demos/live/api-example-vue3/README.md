# LiveKit Vue3 · 直播 State API Example

面向接入方的「会跑的说明书」：把 `tuikit-atomicx-vue3`（LiveKit Vue3）直播相关 state hook
的对外 API 拆成**最小颗粒度**的示例卡片，每张卡片**独立可运行、独立可观察事件、独立可复制代码**，
零拼装即可在自己的工程里照搬。

对应 PRD：`doc/tech-design/icebergfeng/live-state-api-example-2026-06-22.md`

---

## 1. 项目背景

LiveKit Vue3 把直播能力拆成一组 state hooks（`useLiveListState` / `useLiveAudienceState` /
`useLivePlayerState` / `useDeviceState` / `useCoGuestState` …），每个 hook
对外暴露 **响应式 state + 命令式 actions + 事件订阅** 三类成员。这套面向"状态"的设计相比传统
组件接入更灵活，但也带来一个新问题：

> **接入方很难一眼看清"某个 API 怎么调、传什么、什么时机回调、和别的 API 如何联动"**。

老牌 demo 站点是"页面级"的：登录 → 进房 → 观看，业务流程串得很紧，单个 API 的演示反而被淹没。
本项目用相反的思路：

- **每个 API 一张卡片**，签名、入参表单、Run 按钮、运行结果、订阅事件日志、可复制 snippet
  全部就地展示；
- **卡片之间共享同一份 SDK 实例 / 同一份登录态 / 同一份 `liveId`**，方便联动调试（如主播侧
  `endLive` → 观众侧收到 `onLiveEnded`）；
- **运行时可在 workspace 源码 ↔ 已发布 npm 版本之间切换**，发版前可在同一个 UI 上跑回归。

它既是**接入参考**（用户读了立刻知道怎么用），也是**发版回归台**（QA / 我们自己跑契约对齐）。

---

## 2. 快速开始

需要 Node `>=18` + `pnpm@9.x`（仓库根已固定）。

```bash
# 1. 在仓库的 ui-component workspace 安装依赖
cd ui-component
pnpm install

# 2. 启动本站点（默认 workspace 源码模式）
pnpm -C demos/live/api-example-vue3 dev
```

打开后：

1. **右上角输入任意 `userId`** 完成 dev 快速登录。userSig 走公共 TRTC `UserSigService`
   测试端点，**仅供自测**。
2. **顶部填写共享 `liveId`、切换角色**（主播 / 观众 / 管理员）。同一个 `liveId` 下不同
   tab 不同角色即可联动。
3. **左侧按 state 分组选择 API**，右侧查看 **签名 · 入参 · Run · 运行结果 · 可复制 snippet**。
4. **底部全局 EventLog Dock**：展示所有卡片订阅的事件流，按角色染色、未读自动 peek，
   折叠后仍可见心跳指示。

> **安全提示**：生产接入必须由业务后台下发 `userSig`，**切勿在前端内置密钥**。
> 可通过环境变量 `VITE_SDKAPPID` / `VITE_USERSIG_ENDPOINT` 覆盖默认配置。

### Deep Link（URL 直达）

```
#/live-list/startLive            # 直接定位某个 API 卡片
?role=audience&liveId=xxx        # 预设角色与直播间
?apiId=live-list.startLive       # 预设并自动定位
?userId=test_user                # 预填登录 userId
```

### 多角色联动

顶栏「**新开窗口（不同角色）**」按钮：以相同 `liveId`、不同 `role` 打开第二个标签页，
便于观察 主播 / 观众 / 管理员 之间的事件流转。EventLog 事件按角色染色，一眼看出
"谁发的"和"谁收到的"。

---

## 3. 可用脚本

```bash
pnpm -C demos/live/api-example-vue3 dev            # 启动 dev（workspace 模式）
pnpm -C demos/live/api-example-vue3 dev:online     # 启动 dev（online npm 版本模式，需先 vendor:install）
pnpm -C demos/live/api-example-vue3 build          # 生产构建（workspace 模式）
pnpm -C demos/live/api-example-vue3 build:online   # 生产构建（online 模式）
pnpm -C demos/live/api-example-vue3 preview        # 预览构建产物
pnpm -C demos/live/api-example-vue3 vendor:install --version 6.2.5
                                                   # 预安装某个已发布版本到 vendor
pnpm -C demos/live/api-example-vue3 lint           # ESLint
pnpm -C demos/live/api-example-vue3 test:coverage  # 契约覆盖率回归（见 §6）
```

---

## 4. 工程结构

```
ui-component/demos/live/api-example-vue3/
├── index.html                  # 入口 HTML（注入 importmap，见 §5）
├── vite.config.ts              # 启动时按 .current.json / 环境变量决定 alias / dedupe
├── package.json
├── scripts/                    # 构建期 / dev-only 工具脚本（不被业务代码引用）
├── src/
│   ├── main.ts                 # 应用入口（SDK 加载 + overlay + 挂载）
│   ├── env.d.ts                # 类型声明（vite/client + ImportMetaEnv）
│   ├── i18n/                   # 国际化资源（src 顶层，跨 app/lib/examples 横切）
│   │   ├── index.ts
│   │   ├── zh-CN.ts
│   │   └── en-US.ts
│   ├── app/                    # 应用外壳
│   │   ├── App.vue             # 根组件（scoped 样式）
│   │   ├── router.ts
│   │   ├── global.scss         # 唯一全局样式入口
│   │   └── layout/             # demo 外壳 chrome（路由 / 菜单 / 顶栏）
│   │       ├── Topbar.vue
│   │       ├── ApiMenu.vue
│   │       ├── UserMenuCard.vue
│   │       └── Placeholder.vue
│   ├── examples/               # 示例定义 + 自动发现装配
│   │   ├── index.ts            # import.meta.glob 自发现 + safeBuildGroup + useManifest
│   │   ├── loginState.ts       # 每个文件 export { meta, factory }
│   │   ├── liveListState.ts
│   │   ├── liveAudienceState.ts
│   │   ├── livePlayerState.ts
│   │   ├── deviceState.ts
│   │   ├── coGuestState.ts
│   │   ├── coHostState.ts
│   │   ├── battleState.ts
│   │   ├── liveGiftState.ts
│   │   └── liveBarrageState.ts
│   ├── lib/                    # 无状态可复用构件
│   │   ├── components/         # 通用 UI 组件
│   │   │   ├── ExampleCard.vue         # 单张卡片渲染器（签名/表单/Run/结果）
│   │   │   ├── CodeBlock.vue
│   │   │   ├── JsonEditor.vue
│   │   │   └── PrettySelect.vue
│   │   ├── stages/             # 领域渲染舞台
│   │   │   ├── GlobalLiveStage.vue     # 全局 LiveView 渲染舞台（player/device 用）
│   │   │   └── GlobalCameraStage.vue   # 全局摄像头预览
│   │   ├── composables/        # 组合式函数
│   │   │   └── useDraggable.ts
│   │   ├── utils/              # 纯工具 / 基础设施
│   │   │   └── codeMirrorSetup.ts
│   │   └── types/              # 数据模型（按域拆分）
│   │       ├── role.ts                 # Role 枚举 / ALL_ROLES / ROLE_LABEL
│   │       ├── mount.ts                # MountSpec
│   │       ├── example.ts              # ExampleDef / ExampleGroup / GroupMeta / FieldDef …
│   │       └── index.ts                # 薄 barrel 再导出
│   └── services/               # 有状态 / 副作用子系统
│       ├── sdk-source/         # SDK 来源切换（workspace ↔ online）
│       │   ├── facade.ts               # 统一从此处 re-export SDK 入口
│       │   ├── missingClient.ts        # SDK 缺失时的占位客户端
│       │   ├── SdkSourcePicker.vue     # 顶栏徽章 + 安装下拉
│       │   ├── fatal-overlay/          # SDK 加载失败的全局红屏
│       │   │   ├── sdkFatalOverlay.ts
│       │   │   └── sdkFatalOverlay.bootstrap.ts
│       │   └── adapter/                # workspace / online 两套解析适配
│       ├── session/            # 登录会话 / 角色 / liveId
│       │   ├── session.ts
│       │   ├── derivedRole.ts          # 从 SDK 状态推导角色（非用户选择）
│       │   ├── RoleSwitcher.vue
│       │   └── env.ts
│       ├── event-log/          # 全局事件日志子系统
│       │   ├── GlobalEventLogDock.vue  # 底部折叠 dock + 心跳指示
│       │   ├── EventLog.vue            # 列表渲染（含 globalMode 多源 chips）
│       │   ├── store.ts                # 全局事件队列
│       │   ├── useSubscription.ts      # 卡片侧订阅适配
│       │   ├── useDemoHandlerToggle.ts
│       │   ├── buildSubscriptionCards.ts
│       │   ├── bridge.ts               # SDK 事件 → store 桥接
│       │   └── actions.ts              # clear / filter 等动作
│       └── toast/              # 调用方 toast 反馈
│           ├── ToastStack.vue
│           └── store.ts
├── tests/
│   └── coverage.spec.ts        # 契约覆盖率回归（新增 API 未补示例则失败）
└── vendor/                     # online 模式独立 npm root（脚本生成，git ignore）
```

### 设计原则

- **顶层目录语义化**：`app`（应用外壳）、`examples`（示例内容）、`lib`（无状态构件）、
  `services`（有状态子系统）、`i18n`（横切国际化）——各司其职，新增模块该放哪一眼可判。
- **`examples/` 自发现**：`index.ts` 用 `import.meta.glob('./*State.ts', { eager: true })`
  自动收集所有示例文件，无需维护中央清单。新增示例只需建 1 个文件。
- **子系统独立目录**：带 store / 副作用的域（sdk-source / session / event-log / toast）
  放在 `services/` 下，各自封装内部状态，跨子系统通信只走顶层导出的 store / types。
- **`lib/` 无状态**：UI 组件、渲染舞台、组合函数、纯工具、数据模型——不持有运行时状态，
  可被任意层安全引用。
- **`scripts/*.mjs` 不要被业务代码引用**——它们是 vite 构建期 / dev-server 期的能力。

---

## 5. SDK 来源切换（workspace ↔ 线上 npm 版本）

本站点支持在**运行时**切换 `tuikit-atomicx-vue3` 的解析来源——
**右上角顶栏点击 SDK 徽章**即可：

| 来源 | 说明 |
| --- | --- |
| **workspace**（默认） | 调用 monorepo 当前源码 (`ui-component/packages/uikit-component-vue3`)，本地改动即时生效 |
| **online**（已发布版本） | 拉取到 `vendor/tuikit-atomicx-online/node_modules` 的真实 npm 版本——用于发版前回归 |

### 5.1 运行时切换

```bash
pnpm -C demos/live/api-example-vue3 dev
```

1. 点开顶栏「**SDK · ...**」徽章 → 弹出下拉。
2. 「**Online (published)**」区域**输入版本号**（如 `6.2.5` / `latest` / `next`）→ 点 **Install**。
   后台会在 `vendor/tuikit-atomicx-online/` 这个**独立 npm root** 里跑 `npm install`，
   不影响 monorepo 的 workspace symlink。
3. 安装成功后版本会出现在列表里，点它即可切换；vite 自动重启、页面自动刷新，新版本生效。
4. 切回 workspace 同样一键完成。

> 切换时 vite 会执行 `server.restart()`，浏览器在 WS 重连时收到 `vite:beforeFullReload`
> 并整页刷新——这是**设计目的**：保证彻底切换底层 SDK 资源，所有运行时状态
> （含登录、liveId 等）一并重置。

### 5.2 CLI / CI 启动

**默认（推荐）—— workspace 模式**：CI / 蓝盾流水线只想产出可发布制品时，
用默认 `build` 命令即可，走 pnpm workspace 符号链接、零外部依赖：

```bash
pnpm -C demos/live/api-example-vue3 build          # workspace 模式（默认，无前置步骤）
pnpm -C demos/live/api-example-vue3 dev            # 本机开发同理
```

**online 模式（可选，用于验证 npm 发布产物）**：必须**先** `vendor:install` 把
vendor 里的 SDK + peer 依赖树装齐，才能跑 `dev:online` / `build:online`；否则
`vite.config.ts` 会在 `ensureOnlineInstalled` 处直接抛错，因为 online 模式的整个
alias 表都指向 `vendor/tuikit-atomicx-online/node_modules`：

```bash
# 1) 预先安装一份指定版本（必须！否则 build:online 会失败）
pnpm -C demos/live/api-example-vue3 vendor:install --version 6.2.5

# 2) 再跑 online 模式（环境变量驱动，无须 UI 交互）
pnpm -C demos/live/api-example-vue3 dev:online
pnpm -C demos/live/api-example-vue3 build:online
```

> 常见 CI 误用：直接把构建命令配成 `pnpm build:online` 而没有 `vendor:install`
> 前置步骤，报错 `[sdk-switcher] online source is selected but the vendor
> copy is missing at .../vendor/tuikit-atomicx-online/node_modules/tuikit-atomicx-vue3`。
> 解决方式：如果不是明确要验证 npm 发布产物，改用 `pnpm build`（workspace
> 模式）即可；确需 online 则在 build 之前串一步 `pnpm vendor:install --version <x.y.z>`。

### 5.3 实现要点

#### (1) SDK 与它的依赖图作为一个整体切换

`tuikit-atomicx-vue3` 声明了大量 `peerDependencies`。不同 SDK 版本要求的 peer 版本范围会变。
"切到 online 模式"不能只切 SDK 入口包，必须**同时切整个依赖图**——否则 vendor 内 SDK 的
`import '@tencentcloud/tui-core-lite'` 会回退到 demo 的 monorepo `node_modules`，拿到
workspace 版本，**模拟出来的运行环境就不准确**。

为此 `install-online-sdk.mjs` 跑**两次 `npm install`**：

1. 第一次只装 `tuikit-atomicx-vue3@<version>`，目的是拿到它当前的 `peerDependencies` 清单。
2. 第二次把所有 non-optional peer 一起写进 vendor `package.json` 的 `dependencies`，再装一次。

最终 `vendor/tuikit-atomicx-online/node_modules` 是一棵**自包含、版本对齐**的完整依赖树。

#### (2) Alias 策略：vendor 内每个包都重定向，但保留单例豁免

`vite.config.ts` 启动时扫描 `vendor/node_modules` 顶层，把每个真实存在的包都注册成
`resolve.alias`，**除了 SINGLETON_PACKAGES**：

```js
SINGLETON_PACKAGES = ['vue', 'vue-router', '@tencentcloud/uikit-base-component-vue3']
```

这些"必须单例"的包（响应式系统 / 路由 / 全局主题 Provider）即使 vendor 装了一份也**不**加
alias，让它们继续走 demo 的 `node_modules`——保证 demo 与 SDK 共享一份 Vue 实例 / 一份
router 实例。同时配上 `resolve.dedupe` 与 `optimizeDeps.exclude` 做兜底。

#### (3) 运行时控制

- `scripts/sdkSwitcherPlugin.mjs` 是 **dev-only** vite 插件（`apply: 'serve'`），在
  dev server 上暴露 `GET /__sdk/state`、`POST /__sdk/install`、`POST /__sdk/switch` 端点。
- `vite.config.ts` 启动时按优先级 **`.current.json` > `VITE_ATOMICX_SOURCE` 环境变量
  > workspace** 决定 alias / dedupe / optimizeDeps。
- 卡片 snippet 内嵌的 `import { ... } from 'tuikit-atomicx-vue3'` 字符串**保持不变**——
  它代表接入方真实接入路径，与 demo 实际解析到的源码无关。

#### (4) 生产构建：esm.sh + importmap

`build` 产物不再 bundle SDK，而是通过 `index.html` 注入的 **importmap** 指向 `esm.sh`
按需加载，再由 `genHostShim.mjs` 生成的 **host-shim** 把宿主侧的单例
（`vue` / `vue-router` / `@tencentcloud/uikit-base-component-vue3`）转 ESM 暴露给 SDK，
保证只有一份实例。`injectImportMapBootstrapPlugin.mjs` 负责把这段 bootstrap 注入到
最终 HTML 的 `<head>`。

部署位置无关：inline 引导脚本用 `document.currentScript.baseURI` 派生部署根目录的绝对 URL，
同一份 `dist/` 无论部署在根路径、深层子路径、hash 路由还是 `file://` 都能正确解析。
`tests/coverage.spec.ts` 对 8 种部署 URL 场景做了 unit-level 验证。

#### (5) Prod 模式 SDK 样式表注入

`tuikit-atomicx-vue3/dist/index.js` 以 `import './styles/index.css'` 开头（约 340KB）。
dev 模式下 vite 经 workspace alias 自动注入；但 **build 模式经 esm.sh 加载时 CSS 副作用
被剥离**——样式不会自动上页。`main.ts` 在 prod 启动路径里注入 `<link rel="stylesheet">`，
与 SDK JS 的 dynamic import 用 `Promise.all` 并行加载。CSS URL 按 `x-esm-css` →
`x-esm-path` → 硬编码路径降级解析，不硬编码。

#### (6) Facade 契约 preflight

`vite build` 首个 plugin 会先扫一次 `src/examples/*.ts` 顶层 `import` vs
`src/services/sdk-source/facade.ts` 顶层 `export` 求差集，缺 forwarder 就在 `buildStart`
阶段直接 abort，避免原生 rollup 报错上下文不足。同一份 scanner 也被 `test:coverage` 使用。

#### (7) 安全

`/__sdk/*` 端点只在 `vite serve` 模式注册（`apply: 'serve'`），生产构建不包含这些路由；
vite dev server 默认仅监听 localhost。

#### (8) 已知限制

- **TypeScript 类型不切换**：online 模式只影响运行时 bundle，TS 类型解析仍走 workspace
  的 `.d.ts`。online 模式是「runtime 回归」工具，**不验证类型签名**。
- **磁盘占用**：每个 online 版本一份完整 vendor `node_modules`（约 150–200MB）。如需清理，
  删除 `vendor/tuikit-atomicx-online/node_modules` 即可，下次切换会自动重装。

---

## 6. 覆盖进度与契约回归

| 矩阵 | State | 状态 |
| --- | --- | --- |
| 6.0 | `useLoginState` | ✅ 已实现 |
| 6.1 | `useLiveListState` | ✅ 已实现 |
| 6.2 | `useLiveAudienceState` | ✅ 已实现 |
| 6.4 | `useCoGuestState` | ✅ 已实现 |
| 6.5 | `useCoHostState` | ✅ 已实现 |
| 6.6 | `useBattleState` | ✅ 已实现 |
| 6.7 | `useBarrageState` | ✅ 已实现 |
| 6.8 | `useLiveGiftState` | ✅ 已实现 |
| 6.9 | `useLivePlayerState` | ✅ 已实现（含 LiveView 渲染舞台） |
| 6.11 | `useDeviceState`（开播/连麦子集） | ✅ 已实现（含主播本地预览） |

> 6.3 `useLiveSeatState` 暂未接入（麦位管理 UX 待定）。
> 6.10 `useLiveMonitorState` 是内部运营监播 hook，非公开 API，不在本 demo 覆盖范围内。

```bash
pnpm -C demos/live/api-example-vue3 test:coverage
```

测试直接扫描 `uikit-core` 的契约类型（`ILiveXxxStateReturn`），提取**可调用且非 `@deprecated`**
的 API，与 `src/examples/*.ts` 中声明的 `api: '...'` 卡片求差集。新增 API 未补示例时测试失败，
可接入 CI 拦截 PR。

> 为什么扫描契约**类型**而非运行期返回对象：部分 hook 通过 `...actions` 展开注入方法，
> 朴素扫描对象字面量 keys 会漏报。详见 PRD 评审修正项。

---

## 7. 新增一组示例

1. 在 `src/examples/` 新建 `xxxState.ts`，导出 `meta` 和 `factory`：

   ```ts
   import type { ExampleGroup, GroupMeta } from '../lib/types';

   export const meta: GroupMeta = {
     state: 'xxx',
     hook: 'useXxxState',
     title: 'XXX',
     category: '6.x',
     source: 'XxxState/index.ts',
   };

   function useXxxExamples(): ExampleGroup {
     // 调用对应 hook、订阅事件、为每张请求型卡片配 successToast
     // ...
   }

   export { useXxxExamples as factory };
   ```

2. 运行 `test:coverage` 确认无遗漏。

无需改 `examples/index.ts`——`import.meta.glob` 自动发现新文件。
无需改 `tests/coverage.spec.ts`——`scanFacadeContract` 自动扫描目录。

### `successToast` 三态约定

```ts
// 请求型 API（如 applyForSeat / sendChatMessage）：自定义文案
successToast: { title: '上麦申请已发送' }

// 状态读取型 API：明确关闭，不打扰
successToast: false

// 不写：使用默认通用文案"调用成功"
```
