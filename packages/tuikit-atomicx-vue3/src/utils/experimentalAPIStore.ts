import type { IMProxyConfig, RTCProxyConfig } from '../types/experimentalAPI';

export type { IMProxyConfig, RTCProxyConfig };

let storedIMProxyConfig: IMProxyConfig | undefined;
let storedRTCProxyConfig: RTCProxyConfig | undefined;
let storedRtcAssetsPath: string | undefined;

export function getStoredIMProxyConfig(): IMProxyConfig | undefined {
  return storedIMProxyConfig;
}

export function getStoredRTCProxyConfig(): RTCProxyConfig | undefined {
  return storedRTCProxyConfig;
}

export function getStoredRtcAssetsPath(): string | undefined {
  return storedRtcAssetsPath;
}

export function setStoredIMProxyConfig(config: IMProxyConfig) {
  storedIMProxyConfig = { ...storedIMProxyConfig, ...config };
}

export function setStoredRTCProxyConfig(config: RTCProxyConfig) {
  storedRTCProxyConfig = { ...storedRTCProxyConfig, ...config };
}

export function setStoredRtcAssetsPath(path: string) {
  storedRtcAssetsPath = path;
}
