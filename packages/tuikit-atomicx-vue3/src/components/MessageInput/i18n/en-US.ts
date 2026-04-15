const MessageInput = {
  file: 'File',
  image: 'Image',
  video: 'Video',
  audio: 'Audio',
  location: 'Location',
  custom_message: 'Custom Message',
  unknown: 'Unknown',
  enter_a_message: 'Enter a message',
  send: 'Send',
  select_call_members: 'Select call members',
  cancel: 'Cancel',
  confirm: 'Confirm',
  initiate_call: 'Initiate call',
  loading: 'Loading...',
  no_matching_members: 'No matching members',
  at_all_members: 'All members',
  invalid_image_type: 'Invalid image type',
};

const OfflinePush = {
  text: '[Text Message]',
  image: '[Image Message]',
  video: '[Video Message]',
  file: '[File Message]',
  audio: '[Audio Message]',
  face: '[Sticker Message]',
  location: '[Location Message]',
  merger: '[Forward Message]',
  custom: '[Custom Message]',
};

const ConferencePicker = {
  Quick_Conference: '{{name}} \'s Quick Room',
  Create_Conference_Failed: 'Failed to create room, please try again',
  Cannot_Start_While_In_Meeting: 'You are already in a room and cannot start another one',
};

export default {
  OfflinePush,
  MessageInput,
  ConferencePicker,
};
