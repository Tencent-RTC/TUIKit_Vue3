const getRandomInt = () => {
  return Math.floor(Math.random() * 1000000000);
};

const getPullStreamUrl = (Protocol, Domain, Interface, SdkAppId, Identifier, UserId) => {
  return `${Protocol}${Domain}/${Interface}?sdkappid=${SdkAppId}&identifier=${Identifier}&usersig=${UserId}&random=${getRandomInt()}&contenttype=json`;
};

module.exports = {
  getRandomInt,
  getPullStreamUrl,
};
