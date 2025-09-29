import { ref } from "vue";
import { getPlatform } from '@tencentcloud/universal-api';

const isH5 = ref(getPlatform() === 'h5');
const isChatSettingOpen = ref(false);

function setIsSettingOpen(isOpen: boolean) {
  isChatSettingOpen.value = isOpen;
}

function useCoreStore() {
  return {
    isH5,
    isChatSettingOpen,
    setIsSettingOpen,
  }
}

export {
  useCoreStore,
};
