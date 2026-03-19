export const USER_AGENT = window.navigator && window.navigator.userAgent || '';

export const IS_IPAD = (/iPad/i).test(USER_AGENT);

export const IS_IPHONE = (/iPhone/i).test(USER_AGENT) && !IS_IPAD;
export const IS_IPOD = (/iPod/i).test(USER_AGENT);
export const IS_IOS: boolean = IS_IPHONE || IS_IPAD || IS_IPOD;
export const IS_ANDROID: boolean = (/Android/i).test(USER_AGENT);
export const IS_WECHAT: boolean = (/(micromessenger|webbrowser)/i).test(USER_AGENT); // 微信浏览器
