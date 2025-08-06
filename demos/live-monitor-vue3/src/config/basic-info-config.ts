import type { BasicUserInfo } from '../types';
import LibGenerateTestUserSig from './lib-generate-test-usersig-es.min.ts';

export function getBasicInfo(
  userId: string,
  sdkAppId: number,
  sdkSecretKey: string,
  expireTime: number = 604800
): BasicUserInfo | undefined {
  if (sdkAppId === 0 || sdkSecretKey === '') {
    alert('Please configure your sdkAppId in config/basic-info-config.js');
    return;
  }
  const generator = new LibGenerateTestUserSig(sdkAppId, sdkSecretKey, expireTime);
  const userSig = generator.genTestUserSig(userId);
  return {
    sdkAppId: sdkAppId,
    userId: userId,
    userSig,
    userName: userId,
    avatarUrl: '',
  };
}
