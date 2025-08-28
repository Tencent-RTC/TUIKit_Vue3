import { addI18n } from '../../i18n';
import { ContactInfo as ContactInfoComponent } from './ContactInfo';
import ContactListComponent from './ContactList.vue';
import { ContactListItem as ContactListItemComponent } from './ContactListItem';
import { enResource, zhResource } from './i18n';

addI18n('en-US', { translation: enResource });
addI18n('zh-CN', { translation: zhResource });

const ContactListItem = ContactListItemComponent;
const ContactInfo = ContactInfoComponent;
const ContactList = ContactListComponent;

export {
  ContactList,
  ContactListItem,
  ContactInfo,
};
