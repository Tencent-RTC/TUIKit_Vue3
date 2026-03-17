import { addI18n } from '../../i18n';
import {
  FilePicker as FilePickerComponent,
  ImagePicker as ImagePickerComponent,
  VideoPicker as VideoPickerComponent,
  AttachmentPicker as AttachmentPickerComponent,
} from './AttachmentPicker';
import { AudioCallPicker as AudioCallPickerComponent } from './AudioCallPicker';
import { EmojiPicker as EmojiPickerComponent } from './EmojiPicker';
import { resources } from './i18n';
import MessageInputComponent from './MessageInput.vue';
import MessageInputH5Component from './MessageInputH5.vue';
import { TextEditor as TextEditorComponent } from './TextEditor';
import { VideoCallPicker as VideoCallPickerComponent } from './VideoCallPicker';

addI18n('en-US', { translation: { MessageInput: resources['en-US'] } });
addI18n('zh-CN', { translation: { MessageInput: resources['zh-CN'] } });

const MessageInput = MessageInputComponent;
const MessageInputH5 = MessageInputH5Component;
const EmojiPicker = EmojiPickerComponent;
const FilePicker = FilePickerComponent;
const ImagePicker = ImagePickerComponent;
const VideoPicker = VideoPickerComponent;
const TextEditor = TextEditorComponent;
const AttachmentPicker = AttachmentPickerComponent;
const AudioCallPicker = AudioCallPickerComponent;
const VideoCallPicker = VideoCallPickerComponent;

export {
  AttachmentPicker,
  FilePicker,
  ImagePicker,
  VideoPicker,
  EmojiPicker,
  TextEditor,
  MessageInput,
  MessageInputH5,
  AudioCallPicker,
  VideoCallPicker,
};
