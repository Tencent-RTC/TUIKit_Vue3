const MessageInput = {
  file: '文件',
  image: '图片',
  video: '视频',
  audio: '音频',
  location: '位置',
  custom_message: '自定义消息',
  unknown: '未知',
  enter_a_message: '输入消息',
  send: '发送',
  select_call_members: '选择成员',
  cancel: '取消',
  confirm: '确认',
  initiate_call: '发起通话',
  loading: '加载中...',
  no_matching_members: '暂无匹配成员',
  at_all_members: '所有人',
  invalid_image_type: '无效的图片类型',
};

const OfflinePush = {
  text: '[文本消息]',
  image: '[图片消息]',
  video: '[视频消息]',
  file: '[文件消息]',
  audio: '[语音消息]',
  face: '[动画表情]',
  location: '[地理位置]',
  merger: '[转发消息]',
  custom: '[自定义消息]',
};

const ConferencePicker = {
  Quick_Conference: '{{name}}的快速房间',
  Create_Conference_Failed: '创建房间失败，请重试',
  Cannot_Start_While_In_Meeting: '您当前已经在房间中，不可再次发起房间',
};

export default {
  MessageInput,
  OfflinePush,
  ConferencePicker,
};
