import {
  FilePicker as FilePickerComponent,
  ImagePicker as ImagePickerComponent,
  VideoPicker as VideoPickerComponent,
  AttachmentPicker as AttachmentPickerComponent,
} from './AttachmentPicker';
import { EmojiPicker as EmojiPickerComponent } from './EmojiPicker';
import { TextEditor as TextEditorComponent } from './TextEditor';
import { AudioCallPicker as AudioCallPickerComponent } from './AudioCallPicker';
import { VideoCallPicker as VideoCallPickerComponent } from './VideoCallPicker';
import MessageInputComponent from './MessageInput.vue';
import { addI18n } from '../../i18n';
import { resources } from './i18n';

addI18n('en-US', { translation: { MessageInput: resources['en-US'] } });
addI18n('zh-CN', { translation: { MessageInput: resources['zh-CN'] } });

const MessageInput = MessageInputComponent;
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
  AudioCallPicker,
  VideoCallPicker,
};
