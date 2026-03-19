import { classNames } from './class-names';

export const isH5 = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

export function checkUserID(userID: string) {
  const regex = /^[a-zA-Z0-9_-]{1,32}$/;
  return regex.test(userID);
}

export function trim(str: string) {
  return str.replace(/\s/g, "");
}

export function getUrl() {
  return window?.location.href;
}

export function getUrlParam(key: string) {
  const url = window.location.href.replace(/^[^?]*\?/, '');
  const regexp = new RegExp(`(^|&)${key}=([^&#]*)(&|$|)`, 'i');
  const paramMatch = url.match(regexp);

  return paramMatch ? paramMatch[2] : null;
}

export function setLocalStorage(key: string, value: string) {
  localStorage.setItem(key, value);
}

export function getLocalStorage(key: string) {
  return localStorage.getItem(key);
}

export {
  classNames,
}
