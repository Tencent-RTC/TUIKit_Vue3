// 简体中文 (zh-CN) i18n 资源 — 由各模块定义合并而成。
//
// 键约定：`Module.FirstLetterUpper`（如 `Common.Login`、`Menu.Pending`、
// `Card.LoginStateDesc`）。合并后的键集合必须与 `en-US/index.ts` 完全一致；
// 仅值不同（中文 vs 英文）。示例标题为原文，未在此处建键，两种语言均回退
// 到中文原文。
//
// 按职责拆分：
//   - `./ui`      全局（非 state 列表）通用文案
//   - `./cards/*`  每个 API state 列表一个文件（该列表的分组标题 + 示例标题
//                   + 卡片描述）

import { ui } from './ui';
import { battle } from './cards/battle';
import { coGuest } from './cards/coGuest';
import { coHost } from './cards/coHost';
import { device } from './cards/device';
import { liveAudience } from './cards/liveAudience';
import { liveBarrage } from './cards/liveBarrage';
import { liveGift } from './cards/liveGift';
import { liveList } from './cards/liveList';
import { livePlayer } from './cards/livePlayer';
import { liveSeat } from './cards/liveSeat';
import { login } from './cards/login';

export const resource = {
  ...ui,
  ...battle,
  ...coGuest,
  ...coHost,
  ...device,
  ...liveAudience,
  ...liveBarrage,
  ...liveGift,
  ...liveList,
  ...livePlayer,
  ...liveSeat,
  ...login,
};
