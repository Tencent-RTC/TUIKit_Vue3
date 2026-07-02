export interface IMProxyConfig {
  proxyServer?: string;
  fileUploadProxy?: string;
  fileDownloadProxy?: string;
}

export interface RTCProxyConfig {
  websocketProxy?: string;
  turnServer?: { url: string; username: string; credential: string }[];
  iceTransportPolicy?: 'relay' | 'all';
}

export interface ExperimentalAPIParamsMap {
  setNetworkProxy: {
    im?: IMProxyConfig;
    rtc?: RTCProxyConfig;
  };
  setRtcAssetsPath: {
    assetsPath: string;
  };
  [api: string]: Record<string, any>;
}

export type CallExperimentalAPI = <T extends string>(options: {
  api: T;
  params?: T extends keyof ExperimentalAPIParamsMap
    ? ExperimentalAPIParamsMap[T]
    : Record<string, any>;
}) => void;
