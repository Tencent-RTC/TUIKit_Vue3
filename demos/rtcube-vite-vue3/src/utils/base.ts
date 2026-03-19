const getDomainAddress = () => {
  const defaultAddress = {
    BASE_URL: 'https://rtcube.cloud.tencent.com',
    DEMO_URL: 'https://web.sdk.qcloud.com',
    APPID: 100029100218
  };
  const { origin } = window.location;
  if (origin.includes('localhost')) return defaultAddress;
  // 基本都走这里
  if (origin.includes('rtcube.cloud.tencent') || origin.includes('trtc-web-experience-center-1258344699')) {
    return {
      BASE_URL: origin,
      DEMO_URL: 'https://web.sdk.qcloud.com',
      APPID: 100029100218
    };
  }

  if (origin.includes('web.sdk.qcloud')) {
    return {
      BASE_URL: origin,
      DEMO_URL: 'https://web.sdk.qcloud.com',
      APPID: 100028330914
    };
  }
  return defaultAddress;
};
export const domainAddress = getDomainAddress();

// 定义一个防抖函数
export const debounce = (fn: Function, delay: number) => {
  let timeout: any;
  return function (v: any) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      // @ts-ignore
      fn.apply(this, arguments);
    }, delay);
  };
};
