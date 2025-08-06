const request = require('request');
const { getPullStreamUrl } = require('../utils/index.js');
const { getBasicInfo } = require('../config/basic-info-config.js');
const { RequestMethods } = require('../types/index.js');
const { Config } = require('../../config/index.js');

const { SdkAppId, Identifier, Protocol, Domain } = Config;
const userInfo = getBasicInfo();

const requestInterface = {
  destroyRoom: 'v4/live_engine_http_srv/destroy_room',
  fetchLiveList: 'v4/live_engine_http_srv/get_room_list',
  getRoomInfo: 'v4/live_engine_http_srv/get_room_info'
};

const sendRequest = (url, method, data = {}) => {
  return new Promise((resolve, reject) => {
    request(
      {
        url,
        method,
        qs: method === RequestMethods.GET ? data : undefined,
        body: method === RequestMethods.GET ? undefined : data,
        json: true,
      },
      (err, res, body) => {
        if (res && res.statusCode === 200) {
          resolve(body);
        } else {
          reject(err);
        }
      }
    );
  });
};

const fetchLiveList = async (next, count = 20) => {
  checkAdminUserSig();
  if (count > 20) {
    throw { code: -1, message: 'count must be less than 20' };
  }
  const url = getPullStreamUrl(
    Protocol,
    Domain,
    requestInterface.fetchLiveList,
    SdkAppId,
    Identifier,
    userInfo.UserSig
  );
  const response = await sendRequest(url, RequestMethods.POST, {
    Next: next,
    Count: count,
  });
  return response;
};

const destroyRoom = async roomId => {
  checkAdminUserSig();
  const url = getPullStreamUrl(Protocol, Domain, requestInterface.destroyRoom, SdkAppId, Identifier, userInfo.UserSig);
  const response = await sendRequest(url, RequestMethods.POST, {
    RoomId: roomId,
  });
  return response;
};

const getRoomInfo = async roomId => {
  checkAdminUserSig();
  const url = getPullStreamUrl(Protocol, Domain, requestInterface.getRoomInfo, SdkAppId, Identifier, userInfo.UserSig);
  const response = await sendRequest(url, RequestMethods.POST, {
    RoomId: roomId,
  });
  return response;
};

const checkAdminUserSig = () => {
  if (!userInfo || !userInfo.UserSig) {
    throw { code: -1, message: 'UserSig is undefined' };
  }
};

module.exports = { fetchLiveList, destroyRoom, getRoomInfo };
