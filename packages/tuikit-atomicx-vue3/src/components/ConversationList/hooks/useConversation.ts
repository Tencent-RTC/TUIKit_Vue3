import { ref } from 'vue';

const enableCreate = ref(false);
const enableSearch = ref(false);

export const useConversation = () => {
  const setEnableCreate = (value: boolean) => {
    enableCreate.value = value;
  };

  const setEnableSearch = (value: boolean) => {
    enableSearch.value = value;
  };

  return {
    enableCreate,
    enableSearch,
    setEnableCreate,
    setEnableSearch,
  };
};
