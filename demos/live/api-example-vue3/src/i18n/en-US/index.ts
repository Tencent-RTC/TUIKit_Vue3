// English (en-US) i18n resources — assembled from per-module definitions.
//
// Key convention: `Module.FirstLetterUpper` (e.g. `Common.Login`,
// `Menu.Pending`, `Card.LoginStateDesc`). The merged key set MUST stay
// identical to `zh-CN/index.ts`; only the values differ (English vs
// Chinese). Example titles are content literals and are not keyed here;
// they fall back to the Chinese source string in both locales.
//
// Split by concern:
//   - `./ui`      global (non-state-list) UI chrome
//   - `./cards/*` one file per API state list (group title + example
//                   titles + card descriptions for that list)

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
