import type { Ref } from 'vue';
import { ref } from 'vue';
import type { ContactItemType, ContactGroupItem } from '../../../types/contact';

const activeContact: Ref<ContactGroupItem | undefined> = ref(undefined);
const contactGroupTitles: Ref<Partial<Record<ContactItemType, string>>> = ref({});

const setActiveContact = (contactInfo: ContactGroupItem | undefined) => {
  activeContact.value = contactInfo;
};

const setContactGroupTitles = (groups: Partial<Record<ContactItemType, string>>) => {
  contactGroupTitles.value = groups;
};

export const useContactList = () => ({
  activeContact,
  setActiveContact,
  contactGroupTitles,
  setContactGroupTitles,
});
