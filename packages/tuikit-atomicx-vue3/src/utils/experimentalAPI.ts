import type { ExperimentalAPIParamsMap, CallExperimentalAPI } from '../types/experimentalAPI';
import { dataReport, MetricsKey } from '../report';
import {
  setStoredIMProxyConfig,
  setStoredRTCProxyConfig,
  setStoredRtcAssetsPath,
} from './experimentalAPIStore';

export type { ExperimentalAPIParamsMap, CallExperimentalAPI };

/**
 * Stores experimental SDK configuration for later consumption.
 *
 * This function is intentionally side-effect-free with respect to SDK calls.
 * Stored values are read and applied at the appropriate lifecycle points:
 *  - IM proxy → merged into options inside LoginState.login()
 *  - RTC proxy → applied in useRoomEngine once TUIRoomEngine fires 'ready'
 *  - RTC assets path → applied in useRoomEngine once TUIRoomEngine fires 'ready'
 */
export const callExperimentalAPI: CallExperimentalAPI = <T extends string>({
  api,
  params,
}: {
  api: T;
  params?: T extends keyof ExperimentalAPIParamsMap
    ? ExperimentalAPIParamsMap[T]
    : Record<string, any>;
}): void => {
  if (api === 'setNetworkProxy') {
    const p = params as ExperimentalAPIParamsMap['setNetworkProxy'] | undefined;
    if (p?.im) {
      setStoredIMProxyConfig(p.im);
    }
    if (p?.rtc) {
      setStoredRTCProxyConfig(p.rtc);
    }
    dataReport.reportCount(MetricsKey.T_METRICS_STATE_API_SET_NETWORK_PROXY_COUNT);
    return;
  }

  if (api === 'setRtcAssetsPath') {
    const p = params as ExperimentalAPIParamsMap['setRtcAssetsPath'] | undefined;
    if (p?.assetsPath) {
      setStoredRtcAssetsPath(p.assetsPath);
    }
    dataReport.reportCount(MetricsKey.T_METRICS_STATE_API_SET_RTC_ASSETS_PATH_COUNT);
  }
};
