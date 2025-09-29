import {
  AttachmentPicker as AttachmentPickerComponent,
  FilePicker as FilePickerComponent,
  ImagePicker as ImagePickerComponent,
  VideoPicker as VideoPickerComponent,
} from './AttachmentPicker';
import { EmojiPicker as EmojiPickerComponent } from './EmojiPicker';
import { TextEditor as TextEditorComponent } from './TextEditor';
import MessageInputComponent from './MessageInput.vue';
import { addI18n } from '../../i18n';
import { resources } from './i18n';

addI18n('en-US', { translation: { MessageInput: resources['en-US'] } });
addI18n('zh-CN', { translation: { MessageInput: resources['zh-CN'] } });

const AttachmentPicker = AttachmentPickerComponent;
const FilePicker = FilePickerComponent;
const ImagePicker = ImagePickerComponent;
const VideoPicker = VideoPickerComponent;
const EmojiPicker = EmojiPickerComponent;
const TextEditor = TextEditorComponent;
const MessageInput = MessageInputComponent;


export {
  AttachmentPicker,
  FilePicker,
  ImagePicker,
  VideoPicker,
  EmojiPicker,
  TextEditor,
  MessageInput,
};
