import { ref } from 'vue';
import { ChatSceneType } from './const';

const chatScene = ref<ChatSceneType | undefined>(undefined);

function setChatScene(value: ChatSceneType) {
  chatScene.value = value;
}

function getChatScene() {
  return chatScene.value;
}


export function useStatistical() {
  return {
    chatScene,
    setChatScene,
    getChatScene,
  };
}

export default useStatistical;
