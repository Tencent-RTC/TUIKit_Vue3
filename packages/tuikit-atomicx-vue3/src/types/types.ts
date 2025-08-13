export enum TUIErrorCode {
  // 操作成功
  ERR_SUCC = 0,

  // 暂未归类的通用错误
  ERR_FAILED = -1,

  // 请求被限频，请稍后重试
  ERR_FREQ_LIMIT = -2,

  // 重复操作
  ERR_REPEAT_OPERATION = -3,

  // 未找到SDKAppID，请在腾讯云视立方SDK控制台确认应用信息: https://console.cloud.tencent.com/vcube/project/manage
  ERR_SDKAPPID_NOT_FOUND = -1000,

  // 调用 API 时，传入的参数不合法，检查入参是否合法
  ERR_INVALID_PARAMETER = -1001,

  // 未登录,请调用Login接口
  ERR_SDK_NOT_INITIALIZED = -1002,

  // 获取权限失败，当前未授权音/视频权限，请查看是否开启设备权限。Room场景下请使用以下错误码来处理:
  // 摄像头没有系统授权: ERR_CAMERA_NOT_AUTHORIZED
  // 麦克风没有系统授权: ERR_MICROPHONE_NOT_AUTHORIZED
  ERR_PERMISSION_DENIED = -1003,

  // 该功能需要开通额外的套餐，请在腾讯云视立方SDK按需开通对应套餐: https://console.cloud.tencent.com/vcube/project/manage
  ERR_REQUIRE_PAYMENT = -1004,

  // 系统问题，打开摄像头失败。检查摄像头设备是否正常
  ERR_CAMERA_START_FAILED = -1100,

  // 摄像头没有系统授权, 检查系统授权
  ERR_CAMERA_NOT_AUTHORIZED = -1101,

  // 摄像头被占用，检查是否有其他进程使用摄像头
  ERR_CAMERA_OCCUPIED = -1102,

  // 当前无摄像头设备，请插入摄像头设备解决该问题
  ERR_CAMERA_DEVICE_EMPTY = -1103,

  // 系统问题，打开麦克风失败。检查麦克风设备是否正常
  ERR_MICROPHONE_START_FAILED = -1104,

  // 麦克风没有系统授权，检查系统授权
  ERR_MICROPHONE_NOT_AUTHORIZED = -1105,

  // 麦克风被占用
  ERR_MICROPHONE_OCCUPIED = -1106,

  // 当前无麦克风设备
  ERR_MICROPHONE_DEVICE_EMPTY = -1107,

  // 获取屏幕分享源（屏幕和窗口）失败，检查屏幕录制权限
  ERR_GET_SCREEN_SHARING_TARGET_FAILED = -1108,

  // 开启屏幕分享失败，检查房间内是否有人正在屏幕分享
  ERR_START_SCREEN_SHARING_FAILED = -1109,

  // 用户已经是房间所有者（房主）
  ERR_ALREADY_ROOM_OWNER = -1200,

  // IM属性写入冲突（多个客户端同时修改同一属性）
  ERR_IM_ATTRIBUTE_WRITE_CONFLICT = -1201,

  // 用户已经进入房间，重复进入房间操作
  ERR_ALREADY_ROOM_ENTER = -1202,

  // 没有权限销毁房间（仅房主可以销毁房间）
  ERR_DESTROY_ROOM_NO_PERMISSION = -1203,

  // LIVE直播请求服务器超时（网络问题或服务器响应慢）
  ERR_LIVE_REQUEST_SERVER_TIMEOUT = -1300,

  // LIVE直播服务器处理请求失败（服务器内部错误）
  ERR_LIVE_SERVER_PROCESS_FAILED = -1301,

  // LIVE直播连接断开（网络中断或服务异常）
  ERR_LIVE_DISCONNECTED = -1302,

  // LIVE没有可用的HEVC/H.265解码器（设备不支持该编码格式）
  ERR_LIVE_NO_AVAILABLE_HEVC_DECODERS = -1303,

  // 需要进房后才可使用此功能
  ERR_OPERATION_INVALID_BEFORE_ENTER_ROOM = -2101,

  // 房主不支持退房操作，Conference(会议)房间类型: 可以先转让房主，再退房。LivingRoom(直播)房间类型: 房主只能解散房间
  ERR_EXIT_NOT_SUPPORTED_FOR_ROOM_OWNER = -2102,

  // 当前房间类型下不支持该操作
  ERR_OPERATION_NOT_SUPPORTED_IN_CURRENT_ROOM_TYPE = -2103,

  // 创建房间ID 非法，自定义 ID 必须为可打印 ASCII 字符（0x20-0x7e），最长48个字节
  ERR_ROOM_ID_INVALID = -2105,

  // 房间名称非法，名称最长30字节，字符编码必须是 UTF-8 ，如果包含中文
  ERR_ROOM_NAME_INVALID = -2107,

  // 当前用户已在别的房间内，需要先退房才能加入新的房间:
  // 单个roomEngine实例只支持用户进入一个房间，如果要进入不同的房间请先退房或者使用新的roomEngine实例。
  ERR_ALREADY_IN_OTHER_ROOM = -2108,

  // 用户不存在
  ERR_USER_NOT_EXIST = -2200,

  // 需要房主权限才能操作
  ERR_NEED_OWNER_PERMISSION = -2300,

  // 需要房主或者管理员权限才能操作
  ERR_NEED_ADMIN_PERMISSION = -2301,

  // 信令请求无权限，比如取消非自己发起的邀请。
  ERR_REQUEST_NO_PERMISSION = -2310,

  // 信令请求ID 无效或已经被处理过。
  ERR_REQUEST_ID_INVALID = -2311,

  // 信令请求重复
  ERR_REQUEST_ID_REPEAT = -2312,

  // 最大麦位超出套餐包数量限制
  ERR_MAX_SEAT_COUNT_LIMIT = -2340,

  // 麦位编号不存在
  ERR_SEAT_INDEX_NOT_EXIST = -2344,

  // 当前麦位音频被锁
  ERR_OPEN_MICROPHONE_NEED_SEAT_UNLOCK = -2360,

  // 需要向房主或管理员申请后打开麦克风
  ERR_OPEN_MICROPHONE_NEED_PERMISSION_FROM_ADMIN = -2361,

  // 当前麦位视频被锁, 需要由房主解锁麦位后，才能打开摄像头
  ERR_OPEN_CAMERA_NEED_SEAT_UNLOCK = -2370,

  // 需要向房主或管理员申请后打开摄像头
  ERR_OPEN_CAMERA_NEED_PERMISSION_FROM_ADMIN = -2371,

  // 当前麦位视频被锁, 需要由房主解锁麦位后，才能打开屏幕分享
  ERR_OPEN_SCREEN_SHARE_NEED_SEAT_UNLOCK = -2372,

  // 需要向房主或管理员申请后打开屏幕分享
  ERR_OPEN_SCREEN_SHARE_NEED_PERMISSION_FROM_ADMIN = -2373,

  // 当前房间已开启全员禁言
  ERR_SEND_MESSAGE_DISABLED_FOR_ALL = -2380,

  // 当前房间内，你已被已禁言
  ERR_SEND_MESSAGE_DISABLED_FOR_CURRENT = -2381,

  // 服务端错误码
  // 房间ID 已被使用，请选择别的房间ID
  ERR_ROOM_ID_OCCUPIED = 100003,

  // 进房时房间不存在，或许已被解散
  ERR_ROOM_ID_NOT_EXIST = 100004,

  // 用户不在当前房间内
  ERR_USER_NOT_ENTERED = 100005,

  // 当前房间需要密码才能进入
  ERR_NEED_PASSWORD = 100018,

  // 进房使用的密码与当前房间密码不一致
  ERR_WRONG_PASSWORD = 100019,

  // 房间人数已满
  ERR_ROOM_USER_FULL = 100008,

  // 请求出现冲突
  ERR_REQUEST_CONFLICT = 100102,

  // 当前麦位已经有人了
  ERR_SEAT_OCCUPIED = 100210,

  // 当前用户已经在麦位上
  ERR_ALREADY_IN_SEAT = 100203,

  // 当前麦位被锁
  ERR_SEAT_LOCKED = 100200,

  // 上麦人数已满
  ERR_ALL_SEAT_OCCUPIED = 100205,

  // 当前用户没有在麦上
  ERR_USER_NOT_IN_SEAT = 100206,
  ERR_SEAT_NOT_SUPPORT_LINK_MIC = 100211,
  ERR_ROOM_ALREADY_CONNECTED = 100401,
  ERR_ROOM_CONNECTED_IN_OTHER = 100403,
  ERR_MAX_CONNECTED_COUNT_LIMIT = 100404,
  ERR_BATTLE_IN_RUNNING = 100419,
  ERR_BATTLE_ID_NOT_EXIST = 100411,
  ERR_ROOM_BATTLEID_IN_OTHER = 100415,
  ERR_ROOM_METADATA_EXCEED_KEY_COUNT_LIMIT = 100500,
  ERR_ROOM_METADATA_EXCEED_VALUE_SIZE_LIMIT = 100501,
}

/**
 * 房间信息，用户可使用 roomEngine.fetchRoomInfo获取房间信息。
 * @typedef {object} TUIRoomInfo
 * @property {string} roomId 房间 ID
 * @property {string} roomName 房间名称，默认为 roomId
 * @property {TUIRoomType} roomType 房间类型，默认为 TUIRoomType.kConference
 * @property {boolean} isSeatEnabled 是否开启麦位控制，该属性 2.0.0 版本以后支持，默认为 false
 * @property {TUISeatMode} seatMode 上麦模式(开启麦位控制后生效)，该属性 2.0.0 版本以后支持，默认为 TUISeatMode.kFreeToTake
 * @property {string} password 房间密码，默认为空字符串，该属性 2.5.0 版本以后支持
 * @property {boolean} isMicrophoneDisableForAllUser 是否开启全员禁音（创建房间可选参数，默认值为 false）
 * @property {boolean} isScreenShareDisableForAllUser 是否开启禁止屏幕分享（创建房间可选参数，该属性自 v2.2.0 版本以后支持，默认值为 false）
 * @property {boolean} isCameraDisableForAllUser 是否开启全员禁画（创建房间可选参数， 默认值为 false）
 * @property {boolean} isMessageDisableForAllUser 是否允许所有用户发消息（创建房间可选参数，默认值为 false）
 * @property {number} maxSeatCount 最大麦位数量，默认为 6
 * @property {string} roomOwner  房间主持人ID，只读，v2.4.1 以上建议使用 ownerId
 * @property {string} ownerId  房间主持人ID，只读，该属性 2.4.1 版本以后支持
 * @property {string} ownerName  房间主持人昵称，只读，该属性 2.4.1 版本以后支持
 * @property {string} ownerAvatarUrl  房间主持人头像地址，只读，该属性 2.4.1 版本以后支持
 * @property {number} createTime 房间创建时间，只读，精确到秒
 * @property {number} roomMemberCount 房间成员数量，只读
 */
const TUIRoomInfo_HACK_JSDOC = null;
export type TUIRoomInfo = {
  roomId: string;
  roomName: string;
  roomType: TUIRoomType;
  isSeatEnabled: boolean;
  seatMode: TUISeatMode;
  password: string;
  isMicrophoneDisableForAllUser: boolean;
  isScreenShareDisableForAllUser: boolean;
  isCameraDisableForAllUser: boolean;
  isMessageDisableForAllUser: boolean;
  maxSeatCount: number;
  roomOwner: string;
  ownerId: string;
  ownerName: string;
  ownerAvatarUrl: string;
  createTime: number;
  roomMemberCount: number;
};

/**
 * 进房可选择参数。
 * @typedef {object} TUIEnterRoomOptions
 * @property {string} password 房间密码，默认为空，表示没有密码
 */
const TUIEnterRoomOptions_HACK_JSDOC = null;
export type TUIEnterRoomOptions = {
  password?: string;
};

/**
 * 当前登录用户信息，userId, userName, avatarUrl。
 * @typedef {object} TUILoginUserInfo
 * @property {string} userId 登录用户的 userId
 * @property {string} userName 登录用户的 userName
 * @property {string} avatarUrl 登录用户的头像
 * @deprecated 自 v2.2.0 版本废弃，请使用 getUserInfo 获取 roomCustomInfo
 * @property {object} customInfo 自定义资料信息
 */
const TUILoginUserInfo_HACK_JSDOC = null;
export type TUILoginUserInfo = {
  userId: string;
  userName: string;
  avatarUrl: string;
  customInfo: Record<string, any>;
};

/**
 * 锁定麦位的操作参数
 * @typedef {object} TUISeatLockParams
 * @property {boolean} lockSeat 锁定麦位
 * @property {boolean} lockVideo 锁定麦位视频
 * @property {boolean} lockAudio 锁定麦位音频
 */
const TUISeatLockParams_HACK_JSDOC = null;
export type TUISeatLockParams = {
  lockSeat: boolean;
  lockVideo: boolean;
  lockAudio: boolean;
};

/**
 * 用户角色，TUIRoomEngine 共提供三种用户角色，分别是主持人，管理员，普通用户。
 * @enum {Number}
 */
const TUIRole_HACK_JSDOC = {
  /** 主持人角色 */
  kRoomOwner: 0,
  /** 管理员角色 */
  kAdministrator: 1,
  /** 普通用户角色 */
  kGeneralUser: 2,
};
export enum TUIRole {
  kRoomOwner = 0,
  kAdministrator = 1,
  kGeneralUser = 2,
}

/**
 * 消息结构体
 * @typedef {object} TUIMessage
 * @property {string} messageId 消息 Id
 * @property {string} message 消息内容
 * @property {number} timestamp 时间戳信息, 精确到秒
 * @property {TUIRole} userId 用户 Id
 * @property {boolean} userName 用户名称
 * @property {boolean} avatarUrl 用户头像地址
 */
export type TUIMessage = {
  messageId: string;
  message: string;
  timestamp: number;
  userId: string;
  userName: string;
  avatarUrl: string;
};

/**
 * 视频分辨率
 * @enum {Number}
 */
const TUIVideoQuality_HACK_JSDOC = {
  /** 低清360p */
  kVideoQuality_360p: 1,
  /** 标清540p */
  kVideoQuality_540p: 2,
  /** 高清720p */
  kVideoQuality_720p: 3,
  /** 超清1080p */
  kVideoQuality_1080p: 4,
};
export enum TUIVideoQuality {
  kVideoQuality_360p = 1,
  kVideoQuality_540p = 2,
  kVideoQuality_720p = 3,
  kVideoQuality_1080p = 4,
}

/**
 * 音频分辨率
 * @enum {Number}
 */
const TUIAudioQuality_HACK_JSDOC = {
  /** 人声模式 */
  kAudioProfileSpeech: 0,
  /** 标准模式（默认模式） */
  kAudioProfileDefault: 1,
  /** 音乐模式 */
  kAudioProfileMusic: 2,
};
export enum TUIAudioQuality {
  kAudioProfileSpeech = 0,
  kAudioProfileDefault = 1,
  kAudioProfileMusic = 2,
}

/**
 * 视频流类型
 * @enum {Number}
 */
const TUIVideoStreamType_HACK_JSDOC = {
  /** 摄像头视频流 */
  kCameraStream: 0,
  /** 屏幕分享视频流 */
  kScreenStream: 1,
  /** 低清摄像头视频流 */
  kCameraStreamLow: 2,
};
export enum TUIVideoStreamType {
  kCameraStream = 0,
  kScreenStream = 1,
  kCameraStreamLow = 2,
}

/**
 * 网络状态
 * @enum {Number}
 */
const TUINetworkQuality_HACK_JSDOC = {
  /** 网络状况未知 */
  kQualityUnknown: 0,
  /** 网络状况极佳 */
  kQualityExcellent: 1,
  /** 网络状况较好 */
  kQualityGood: 2,
  /** 网络状况一般 */
  kQualityPoor: 3,
  /** 网络状况差 */
  kQualityBad: 4,
  /** 网络状况极差 */
  kQualityVeryBad: 5,
  /** 网络连接已断开 */
  kQualityDown: 6,
};
export enum TUINetworkQuality {
  kQualityUnknown = 0,
  kQualityExcellent = 1,
  kQualityGood = 2,
  kQualityPoor = 3,
  kQualityBad = 4,
  kQualityVeryBad = 5,
  kQualityDown = 6,
}

/**
 * 消息结构体
 * @typedef {object} TUINetwork
 * @property {string} userId 用户 Id
 * @property {TUINetworkQuality} quality 网络质量
 * @property {number} upLoss 上行丢包率，单位 (%) 该数值越小越好，目前仅本地用户有该信息
 * @property {TUIRole} downLoss 下行丢包率，单位 (%) 该数值越小越好，目前仅本地用户有该信息
 * @property {Number} delay 网络延迟，单位 ms，目前仅本地用户有该信息
 */
export type TUINetwork = {
  userId: string;
  quality: TUINetworkQuality;
  upLoss: number;
  downLoss: number;
  delay: number;
};

/**
 * 视频编码参数
 * @typedef {object} TUIVideoEncoderParams
 * @property {number} fps 帧率设置
 * @property {number} bitrate 目标编码码率设置
 * @property {TUIVideoQuality} quality 上行视频分辨率
 * @property {TUIVideoQuality} videoResolution 上行视频分辨率（自 v1.6.0 版本开始支持，v1.6.0 之前版本请使用 quality 参数）
 * @property {TUIResolutionMode} resolutionMode 横竖屏模式
 */
export type TUIVideoEncoderParams = {
  quality?: TUIVideoQuality;
  videoResolution: TUIVideoQuality;
  fps: number;
  bitrate: number;
  resolutionMode: TUIResolutionMode;
};

/**
 * 房间类型
 * @enum {Number}
 */
const TUIRoomType_HACK_JSDOC = {
  /** 会议类型房间，适用于会议，教育场景，该房间中可以开启自由发言，申请发言、麦控等不同模式，麦位没有编号。 */
  kConference: 1,
  /** Open类型房间，适用于直播场景，该房间可以开启自由发言，麦位控制模式，该房间中麦位是有编号的。 */
  kLive: 2,
};
export enum TUIRoomType {
  kConference = 1,
  kLive = 2,
}

/**
 * 上麦模式
 * @enum {Number}
 */
const TUISeatMode_HACK_JSDOC = {
  /** 自由上麦模式，台下观众可以自由上麦，无需申请 */
  kFreeToTake: 1,
  /** 申请上麦模式，台下观众上麦需要房主或者管理员同意后才能上麦 */
  kApplyToTake: 2,
};
export enum TUISeatMode {
  kFreeToTake = 1,
  kApplyToTake = 2,
}

/**
 * 设备类型
 * @enum {Number}
 */
const TUIMediaDevice_HACK_JSDOC = {
  /** 麦克风 */
  kMicrophone: 1,
  /** 摄像头 */
  kCamera: 2,
  /** 屏幕分享 */
  kScreen: 3,
};
export enum TUIMediaDevice {
  kMicrophone = 1,
  kCamera = 2,
  kScreen = 3,
}

/**
 * 屏幕分享类型
 * @enum {Number}
 */
const TUICaptureSourceType_HACK_JSDOC = {
  /** 该分享目标是某一个 Windows 或 Mac 窗口 */
  kWindow: 0,
  /** 该分享目标是整个 Windows 桌面或 Mac 桌面 */
  kScreen: 1,
};
export enum TUICaptureSourceType {
  kWindow = 0,
  kScreen = 1,
}

/**
 * 状态变更原因（用户音视频状态变更操作原因: 自己主动修改或者被房主/管理员修改）
 * @enum {Number}
 */
const TUIChangeReason_HACK_JSDOC = {
  /** 自己操作 */
  kChangedBySelf: 0,
  /** 房主或管理员操作 */
  kChangedByAdmin: 1,
};
export enum TUIChangeReason {
  kChangedBySelf = 0,
  kChangedByAdmin = 1,
}

/**
 * 用户被踢出房间原因
 * @enum {Number}
 */
const TUIKickedOutOfRoomReason_HACK_JSDOC = {
  /** 被主持人或管理员踢出 */
  kKickedByAdmin: 0,
  /** 相同 userId 用户进入同一房间被踢出 */
  kKickedByLoggedOnOtherDevice: 1,
  /** 被服务端踢出 */
  kKickedByServer: 2,
};
export enum TUIKickedOutOfRoomReason {
  // 被主持人或管理员踢出
  kKickedByAdmin = 0,
  // 相同 userId 用户进入同一房间被踢出
  kKickedByLoggedOnOtherDevice = 1,
  // 被服务端踢出
  kKickedByServer = 2,
}

/**
 * 房间类型
 * @enum {Number}
 */
const TUIRequestAction_HACK_JSDOC = {
  /** 无效操作 */
  kInvalidAction: 0,
  /** 请求远端打开摄像头 */
  kRequestToOpenRemoteCamera: 1,
  /** 请求远端打开麦克风 */
  kRequestToOpenRemoteMicrophone: 2,
  /** 请求远端夸房连麦，web 端暂不支持 */
  kRequestToConnectOtherRoom: 3,
  /** 请求上麦 */
  kRequestToTakeSeat: 4,
  /** 请求远端上麦 */
  kRequestRemoteUserOnSeat: 5,
  /** 向管理员请求打开本地摄像头 */
  kApplyToAdminToOpenLocalCamera: 6,
  /** 向管理员请求打开本地麦克风 */
  kApplyToAdminToOpenLocalMicrophone: 7,
  /** 向管理员请求打开屏幕分享 */
  kApplyToAdminToOpenLocalScreenShare: 8,
};
export enum TUIRequestAction {
  kInvalidAction = 0,
  kRequestToOpenRemoteCamera = 1,
  kRequestToOpenRemoteMicrophone = 2,
  kRequestToConnectOtherRoom = 3,
  kRequestToTakeSeat = 4,
  kRequestRemoteUserOnSeat = 5,
  kApplyToAdminToOpenLocalCamera = 6,
  kApplyToAdminToOpenLocalMicrophone = 7,
  kApplyToAdminToOpenLocalScreenShare = 8,
}

/**
 * 请求返回类型
 * @enum {Number}
 */
const TUIRequestCallbackType_HACK_JSDOC = {
  /** 请求被接受 */
  kRequestAccepted: 0,
  /** 请求被拒绝 */
  kRequestRejected: 1,
  /** 请求已取消 */
  kRequestCancelled: 2,
  /** 请求已超时 */
  kRequestTimeout: 3,
  /** 请求错误 */
  kRequestError: 4,
};
export enum TUIRequestCallbackType {
  kRequestAccepted = 0,
  kRequestRejected = 1,
  kRequestCancelled = 2,
  kRequestTimeout = 3,
  kRequestError = 4,
}

export enum TRTCRole {
  kAnchor,
  kAudience,
}

/**
 * 分辨率模式（横屏分辨率｜竖屏分辨率）
 * @enum {Number}
 */
const TUIResolutionMode_HACK_JSDOC = {
  /** 横屏模式 */
  kResolutionMode_Landscape: 0,
  /** 竖屏模式 */
  kResolutionMode_Portrait: 1,
};
export enum TUIResolutionMode {
  kResolutionMode_Landscape = 0,
  kResolutionMode_Portrait = 1,
}

/**
 * @since v2.3.0
 * 房间解散原因
 * @enum {Number}
 */
const TUIRoomDismissedReason_HACK_JSDOC = {
  // / 被房主解散。
  kByOwner: 1,
  // / 被服务器解散。
  kByServer: 2,
};
export enum TUIRoomDismissedReason {
  kByOwner = 1,
  kByServer = 2,
}

/**
 * 用户信息结构体
 * @typedef {object} TUIUserInfo
 * @property {string} userId 用户 Id
 * @property {string} userName 用户名称
 * @property {string} nameCard 房间内用户名称，自 v2.5.0 支持
 * @property {string} avatarUrl 用户头像地址
 * @property {TUIRole} userRole 用户角色
 * @property {boolean} hasAudioStream 是否有音频流
 * @property {boolean} hasVideoStream 是否有视频流
 * @property {boolean} hasScreenStream 是否有屏幕分享流
 * @property {boolean} isMessageDisabled 是否被禁止发送消息
 * @property {object} roomCustomInfo 用户房间自定义字段
 */
const TUIUserInfo_HACK_JSDOC = null;
export type TUIUserInfo = {
  userId: string;
  userName: string;
  nameCard: string;
  avatarUrl: string;
  userRole: TUIRole;
  hasAudioStream: boolean;
  hasVideoStream: boolean;
  hasScreenStream: boolean;
  isMessageDisabled: boolean;
  roomCustomInfo: Record<string, any>;
};

/**
 * 麦位信息结构体
 * @typedef {object} TUISeatInfo
 * @property {number} index 麦位序号
 * @property {string} userId 麦位对应的用户 Id
 * @property {string} userName 用户名称
 * @property {string} nameCard 房间内用户名称，自 v2.5.0 支持
 * @property {string} avatarUrl 用户头像地址
 * @property {boolean} locked 当前麦位是否被锁
 * @property {boolean} isVideoLocked 当前麦位是否禁止视频
 * @property {boolean} isAudioLocked 当前麦位是否禁止音频
 */
const TUISeatInfo_HACK_JSDOC = null;
export type TUISeatInfo = {
  index: number;
  userId: string;
  userName: string;
  nameCard: string;
  avatarUrl: string;
  locked: boolean;
  isVideoLocked: boolean;
  isAudioLocked: boolean;
};

/**
 * 请求结构体
 * @typedef {object} TUIRequest
 * @property {TUIRequestAction} requestAction 请求类型
 * @property {number} timestamp 请求发起时间
 * @property {string} requestId 请求 ID
 * @property {string} userId 发起请求的用户 ID
 * @property {string} userName 用户名称
 * @property {string} nameCard 房间内用户名称，自 v2.5.0 支持
 * @property {string} avatarUrl 用户头像地址
 * @property {string} content 其他内容
 */
const TUIRequest_HACK_JSDOC = null;
export type TUIRequest = {
  requestAction: TUIRequestAction;
  timestamp: number;
  requestId: string;
  userId: string;
  userName: string;
  nameCard: string;
  avatarUrl: string;
  content: string;
};

/**
 * 请求回调结构体
 * @typedef {object} TUIRequestCallback
 * @property {TUIRequestCallbackType} requestCallbackType 请求回调类型
 * @property {string} requestId 请求 ID
 * @property {string} userId 用户 Id
 * @property {number} code 请求响应码
 * @property {string} message 请求补充说明
 */
const TUIRequestCallback_HACK_JSDOC = null;
export type TUIRequestCallback = {
  requestCallbackType: TUIRequestCallbackType;
  requestId: string;
  userId: string;
  code: number;
  message: string;
};

/**
 * 媒体设备类型
 * @enum {Number}
 */
const TUIMediaDeviceType_HACK_JSDOC = {
  // 未定义的设备类型
  kMediaDeviceTypeUnknown: -1,
  // 麦克风类型设备
  kMediaDeviceTypeAudioInput: 0,
  // 扬声器类型设备
  kMediaDeviceTypeAudioOutput: 1,
  // 摄像头类型设备
  kMediaDeviceVideoCamera: 2,
};
export enum TUIMediaDeviceType {
  kMediaDeviceTypeUnknown = -1,
  kMediaDeviceTypeAudioInput = 0,
  kMediaDeviceTypeAudioOutput = 1,
  kMediaDeviceTypeVideoCamera = 2,
}

/**
 * 媒体设备操作
 * @enum {Number}
 */
const TUIMediaDeviceState_HACK_JSDOC = {
  // 新增设备
  kMediaDeviceStateAdd: 0,
  // 移除设备
  kMediaDeviceStateRemove: 1,
  // 设备已启用
  kMediaDeviceStateActive: 2,
};
export enum TUIMediaDeviceState {
  // 新增设备
  kMediaDeviceStateAdd = 0,
  // 移除设备
  kMediaDeviceStateRemove = 1,
  // 设备已启用
  kMediaDeviceStateActive = 2,
}

/**
 * 音频路由（即声音的播放模式）
 * @enum {Number}
 */
const TUIAudioRoute_HACK_JSDOC = {
  // Speakerphone：使用扬声器播放（即“免提”），扬声器位于手机底部，声音偏大，适合外放音乐。
  kAudioRouteSpeakerphone: 0,
  // Earpiece：使用听筒播放，听筒位于手机顶部，声音偏小，适合需要保护隐私的通话场景。
  kAudioRouteEarpiece: 1,
};
export enum TUIAudioRoute {
  // Speakerphone：使用扬声器播放（即“免提”），扬声器位于手机底部，声音偏大，适合外放音乐。
  kAudioRouteSpeakerphone = 0,
  // Earpiece：使用听筒播放，听筒位于手机顶部，声音偏小，适合需要保护隐私的通话场景。
  kAudioRouteEarpiece = 1,
}

/**
 * 请求回调结构体
 * @typedef {object} TUIDeviceInfo
 * @property {string} deviceId 设备 Id
 * @property {string} deviceName 设备名称
 * @property {object} deviceProperties 设备属性
 */
const TUIDeviceInfo_HACK_JSDOC = null;
export type TUIDeviceInfo = {
  deviceId: string;
  deviceName: string;
  deviceProperties?: {
    supportedResolution?: { width: number; height: number }[];
  };
};

/**
 * 会议状态
 * @enum {Number}
 */
const TUIConferenceStatus_HACK_JSDOC = {
  // / 未知状态。
  kConferenceStatusNone: 0,
  // / 会议未开始。
  kConferenceStatusNotStarted: 1,
  // / 会议进行中。
  kConferenceStatusRunning: 2,
};
export enum TUIConferenceStatus {
  // / 未知状态
  kConferenceStatusNone = 0,
  // / 会议未开始
  kConferenceStatusNotStarted = 1,
  // / 会议进行中
  kConferenceStatusRunning = 2,
}

/**
 * 会议取消原因
 * @enum {Number}
 */
const TUIConferenceCancelReason_HACK_JSDOC = {
  // / 房主取消
  kConferenceCancelReasonCancelledByAdmin: 0,
  // / 当前用户被移出参会人员列表
  kConferenceCancelReasonRemovedFromAttendees: 1,
};
export enum TUIConferenceCancelReason {
  // / 房主取消
  kConferenceCancelReasonCancelledByAdmin = 0,
  // / 当前用户被移出参会人员列表
  kConferenceCancelReasonRemovedFromAttendees = 1,
}

/**
 * 会议信息结构体
 * @typedef {object} TUIConferenceInfo
 * @property {number} scheduleStartTime 预定会议开始时间。
 * @property {number} scheduleEndTime 预定会议结束时间。
 * @property {string[]} scheduleAttendees 邀请参会成员列表。
 * @property {number} reminderSecondsBeforeStart 会议开始前提醒时间（秒）。
 * @property {TUIConferenceStatus} status 房间状态（只读）。
 * @property {TUIRoomInfo} basicRoomInfo 房间信息。
 */
const TUIConferenceInfo_HACK_JSDOC = null;
export type TUIConferenceInfo = {
  // / 预定会议开始时间。
  scheduleStartTime: number;
  // / 预定会议结束时间。
  scheduleEndTime: number;
  // / 邀请参会成员列表。
  scheduleAttendees: string[];
  // / 会议开始前提醒时间（秒）。
  reminderSecondsBeforeStart: number;
  // / 房间状态（只读）。
  status: TUIConferenceStatus;
  // / 房间信息。
  basicRoomInfo: TUIRoomInfo;
};

/**
 * 会议信息发生修改结构体
 *
 * @typedef {object} TUIConferenceModifyInfo
 * @property {number} scheduleStartTime 预定会议开始时间。
 * @property {number} scheduleEndTime 预定会议结束时间。
 * @property {object} basicRoomInfo 房间信息。
 * @property {string} basicRoomInfo.roomId 房间 ID。
 * @property {string} basicRoomInfo.roomName 房间名称。
 */
const TUIConferenceModifyInfo_HACK_JSDOC = null;
export type TUIConferenceModifyInfo = {
  // / 预定会议开始时间。
  scheduleStartTime?: number;
  // / 预定会议结束时间。
  scheduleEndTime?: number;
  // / 房间信息。
  basicRoomInfo: {
    roomId: string;
    roomName?: string;
  };
};

/**
 * 会中邀请状态
 * @enum {Number}
 *
 */
const TUIInvitationStatus_HACK_JSDOC = {
  // / 未知状态。
  kNone: 0,
  // / 呼叫状态。
  kPending: 1,
  // / 超时状态
  kTimeout: 2,
  // /接受状态
  kAccepted: 3,
  // /拒绝状态
  kRejected: 4,
};
export enum TUIInvitationStatus {
  // /未知状态
  kNone = 0,
  // /呼叫状态
  kPending = 1,
  // /超时状态
  kTimeout = 2,
  // /接受状态
  kAccepted = 3,
  // /拒绝状态
  kRejected = 4,
}

/**
 * 会中邀请结果状态
 * @enum {Number}
 */
const TUIInvitationCode_HACK_JSDOC = {
  // /呼叫成功
  kSuccess: 0,
  // /已经在呼叫列表
  kAlreadyInInvitationList: 1,
  // /已经在会议中
  kAlreadyInConference: 2,
};
export enum TUIInvitationCode {
  // /呼叫成功
  kSuccess = 0,
  // /已经在呼叫列表
  kAlreadyInInvitationList = 1,
  // /已经在会议中
  kAlreadyInConference = 2,
}

/**
 * 会中邀请拒绝原因
 * @enum {Number}
 */

const TUIInvitationRejectedReason_HACK_JSDOC = {
  // /拒绝加入会议
  kRejectToEnter: 0,
  // /在其他会议中
  kInOtherConference: 1,
};

export enum TUIInvitationRejectedReason {
  // /拒绝加入会议
  kRejectToEnter = 0,
  // /在其他会议中
  kInOtherConference = 1,
}

/**
 * 会中邀请信息结构体
 *
 * @typedef {object} TUIInvitation
 * @property {TUIInvitationStatus} status 会中邀请状态
 * @property {TUIUserInfo} invitee 受邀者
 * @property {TUIUserInfo} inviter 邀请者
 */
const TUIInvitation_HACK_JSDOC = null;
export type TUIInvitation = {
  status: TUIInvitationStatus;
  invitee: TUIUserInfo;
  inviter: TUIUserInfo;
};

/**
 * **TUIRoomEngine 事件列表**<br>
 * @namespace TUIRoomEvents
 * @example
 * import TUIRoomEngine, { TUIRoomEvents } from '@tencentcloud/tuiroom-engine-js';
 * const roomEngine = new TUIRoomEngine();
 * roomEngine.on(TUIRoomEvents.onError, (error) => {
 *  console.log('roomEngine.error', error);
 * })
 */
export enum TUIRoomEvents {
  /**
   *
   * @description 错误事件
   * @event TUIRoomEvents#onError
   * @param {object} options
   * @param {number} options.code 错误代码
   * @param {string} options.message 错误信息
   * @example
   * const roomEngine = new TUIRoomEngine();
   * roomEngine.on(TUIRoomEvents.onError, (error) => {
   *  console.log('TUIRoomError error', error);
   * })
   */
  onError = 'onError',

  /**
   * @description 踢出房间事件
   * @default 'onKickedOutOfRoom'
   * @event TUIRoomEvents#onKickedOutOfRoom
   * @param {object} options
   * @param {string} options.roomId 房间号
   * @param {TUIKickedOutOfRoomReason} options.reason 用户被踢出房间枚举
   * @param {string} options.message 踢出房间信息
   * @example
   * const roomEngine = new TUIRoomEngine();
   * roomEngine.on(TUIRoomEvents.onKickedOutOfRoom, ({ roomId, reason, message }) => {
   *   console.log('roomEngine.onKickedOutOfRoom', roomId, reason, message);
   * });
   */
  onKickedOutOfRoom = 'onKickedOutOfRoom',

  /**
   * @description 当前用户被踢下线
   * @default 'onKickedOffLine'
   * @event TUIRoomEvents#onKickedOffLine
   * @param {string} options.message 用户被踢下线信息
   * @example
   * const roomEngine = new TUIRoomEngine();
   * roomEngine.on(TUIRoomEvents.onKickedOffLine, ({ message }) => {
   *   console.log('roomEngine.onKickedOffLine', message);
   * });
   */
  onKickedOffLine = 'onKickedOffLine',

  /**
   * @description userSig 过期事件
   * @default 'onUserSigExpired'
   * @event TUIRoomEvents#onUserSigExpired
   * @example
   * const roomEngine = new TUIRoomEngine();
   * roomEngine.on(TUIRoomEvents.onUserSigExpired, () => {
   *   console.log('roomEngine.onUserSigExpired');
   * });
   */
  onUserSigExpired = 'onUserSigExpired',

  /**
   * @description 主持人销毁房间事件
   * @default 'onRoomDismissed'
   * @event TUIRoomEvents#onRoomDismissed
   * @param {object} options
   * @param {string} options.roomId 房间号
   * @param {TUIRoomDismissedReason} options.reason 房间解散原因枚举，该字段自 v2.3.0 开始支持
   * @example
   * const roomEngine = new TUIRoomEngine();
   * roomEngine.on(TUIRoomEvents.onRoomDismissed, ({ roomId,reason }) => {
   *   console.log('roomEngine.onRoomDismissed', roomId,reason);
   * });
   */
  onRoomDismissed = 'onRoomDismissed',

  /**
   * @description 房间名字修改事件
   * @default 'onRoomNameChanged'
   * @event TUIRoomEvents#onRoomChanged
   * @param {object} options
   * @param {string} options.roomName 房间名字
   * @example
   * const roomEngine = new TUIRoomEngine();
   * roomEngine.on(TUIRoomEvents.onRoomNameChanged, ({ roomId, roomName }) =>{
   *    console.log('roomEngine.onRoomNameChanged', roomId, roomName);
   * });
   */
  onRoomNameChanged = 'onRoomNameChanged',

  /**
   * @description 上麦模式修改事件
   * @default 'onRoomSeatModeChanged'
   * @event TUIRoomEvents#onRoomSeatModeChanged
   * @param {object} options
   * @param {TUISeatMode} options.seatMode 房间上麦模式
   * @example
   * const roomEngine = new TUIRoomEngine();
   * roomEngine.on(TUIRoomEvents.onRoomSeatModeChanged, ({ roomId, seatMode }) =>{
   *    console.log('roomEngine.onRoomSeatModeChanged', roomId, seatMode);
   * });
   */
  onRoomSeatModeChanged = 'onRoomSeatModeChanged',

  /**
   * @description 房间内人数变化事件
   * @default 'onRoomUserCountChanged'
   * @event TUIRoomEvents#onRoomUserCountChanged
   * @param {object} options
   * @param {string} options.roomId 房间号
   * @param {number} options.userCount 房间内人数
   * @example
   * const roomEngine = new TUIRoomEngine();
   * roomEngine.on(TUIRoomEvents.onRoomUserCountChanged, ({ roomId, userCount }) =>{
   *    console.log('roomEngine.onRoomUserCountChanged', roomId, userCount);
   * });
   */
  onRoomUserCountChanged = 'onRoomUserCountChanged',

  /**
   * @description 所有成员摄像头使用权限改变事件
   * @default 'onAllUserCameraDisableChanged'
   * @event TUIRoomEvents#onAllUserCameraDisableChanged
   * @param {object} options
   * @param {boolean} options.isDisable 是否允许使用摄像头
   * @example
   * const roomEngine = new TUIRoomEngine();
   * roomEngine.on(TUIRoomEvents.onAllUserCameraDisableChanged, ({ isDisable }) =>{
   *    console.log('roomEngine.onAllUserCameraDisableChanged', isDisable);
   * });
   */
  onAllUserCameraDisableChanged = 'onAllUserCameraDisableChanged',

  /**
   * @since v2.2.0
   * @description 房间内所有用户屏幕分享被禁用事件
   * @default 'onScreenShareForAllUserDisableChanged'
   * @event TUIRoomEvents#onScreenShareForAllUserDisableChanged
   * @param {object} options
   * @param {boolean} options.isDisable 是否开启禁止屏幕分享
   * @example
   * const roomEngine = new TUIRoomEngine();
   * roomEngine.on(TUIRoomEvents.onScreenShareForAllUserDisableChanged, ({ isDisable }) =>{
   *    console.log('roomEngine.onScreenShareForAllUserDisableChanged', isDisable);
   * });
   */
  onScreenShareForAllUserDisableChanged = 'onScreenShareForAllUserDisableChanged',

  /**
   * @description 所有成员麦克风使用权限改变事件
   * @default 'onAllUserMicrophoneDisableChanged'
   * @event TUIRoomEvents#onAllUserMicrophoneDisableChanged
   * @param {object} options
   * @param {boolean} options.isDisable 是否允许使用麦克风
   * @example
   * const roomEngine = new TUIRoomEngine();
   * roomEngine.on(TUIRoomEvents.onAllUserMicrophoneDisableChanged, ({ isDisable }) =>{
   *    console.log('roomEngine.onAllUserMicrophoneDisableChanged', isDisable);
   * });
   */
  onAllUserMicrophoneDisableChanged = 'onAllUserMicrophoneDisableChanged',

  /**
   * @description 所有成员发送消息权限改变事件
   * @default 'onSendMessageForAllUserDisableChanged'
   * @event TUIRoomEvents#OnSendMessageForAllUserDisableChanged
   * @param {object} options
   * @param {boolean} options.isDisable 是否被允许
   * @example
   * const roomEngine = new TUIRoomEngine();
   * roomEngine.on(TUIRoomEvents.onSendMessageForAllUserDisableChanged, ({ isDisable }) =>{
   *    console.log('roomEngine.onSendMessageForAllUserDisableChanged', isDisable);
   * });
   */
  onSendMessageForAllUserDisableChanged = 'onSendMessageForAllUserDisableChanged',

  /**
   * @description 房间最大麦位数修改事件
   * @default 'onRoomMaxSeatCountChanged'
   * @event TUIRoomEvents#onRoomMaxSeatCountChanged
   * @param {object} options
   * @param {boolean} options.maxSeatNumber 最大麦位数
   * @example
   * const roomEngine = new TUIRoomEngine();
   * roomEngine.on(TUIRoomEvents.onRoomMaxSeatCountChanged, ({ maxSeatNumber }) =>{
   *    console.log('roomEngine.onRoomMaxSeatCountChanged', maxSeatNumber);
   * });
   */
  onRoomMaxSeatCountChanged = 'onRoomMaxSeatCountChanged',
  /**
   * @description 远端用户进入房间事件
   * @default 'onRemoteUserEnterRoom'
   * @event TUIRoomEvents#onRemoteUserEnterRoom
   * @param {object} options
   * @param {string} options.roomId 房间号
   * @param {TUIUserInfo} options.userInfo 用户信息
   * @example
   * const roomEngine = new TUIRoomEngine();
   * roomEngine.on(TUIRoomEvents.onRemoteUserEnterRoom, ({ roomId, userInfo }) => {
   *   console.log('roomEngine.onRemoteUserEnterRoom', roomId, userInfo);
   * });
   */
  onRemoteUserEnterRoom = 'onRemoteUserEnterRoom',

  /**
   * @description 远端用户离开房间事件
   * @default 'onRemoteUserLeaveRoom'
   * @event TUIRoomEvents#onRemoteUserLeaveRoom
   * @param {object} options
   * @param {string} options.roomId 房间号
   * @param {TUIUserInfo} options.userInfo 用户信息
   * @example
   * const roomEngine = new TUIRoomEngine();
   * roomEngine.on(TUIRoomEvents.onRemoteUserLeaveRoom, ({ roomId, userInfo }) => {
   *   console.log('roomEngine.onRemoteUserLeaveRoom', roomId, userInfo);
   * });
   */
  onRemoteUserLeaveRoom = 'onRemoteUserLeaveRoom',

  /**
   * @since v2.5.0
   * @description 房间内用户信息改变事件
   * @default 'onUserInfoChanged'
   * @event TUIRoomEvents#onUserInfoChanged
   * @param {object} options
   * @param {TUIUserInfo} options.userInfo 用户信息
   * @example
   * const roomEngine = new TUIRoomEngine();
   * roomEngine.on(TUIRoomEvents.onUserInfoChanged, ({ userInfo }) => {
   *   console.log('roomEngine.onUserInfoChanged', userInfo);
   * });
   */
  onUserInfoChanged = 'onUserInfoChanged',

  /**
   * @description 用户角色改变事件
   * @deprecated 该接口自 v2.5.0 版本废弃，请使用'onUserInfoChanged'.
   * @default 'onUserRoleChanged'
   * @event TUIRoomEvents#onUserRoleChanged
   * @param {object} options
   * @param {string} options.userId 用户Id
   * @param {TUIRole} options.userRole 用户变更后的角色
   * @param {TUIUserInfo} options.userInfo 用户信息,该字段自 v2.3.0 开始支持
   * @example
   * const roomEngine = new TUIRoomEngine();
   * roomEngine.on(TUIRoomEvents.onUserRoleChanged, ({ userInfo }) => {
   *   console.log('roomEngine.onUserRoleChanged', userInfo);
   * });
   */
  onUserRoleChanged = 'onUserRoleChanged',

  /**
   * @description 用户视频状态改变事件
   * @default 'onUserVideoStateChanged'
   * @event TUIRoomEvents#onUserVideoStateChanged
   * @param {object} options
   * @param {string} options.userId 用户Id
   * @param {TUIVideoStreamType} options.streamType 用户流类型
   * @param {boolean} options.hasVideo 是否有视频流
   * @param {TUIChangeReason} options.reason 变更原因
   * @example
   * const roomEngine = new TUIRoomEngine();
   * roomEngine.on(TUIRoomEvents.onUserVideoStateChanged, ({ userId, streamType, hasVideo, reason }) => {
   *   console.log('roomEngine.onUserVideoStateChanged', userId, streamType, hasVideo, reason);
   * });
   */
  onUserVideoStateChanged = 'onUserVideoStateChanged',

  /**
   * @description 用户音频状态改变事件
   * @default 'onUserAudioStateChanged'
   * @event TUIRoomEvents#onUserAudioStateChanged
   * @param {object} options
   * @param {string} options.userId 用户Id
   * @param {boolean} options.hasVideo 是否有音频流
   * @param {TUIChangeReason} options.reason 原因
   * @example
   * const roomEngine = new TUIRoomEngine();
   * roomEngine.on(TUIRoomEvents.onUserAudioStateChanged, ({ userId, hasAudio, reason }) => {
   *   console.log('roomEngine.onUserAudioStateChanged', userId, hasAudio, reason);
   * });
   */
  onUserAudioStateChanged = 'onUserAudioStateChanged',

  /**
   * @description 用户发送消息状态改变事件
   * @default 'onSendMessageForUserDisableChanged'
   * @event TUIRoomEvents#onSendMessageForUserDisableChanged
   * @param {object} options
   * @param {string} options.userId 成员 Id
   * @param {boolean} options.isDisable 是否被允许
   * @example
   * const roomEngine = new TUIRoomEngine();
   * roomEngine.on(TUIRoomEvents.onSendMessageForUserDisableChanged, ({ userId, isDisable }) =>{
   *    console.log('roomEngine.onSendMessageForUserDisableChanged', isDisable);
   * });
   */
  onSendMessageForUserDisableChanged = 'onSendMessageForUserDisableChanged',

  /**
   * @description 用户音量改变事件
   * @default 'onUserVoiceVolumeChanged'
   * @event TUIRoomEvents#onUserVoiceVolumeChanged
   * @param {object} options
   * @param {Array<TRTCVolumeInfo>} options.userVolumeList 房间内所有用户的音量, 包含 userId 及 volume 信息，volume 区间为 1～100;
   * @example
   * const roomEngine = new TUIRoomEngine();
   * roomEngine.on(TUIRoomEvents.onUserVoiceVolumeChanged, ({ userVolumeList }) => {
   *   userVolumeList.forEach(userVolume => {
   *     console.log('roomEngine.onUserVoiceVolumeChanged', userVolume.userId, userVolume.volume);
   *   })
   * });
   */
  onUserVoiceVolumeChanged = 'onUserVoiceVolumeChanged',

  /**
   * @description 用户网络质量改变事件
   * @default 'onUserNetworkQualityChanged'
   * @event TUIRoomEvents#onUserNetworkQualityChanged
   * @param {object} options
   * @param {TUINetwork} options.userNetworkList 网络质量信息
   * @example
   * const roomEngine = new TUIRoomEngine();
   * roomEngine.on(TUIRoomEvents.onUserNetworkQualityChanged, ({ userNetworkList }) => {
   *   userNetworkList.forEach(userNetwork => {
   *     console.log('roomEngine.onUserNetworkQualityChanged',
   *        userNetwork.userId, userNetwork.quality, userNetwork.upLoss, userNetwork.downLoss, userNetwork.delay);
   *   })
   * });
   */
  onUserNetworkQualityChanged = 'onUserNetworkQualityChanged',

  /**
   * @description 麦位列表改变事件
   * @default 'onSeatListChanged'
   * @event TUIRoomEvents#onSeatListChanged
   * @param {object} options
   * @param {Array<TUISeatInfo>} options.seatList 麦位列表
   * @param {Array<TUISeatInfo>} options.seatedList 新增麦位列表
   * @param {Array<TUISeatInfo>} options.leftList 离开的麦位列表
   * @example
   * const roomEngine = new TUIRoomEngine();
   * roomEngine.on(TUIRoomEvents.onSeatListChanged, ({ seatList, seatedList, leftList }) => {
   *   console.log('roomEngine.onSeatListChanged',seatList, seatedList, leftList);
   * });
   */
  onSeatListChanged = 'onSeatListChanged',

  /**
   * @description 当前用户被踢下麦事件
   * @default 'onKickedOffSeat'
   * @event TUIRoomEvents#onKickedOffSeat
   * @param {number} options.seatIndex 麦位编号，该字段自 v2.3.0 开始支持
   * @param {TUIUserInfo} options.userInfo 操作踢人的（主持人/管理员）用户信息，该字段自 v2.3.0 开始支持
   * @example
   * const roomEngine = new TUIRoomEngine();
   * roomEngine.on(TUIRoomEvents.onKickedOffSeat, ({ seatIndex, userInfo }) => {
   *   console.log('roomEngine.onKickedOffSeat', seatIndex, userInfo);
   * });
   */
  onKickedOffSeat = 'onKickedOffSeat',

  /**
   * @description 请求接收事件
   * @default 'onRequestReceived'
   * @event TUIRoomEvents#onRequestReceived
   * @param {object} options
   * @param {TUIRequest} options.request 请求接收
   * @example
   * const roomEngine = new TUIRoomEngine();
   * roomEngine.on(TUIRoomEvents.onRequestReceived, ({ request }) => {
   *   console.log('roomEngine.onRequestReceived', request);
   * });
   */
  onRequestReceived = 'onRequestReceived',

  /**
   * @description 请求取消事件
   * @default 'onRequestCancelled'
   * @event TUIRoomEvents#onRequestCancelled
   * @param {object} options
   * @param {string} options.requestId 请求Id
   * @param {string} options.userId 取消请求的用户Id
   * @param {TUIRequest} options.request 请求信息，该字段自 v2.3.0 开始支持
   * @param {TUIUserInfo} options.userInfo 处理该请求的 管理员/房主 的用户信息，该字段自 v2.3.0 开始支持
   * @example
   * const roomEngine = new TUIRoomEngine();
   * roomEngine.on(TUIRoomEvents.onRequestCancelled, ({ request, userInfo }) => {
   *   console.log('roomEngine.onRequestCancelled', request, userInfo);
   * });
   */
  onRequestCancelled = 'onRequestCancelled',

  /**
   * @description 请求被其他 管理员/房主 处理事件
   * @default 'onRequestProcessed'
   * @event TUIRoomEvents#onRequestProcessed
   * @param {object} options
   * @param {string} options.requestId 请求Id
   * @param {string} options.userId 处理该请求的 管理员/房主 的用户ID
   * @param {TUIRequest} options.request 请求信息，该字段自 v2.3.0 开始支持
   * @param {TUIUserInfo} options.userInfo 处理该请求的 管理员/房主 的用户信息，该字段自 v2.3.0 开始支持
   * @example
   * const roomEngine = new TUIRoomEngine();
   * roomEngine.on(TUIRoomEvents.onRequestProcessed, ({ request, userInfo }) => {
   *   console.log('roomEngine.onRequestProcessed', request, userInfo);
   * });
   */
  onRequestProcessed = 'onRequestProcessed',

  /**
   * @description 接收文本消息事件
   * @deprecated 该接口自 v2.0.0 版本废弃，请使用 tim 实例监听收消息事件
   * @default 'onReceiveTextMessage'
   * @event TUIRoomEvents#onReceiveTextMessage
   * @param {object} options
   * @param {string} options.roomId 房间Id
   * @param {TUIMessage} options.message 接收的文本消息
   * @example
   * const roomEngine = new TUIRoomEngine();
   * roomEngine.on(TUIRoomEvents.onReceiveTextMessage, ({ roomId, message }) => {
   *   console.log('roomEngine.onReceiveTextMessage', roomId, message);
   * });
   */
  onReceiveTextMessage = 'onReceiveTextMessage',

  /**
   * @description 接收自定义消息事件
   * @deprecated 该接口自 v2.0.0 版本废弃，请使用 tim 实例监听收消息事件
   * @default 'onReceiveCustomMessage'
   * @event TUIRoomEvents#onReceiveCustomMessage
   * @param {object} options
   * @param {string} options.roomId 房间Id
   * @param {TUIMessage} options.message 接收的自定义消息
   * @example
   * const roomEngine = new TUIRoomEngine();
   * roomEngine.on(TUIRoomEvents.onReceiveCustomMessage, ({ roomId, message }) => {
   *   console.log('roomEngine.onReceiveCustomMessage', roomId, message);
   * });
   */
  onReceiveCustomMessage = 'onReceiveCustomMessage',

  /**
   * @description 设备变更事件
   * @default 'onDeviceChange'
   * @event TUIRoomEvents#onDeviceChange
   * @param {object} options
   * @param {string} options.deviceId 设备 Id
   * @param {TRTCDeviceType} options.type 设备类型
   * @param {TRTCDeviceState} options.state 设备变更状态
   * @example
   * const roomEngine = new TUIRoomEngine();
   * roomEngine.on(TUIRoomEvents.onDeviceChange, ({ deviceId, type, state }) => {
   *   console.log('roomEngine.onDeviceChange', deviceId, type, state);
   * });
   */
  onDeviceChange = 'onDeviceChange',

  /**
   * @description 屏幕分享停止事件，当用户使用浏览器自带的【停止分享】按钮结束屏幕共享时，该用户会收到 'onUserScreenCaptureStopped' 事件用来修改屏幕共享状态。
   * @default 'onUserScreenCaptureStopped'
   * @event TUIRoomEvents#onUserScreenCaptureStopped
   * @example
   * const roomEngine = new TUIRoomEngine();
   * roomEngine.on(TUIRoomEvents.onUserScreenCaptureStopped, () => {
   *   console.log('roomEngine.onUserScreenCaptureStopped');
   * });
   */
  onUserScreenCaptureStopped = 'onUserScreenCaptureStopped',
}

/**
 * @since v2.5.0
 * **TUIConferenceListManager 事件列表**<br>
 * @namespace TUIConferenceListManagerEvents
 */
export enum TUIConferenceListManagerEvents {
  /**
   * @description 会议预定回调
   * @default 'onConferenceScheduled'
   * @event TUIConferenceListManagerEvents#onConferenceScheduled
   * @param {object} options
   * @param {string} options.conferenceInfo 会议信息。
   *
   * @example
   * const roomEngine = new TUIRoomEngine();
   * const conferenceListManager = roomEngine.getConferenceListManager();
   * conferenceListManager.on(TUIConferenceListManagerEvents.onConferenceScheduled, ({ conferenceInfo }) => {
   *  console.log('conferenceListManager.onConferenceScheduled', conferenceInfo);
   * })
   */
  onConferenceScheduled = 'onConferenceScheduled',

  /**
   * @description 会议即将开始回调
   * @default 'onConferenceWillStart'
   * @event TUIConferenceListManagerEvents#onConferenceWillStart
   * @param {object} options
   * @param {string} options.conferenceInfo 会议信息。
   *
   * @example
   * const roomEngine = new TUIRoomEngine();
   * const conferenceListManager = roomEngine.getConferenceListManager();
   * conferenceListManager.on(TUIConferenceListManagerEvents.onConferenceWillStart, ({ conferenceInfo }) => {
   *  console.log('conferenceListManager.onConferenceWillStart', conferenceInfo);
   * })
   */
  onConferenceWillStart = 'onConferenceWillStart',

  /**
   * @description 会议取消回调
   *
   * @param {object} options
   * @param {string} options.roomId 会议Id，即房间 roomId 。
   * @param {TUIConferenceCancelReason} options.reason 会议取消原因。
   * @param {TUIUserInfo} options.operateUser 取消会议操作者信息。
   *
   * @example
   * const roomEngine = new TUIRoomEngine();
   * const conferenceListManager = roomEngine.getConferenceListManager();
   * conferenceListManager.on(TUIConferenceListManagerEvents.onConferenceCancelled, ({ roomId, reason, operateUser }) => {
   *  console.log('conferenceListManager.onConferenceCancelled', roomId, reason, operateUser);
   * })
   */
  onConferenceCancelled = 'onConferenceCancelled',

  /**
   * @description 会议信息变更回调
   *
   * @param {object} options
   * @param {TUIConferenceModifyInfo} options.conferenceModifyInfo 会议信息。
   *
   * @example
   * const roomEngine = new TUIRoomEngine();
   * const conferenceListManager = roomEngine.getConferenceListManager();
   * conferenceListManager.on(TUIConferenceListManagerEvents.onConferenceInfoChanged, ({ conferenceModifyInfo }) => {
   *  console.log('conferenceListManager.onConferenceInfoChanged', conferenceModifyInfo);
   * })
   */
  onConferenceInfoChanged = 'onConferenceInfoChanged',

  /**
   * @description 参会人员变更回调
   *
   * @param {object} options
   * @param {string} options.roomId 会议Id，即房间roomId。
   * @param {Array<TUIUserInfo>} options.leftUsers 离开成员列表。
   * @param {Array<TUIUserInfo>} options.joinedUsers 新加入成员列表。
   *
   * @example
   * const roomEngine = new TUIRoomEngine();
   * const conferenceListManager = roomEngine.getConferenceListManager();
   * conferenceListManager.on(TUIConferenceListManagerEvents.onScheduleAttendeesChanged, ({ roomId, leftUsers, joinedUsers }) => {
   *  console.log('conferenceListManager.onScheduleAttendeesChanged', roomId, leftUsers, joinedUsers);
   * })
   */
  onScheduleAttendeesChanged = 'onScheduleAttendeesChanged',

  /**
   * @description 会议状态变更回调
   *
   * @param {object} options
   * @param {string} options.roomId 会议Id，即房间roomId。
   * @param {TUIConferenceStatus} options.status 会议状态。
   *
   * @example
   * const roomEngine = new TUIRoomEngine();
   * const conferenceListManager = roomEngine.getConferenceListManager();
   * conferenceListManager.on(TUIConferenceListManagerEvents.onConferenceStatusChanged, ({ roomId, status }) => {
   *  console.log('conferenceListManager.onConferenceStatusChanged', roomId, status );
   * })
   */
  onConferenceStatusChanged = 'onConferenceStatusChanged',
}

/**
 * @since v2.6.0
 * **TUIConferenceInvitationManager 事件列表**<br>
 * @namespace TUIConferenceInvitationManagerEvents
 */
export enum TUIConferenceInvitationManagerEvents {
  /**
   * @description 收到会中邀请回调
   * @default 'onReceiveInvitation'
   * @event TUIConferenceInvitationManagerEvents#onReceiveInvitation
   * @param {object} options
   * @param {TUIRoomInfo} options.roomInfo 会议信息。
   * @param {TUIInvitation} options.invitation 邀请信息。
   * @param {string} options.extensionInfo 自定义扩展信息
   *
   *
   * @example
   * const roomEngine = new TUIRoomEngine();
   * const conferenceInvitationManager = roomEngine.getConferenceInvitationManager();
   * conferenceInvitationManager.on(TUIConferenceInvitationManagerEvents.onReceiveInvitation, ({ roomInfo, invitation, extensionInfo }) => {
   *  console.log('conferenceInvitationManager.onReceiveInvitation', roomInfo, invitation, extensionInfo);
   * })
   */
  onReceiveInvitation = 'onReceiveInvitation',

  /**
   * @description 邀请在其他设备处理的回调
   * @default 'onInvitationHandledByOtherDevice'
   * @event TUIConferenceInvitationManagerEvents#onInvitationHandledByOtherDevice
   * @param {object} options
   * @param {TUIRoomInfo} options.roomInfo 会议信息。
   * @param {boolean} options.accepted 接受状态。
   *
   *
   * @example
   * const roomEngine = new TUIRoomEngine();
   * const conferenceInvitationManager = roomEngine.getConferenceInvitationManager();
   * conferenceInvitationManager.on(TUIConferenceInvitationManagerEvents.onInvitationHandledByOtherDevice, ({ roomInfo, accepted }) => {
   *  console.log('conferenceInvitationManager.onInvitationHandledByOtherDevice', roomInfo, accepted);
   * })
   */
  onInvitationHandledByOtherDevice = 'onInvitationHandledByOtherDevice',

  /**
   * @description 会中邀请取消的回调
   * @default 'onInvitationCancelled'
   * @event TUIConferenceInvitationManagerEvents#onInvitationCancelled
   * @param {object} options
   * @param {TUIRoomInfo} options.roomInfo 会议信息。
   * @param {TUIInvitation} options.invitation 邀请信息。
   *
   *
   * @example
   * const roomEngine = new TUIRoomEngine();
   * const conferenceInvitationManager = roomEngine.getConferenceInvitationManager();
   * conferenceInvitationManager.on(TUIConferenceInvitationManagerEvents.onInvitationCancelled, ({ roomInfo, invitation }) => {
   *  console.log('conferenceInvitationManager.onInvitationCancelled', roomInfo, invitation);
   * })
   */
  onInvitationCancelled = 'onInvitationCancelled',

  /**
   * @description 会中邀请接受的回调
   * @default 'onInvitationAccepted'
   * @event TUIConferenceInvitationManagerEvents#onInvitationAccepted
   * @param {object} options
   * @param {TUIRoomInfo} options.roomInfo 会议信息。
   * @param {TUIInvitation} options.invitation 邀请信息。
   *
   *
   * @example
   * const roomEngine = new TUIRoomEngine();
   * const conferenceInvitationManager = roomEngine.getConferenceInvitationManager();
   * conferenceInvitationManager.on(TUIConferenceInvitationManagerEvents.onInvitationAccepted, ({ roomInfo, invitation }) => {
   *  console.log('conferenceInvitationManager.onInvitationAccepted', roomInfo, invitation);
   * })
   */
  onInvitationAccepted = 'onInvitationAccepted',

  /**
   * @description 会中邀请拒绝的回调
   * @default 'onInvitationRejected'
   * @event TUIConferenceInvitationManagerEvents#onInvitationRejected
   * @param {object} options
   * @param {TUIRoomInfo} options.roomInfo 会议信息。
   * @param {TUIInvitation} options.invitation 邀请信息。
   * @param {TUIInvitationRejectedReason} options.reason 拒绝加入会议的原因。
   *
   *
   *
   * @example
   * const roomEngine = new TUIRoomEngine();
   * const conferenceInvitationManager = roomEngine.getConferenceInvitationManager();
   * conferenceInvitationManager.on(TUIConferenceInvitationManagerEvents.onInvitationRejected, ({ roomInfo, invitation, reason }) => {
   *  console.log('conferenceInvitationManager.onInvitationRejected', roomInfo, invitation, reason);
   * })
   */
  onInvitationRejected = 'onInvitationRejected',

  /**
   * @description 会中邀请超时的回调
   * @default 'onInvitationTimeout'
   * @event TUIConferenceInvitationManagerEvents#onInvitationTimeout
   * @param {object} options
   * @param {TUIRoomInfo} options.roomInfo 会议信息。
   * @param {TUIInvitation} options.invitation 邀请信息。
   *
   *
   * @example
   * const roomEngine = new TUIRoomEngine();
   * const conferenceInvitationManager = roomEngine.getConferenceInvitationManager();
   * conferenceInvitationManager.on(TUIConferenceInvitationManagerEvents.onInvitationTimeout, ({ roomInfo, invitation }) => {
   *  console.log('conferenceInvitationManager.onInvitationTimeout', roomInfo, invitation);
   * })
   */
  onInvitationTimeout = 'onInvitationTimeout',

  /**
   * @description 会中邀请被管理员撤回的回调
   * @default 'onInvitationRevokedByAdmin'
   * @event TUIConferenceInvitationManagerEvents#onInvitationRevokedByAdmin
   * @param {object} options
   * @param {TUIRoomInfo} options.roomInfo 会议信息。
   * @param {TUIInvitation} options.invitation 邀请信息。
   * @param {TUIUserInfo} options.operateUser 撤回邀请的人的信息
   *
   *
   * @example
   * const roomEngine = new TUIRoomEngine();
   * const conferenceInvitationManager = roomEngine.getConferenceInvitationManager();
   * conferenceInvitationManager.on(TUIConferenceInvitationManagerEvents.onInvitationRevokedByAdmin, ({ roomInfo, invitation, userRole }) => {
   *  console.log('conferenceInvitationManager.onInvitationRevokedByAdmin', roomInfo, invitation, operateUser);
   * })
   */
  onInvitationRevokedByAdmin = 'onInvitationRevokedByAdmin',

  /**
   * @description 新添加会中邀请的回调
   * @default 'onInvitationAdded'
   * @event TUIConferenceInvitationManagerEvents#onInvitationAdded
   * @param {object} options
   * @param {TUIRoomInfo} options.roomInfo 会议信息。
   * @param {TUIInvitation} options.invitation 邀请信息。
   *
   *
   * @example
   * const roomEngine = new TUIRoomEngine();
   * const conferenceInvitationManager = roomEngine.getConferenceInvitationManager();
   * conferenceInvitationManager.on(TUIConferenceInvitationManagerEvents.onInvitationAdded, ({ roomInfo, invitation }) => {
   *  console.log('conferenceInvitationManager.onInvitationAdded', roomInfo, invitation);
   * })
   */
  onInvitationAdded = 'onInvitationAdded',

  /**
   * @description 会中邀请被移除的回调
   * @default 'onInvitationRemoved'
   * @event TUIConferenceInvitationManagerEvents#onInvitationRemoved
   * @param {object} options
   * @param {TUIRoomInfo} options.roomInfo 会议信息。
   * @param {TUIInvitation} options.invitation 邀请信息。
   *
   *
   * @example
   * const roomEngine = new TUIRoomEngine();
   * const conferenceInvitationManager = roomEngine.getConferenceInvitationManager();
   * conferenceInvitationManager.on(TUIConferenceInvitationManagerEvents.onInvitationRemoved, ({ roomInfo, invitation }) => {
   *  console.log('conferenceInvitationManager.onInvitationRemoved', roomInfo, invitation);
   * })
   */
  onInvitationRemoved = 'onInvitationRemoved',

  /**
   * @description 会中邀请状态变更的回调
   * @default 'onInvitationStatusChanged'
   * @event TUIConferenceInvitationManagerEvents#onInvitationStatusChanged
   * @param {object} options
   * @param {TUIRoomInfo} options.roomInfo 会议信息。
   * @param {TUIInvitation} options.invitation 邀请信息。
   *
   *
   * @example
   * const roomEngine = new TUIRoomEngine();
   * const conferenceInvitationManager = roomEngine.getConferenceInvitationManager();
   * conferenceInvitationManager.on(TUIConferenceInvitationManagerEvents.onInvitationStatusChanged, ({ roomInfo, invitation }) => {
   *  console.log('conferenceInvitationManager.onInvitationStatusChanged', roomInfo, invitation);
   * })
   */
  onInvitationStatusChanged = 'onInvitationStatusChanged',
}

/**
 * 直播间信息
 * @typedef {object} TUILiveInfo
 * @property {TUIRoomInfo} basicRoomInfo  房间信息，只读
 * @property {boolean} isGiftEnabled  直播间是否支持礼物
 * @property {boolean} isLikeEnabled  直播间是否支持点赞
 * @property {boolean} isPublicVisible  直播间是否公开
 * @property {number} activityStatus  直播间活跃状态: 用户自定义标记
 * @property {number} viewCount  累计观看次数，只读
 * @property {string} coverUrl  直播间封面图片 HTTP URL 地址，最大支持 200 个字节
 * @property {string} backgroundUrl  直播间背景图片 HTTP URL 地址，最大支持 200 个字节
 * @property {Array<number>} categoryList 直播间分类标签，单个房间最大支持3个标记
 */
const TUILiveInfo_HACK_JSDOC = null;
export type TUILiveInfo = {
  // / 房间信息(只读)
  basicRoomInfo: TUIRoomInfo;
  // / 直播间是否支持礼物
  isGiftEnabled: boolean;
  // / 直播间是否支持点赞
  isLikeEnabled: boolean;
  // / 直播间是否公开
  isPublicVisible: boolean;
  // / 直播间活跃状态: 用户自定义标记
  activityStatus: number;
  // / 累计观看次数
  viewCount: number;
  // / 直播间封面图片 HTTP URL 地址，最大支持 200 个字节
  coverUrl: string;
  // / 直播间背景图片 HTTP URL 地址，最大支持 200 个字节
  backgroundUrl: string;
  // / 直播间分类标签，单个房间最大支持3个标记
  categoryList: Array<number>;
};

/**
 * 直播间信息发生修改结构体
 *
 * @typedef {object} TUILiveModifyInfo
 * @property {string} roomId 直播间 ID
 * @property {boolean} isPublicVisible 可选，直播间是否公开
 * @property {number} activityStatus 可选，直播间活跃状态: 用户自定义标记
 * @property {string} coverUrl 可选，直播间封面图片 HTTP URL 地址，最大支持 200 个字节
 * @property {string} backgroundUrl 可选，直播间背景图片 HTTP URL 地址，最大支持 200 个字节
 * @property {Array<number>} categoryList 可选，直播间分类标签，单个房间最大支持3个标记
 */
const TUILiveModifyInfo_HACK_JSDOC = null;
export type TUILiveModifyInfo = {
  roomId: string;
  // / 直播间是否公开
  isPublicVisible?: boolean;
  // / 直播间活跃状态: 用户自定义标记
  activityStatus?: number;
  // / 直播间封面图片 HTTP URL 地址，最大支持 200 个字节
  coverUrl?: string;
  // / 直播间背景图片 HTTP URL 地址，最大支持 200 个字节
  backgroundUrl?: string;
  // / 直播间分类标签，单个房间最大支持3个标记
  categoryList?: Array<number>;
};

/**
 * 直播间修改标记位
 * @typedef {object} TUILiveModifyFlag
 * @property {number} kNone 不修改
 * @property {number} kActivityStatus 直播间活跃状态，支持自定义设置
 * @property {number} kCoverUrl 直播间封面
 * @property {number} kCategory 直播间分类
 * @property {number} kEnableGift 直播间支持发送礼物标记
 * @property {number} kEnableLike 直播支持点赞标记
 * @property {number} kPublic 直播间公开标记
 * @property {number} kBackgroundUrl 直播间背景
 */
const TUILiveModifyFlag_HACK_JSDOC = null;
export enum TUILiveModifyFlag {
  // / 不修改
  kNone = 0x00,
  // / 直播间活跃状态，支持自定义设置
  kActivityStatus = 0x01 << 8,
  // / 直播间封面
  kCoverUrl = 0x01 << 9,
  // / 直播间分类
  kCategory = 0x01 << 10,
  // / 直播间支持发送礼物标记
  kEnableGift = 0x01 << 11,
  // / 直播支持点赞标记
  kEnableLike = 0x01 << 12,
  // / 直播间公开标记
  kPublic = 0x01 << 13,
  // / 直播间背景
  kBackgroundUrl = 0x01 << 18,
}

/**
 * 直播间列表查询结果
 * @typedef{object} TUILiveListResult
 * @property {string} cursor 列表下标
 * @property {Array<TUILiveInfo>} listInfoList 直播间列表
 */
const TUILiveListResult_HACK_JSDOC = null;
export type TUILiveListResult = {
  // / 列表下标
  cursor: string;
  // / 直播间列表
  listInfoList: Array<TUILiveInfo>;
};

/**
 * @since v2.9.0
 * ** TUILiveListManager 事件列表**<br>
 */
export enum TUILiveListManagerEvents {
  /**
   * @description 直播间信息发生变化事件回调
   * @default 'onLiveInfoChanged'
   * @event TUILiveListManagerEvents#onLiveInfoChanged
   * @param {object} options
   * @param {TUILiveInfo} options.liveInfo 直播间信息
   * @param {TUILiveModifyFlag} options.modifyFlag 直播间修改标识
   *
   * @example
   * const roomEngine = new TUIRoomEngine();
   * const liveListManager = roomEngine.getLiveListManager();
   * liveListManager.on(TUILiveListManagerEvents.onLiveInfoChanged, ({ liveInfo, modifyFlag}) => {
   *   console.log('liveListManager.onLiveInfoChanged', liveInfo, modifyFlag);
   * });
   */
  onLiveInfoChanged = 'onLiveInfoChanged',
}

export enum TUILiveLayoutManagerEvents {
  /**
   * const roomEngine = new TUIRoomEngine();
   * const liveLayoutManager = roomEngine.getLiveLayoutManager();
   * const callback = (roomId, layoutInfo) => {
   *   console.log('liveLayoutManager.onLiveVideoLayoutListChanged', roomId, layoutInfo);
   * };
   * liveLayoutManager.on(TUILiveLayoutManagerEvents.onLiveVideoLayoutListChanged, callback);
   */
  onLiveVideoLayoutListChanged = 'onLiveVideoLayoutListChanged',
}

/**
 * 直播间麦位排版模板
 *
 * @enum {Number}
 */
const TUISeatLayoutTemplate_HACK_JSDOC = {
  /** 横屏动态1v3 */
  LandscapeDynamic_1v3: 200,
  /** 竖屏动态9宫格 */
  PortraitDynamic_Grid9: 600,
  /** 竖屏动态1v6  */
  PortraitDynamic_1v6: 601,
  /** 竖屏固定9宫格 */
  PortraitFixed_Grid9: 800,
  /** 竖屏固定1v6 */
  PortraitFixed_1v6: 801,
  /** 竖屏6v6 */
  PortraitFixed_6v6: 802,
};
export enum TUISeatLayoutTemplate {
  LandscapeDynamic_1v3 = 200,
  PortraitDynamic_Grid9 = 600,
  PortraitDynamic_1v6 = 601,
  PortraitFixed_Grid9 = 800,
  PortraitFixed_1v6 = 801,
  PortraitFixed_6v6 = 802,
}
