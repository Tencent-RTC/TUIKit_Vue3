const { Config } = require('../../config/index.js');
const LibGenerateTestUserSig = require('./lib-generate-test-usersig-es.min.js');

const { SdkAppId, SecretKey, Identifier } = Config;

const userInfo = {
  UserId: Identifier,
  UserName: `Admin_${Identifier}`,
  AvatarUrl: '',
};

function getBasicInfo() {
  if (SdkAppId === 0 || SecretKey === '') {
    console.log('Please configure your SdkAppId in config/index.js.js');
    return;
  }
  const generator = new LibGenerateTestUserSig(SdkAppId, SecretKey, 604800);
  const UserSig = generator.genTestUserSig(userInfo.UserId) || '';
  const { UserId, UserName, AvatarUrl } = userInfo;
  return {
    SdkAppId,
    UserId,
    UserSig,
    UserName,
    AvatarUrl,
  };
}

module.exports = { getBasicInfo };
