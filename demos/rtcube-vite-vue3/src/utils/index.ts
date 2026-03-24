interface ILoginInfo {
  sdkAppId: string;
  userId: string;
  token: string;
  oriUserId?: string;
  name?: string;
  userSig: string;
}

export function removeUserLoginInfo() {
  localStorage.removeItem("userInfo");
}

export function setUserLoginInfo(info: ILoginInfo) {
  localStorage.setItem("userInfo", JSON.stringify({ ...info }));
}

export function getUserLoginInfo() {
  const res = localStorage.getItem("userInfo");
  let info;
  if (res) {
    try {
      info = JSON.parse(res);
    } catch (e) {}
  }
  return info;
}

export function getQueryVariable(variable: string) {
  let query = window.location.search.substring(1);
  let vars = query.split("&");
  for (let i = 0; i < vars.length; i++) {
    var pair = vars[i].split("=");
    if (pair[0] == variable) {
      return pair[1];
    }
  }
  return false;
}

export function getUrlParams(paramKey: string) {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const param = urlParams.get(paramKey) || "";
  if (param) {
    return param;
  }
  // 存在 #/detail?scene=chatkit 这样的 case
  paramKey = paramKey.replace(/[\[\]]/g, "\\$&");
  const regex = new RegExp("[?&]" + paramKey + "(=([^&#]*)|&|#|$)");
  const results = regex.exec(window.location.href);
  if (!results) {
    return "";
  }
  if (!results[2]) {
    return "";
  }
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

export function removeUrlParams(url: string, key: string) {
  const baseUrl = url.split("?")[0] + "?";
  const query = url.split("?")[1];
  if (query.indexOf(key) > -1) {
    const obj: any = {};
    const arr: any = query.split("&");
    for (let i = 0; i < arr.length; i++) {
      arr[i] = arr[i].split("=");
      obj[arr[i][0]] = arr[i][1];
    }
    delete obj[key];
    const url =
      baseUrl +
      JSON.stringify(obj)
        .replace(/[\"\{\}]/g, "")
        .replace(/\:/g, "=")
        .replace(/\,/g, "&");
    return url;
  } else {
    return url;
  }
}

export function openWindow(url: string) {
  if (!url) {
    return false;
  }
  window.open(url, "_blank");
}

export function isGlobalization(url: string) {
  const urlList = [
    "tcms-demo.tencentcloud.com", // 国际站正式环境
    "experience-center-international-test", // 国际站预发布环境
    "homepage", // 国际站正式环境
  ];
  return urlList.some((item) => url.includes(item));
}

export function isCustomScene(scene: string) {
  // 目前仅支持 tccc 高级定制能力
  return scene === "tccc";
}

export function getCustomSceneUrl(scene: string, type: string) {
  const customLinkMap: any = {
    tccc: `https://tccc.qcloud.com/demo?from=exp`,
  };
  const customStepLinkMap: any = {
    tccc: "https://tccc.qcloud.com/experience-center-demo/",
  };
  if (!isCustomScene(scene)) {
    return "";
  }
  const tcccParamsStr = getUrlParams("tcccParams");
  if (tcccParamsStr && import.meta.env.MODE === "development") {
    try {
      const tcccParams = JSON.parse(tcccParamsStr);
      if (type === "contentUrl" && tcccParams.contentUrl) {
        return decodeURIComponent(tcccParams.contentUrl);
      }
      if (type === "sidebarUrl" && tcccParams.sidebarUrl) {
        return decodeURIComponent(tcccParams.sidebarUrl);
      }
    } catch (e) {}
  }
  if (type === "contentUrl") {
    return customLinkMap[scene] || "";
  }
  return customStepLinkMap[scene] || "";
}

export const pageHost = window.location.host;

export function getCurrentFormattedTime(date?: Date) {
  const now = date ?? new Date();
  const year = now.getFullYear();
  // 月份从0开始，需要加1，并补零
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours().toString().padStart(2, "0"));
  const minute = String(now.getMinutes().toString().padStart(2, "0"));
  const second = String(now.getSeconds().toString().padStart(2, "0"));
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

export const formatterTimeToHour = (date?: Date) => {
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");
  return `${hour}:${minute}:${second}`;
};
