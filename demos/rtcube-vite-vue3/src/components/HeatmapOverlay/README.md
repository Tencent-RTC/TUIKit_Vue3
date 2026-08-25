# 点击热力图 (HeatmapOverlay)

基于 Aegis/RUM 平台导出的点击数据，在页面元素上叠加显示点击次数和占比的可视化工具。

## 启动方式

```bash
# 在 rtcube/demos/web-vite-vue3 目录下执行
npm run dev:heatmap
```

该命令会注入 `VITE_HEATMAP=true` 环境变量，页面加载后自动显示热力图。

普通 `npm dev` 启动时热力图默认关闭。

## 运行时快捷键

| 快捷键 | 说明 |
|--------|------|
| `Ctrl+Shift+H` | 开启/关闭热力图（Windows/Linux/Mac 通用） |

## 更新数据

1. 从 Aegis/RUM 平台导出 CSV 文件（格式：`"编号","Ext1","数量(占比)"`）
2. 替换 `rum-data.csv` 文件内容
3. 刷新页面即可看到新数据

## 文件说明

| 文件 | 说明 |
|------|------|
| `HeatmapOverlay.vue` | 热力图渲染组件，扫描 DOM 并在匹配元素上叠加 badge |
| `heatmapData.ts` | 数据层，负责加载 CSV、解析 ext1、映射到 CSS selector |
| `rum-data.csv` | RUM 平台导出的点击数据（可直接替换） |
| `index.ts` | 模块导出 |

## ext1 映射规则

`heatmapData.ts` 中维护了两套映射表：

- **精确匹配** (`EXACT_EXT1_MAP`)：如 `home | chat` → 首页 Chat 场景卡片
- **前缀匹配** (`PREFIX_EXT1_MAP`)：如 `home | chat | Web | https://...` → 首页 Chat 的 Web 快速接入链接

无法匹配的 ext1 值（如 `page_leave` 产生的 `detail | chat | general | {userID}`）会被自动忽略。
