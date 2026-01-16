import { ref, watch, onUnmounted } from 'vue';
import { TUIRoomEvents } from '@tencentcloud/tuiroom-engine-js';
import { useRoomEngine } from '../../hooks/useRoomEngine';
import { useBarrageState } from '../../states/BarrageState';
import { useLiveListState } from '../../states/LiveListState';
import type { Barrage } from '../../types/barrage';

interface IMessageGroupTip {
  avatarUrl: string;
  nameCard: string;
  roomCustomInfo: Record<string, any>;
  userId: string;
  userName: string;
  userRole: number;
  displayAction: 'enter' | 'leave';
}

const roomEngine = useRoomEngine();

const { currentLive } = useLiveListState();
const { messageList } = useBarrageState();

const messageGroupTipRef = ref<IMessageGroupTip>();
const messageListRef = ref<Barrage[]>([]);

const messageListCursor = ref<number>(0);
const messageUpdateQueue = ref<Barrage[][]>([]);
const isProcessingQueue = ref<boolean>(false);

const messageGroupTipQueue = ref<IMessageGroupTip[]>([]);
const isProcessingMessageGroupTipQueue = ref<boolean>(false);

const MAX_MESSAGE_COUNT = 1000;
const MESSAGE_GROUP_TIP_AUTO_CLEAR_DELAY = 2000;
const MESSAGE_QUEUE_PROCESS_DELAY = 1000;
const BATCH_SIZE = 20;
// const MAX_WAIT_TIME = 1000; todo
const MESSAGE_GROUP_TIP_QUEUE_MAX_LENGTH = 10;
const MESSAGE_GROUP_TIP_QUEUE_REMAIN_LENGTH = 2;

let enterRoomListener: ((params: any) => void) | null = null;
let leaveRoomListener: ((params: any) => void) | null = null;

const clearEventListeners = () => {
  if (roomEngine.instance && enterRoomListener) {
    roomEngine.instance.off(TUIRoomEvents.onRemoteUserEnterRoom, enterRoomListener);
    enterRoomListener = null;
  }
  if (roomEngine.instance && leaveRoomListener) {
    roomEngine.instance.off(TUIRoomEvents.onRemoteUserLeaveRoom, leaveRoomListener);
    leaveRoomListener = null;
  }
};

const truncateMessageList = (messages: Barrage[]) => {
  if (messages.length <= MAX_MESSAGE_COUNT) {
    return messages;
  }

  const excessCount = messages.length - MAX_MESSAGE_COUNT;
  const cleanedMessages = messages.slice(excessCount);

  return cleanedMessages;
};

const processMessageQueue = async () => {
  if (isProcessingQueue.value || messageUpdateQueue.value.length === 0) {
    return;
  }

  isProcessingQueue.value = true;

  try {
    let currentBatch: Barrage[] = [];
    let lastUpdateTime = Date.now();

    while (messageUpdateQueue.value.length > 0) {
      const messages = messageUpdateQueue.value.splice(0, 1)[0];
      currentBatch.push(...messages);
      // while (
      //   currentBatch.length < BATCH_SIZE &&
      //   messageUpdateQueue.value.length > 0 &&
      //   Date.now() - lastUpdateTime < MAX_WAIT_TIME
      // ) {
      //   const nextMessages = messageUpdateQueue.value.splice(0, 1)[0];
      //   currentBatch.push(...nextMessages);
      // }

      const newMessageList = [...(messageListRef.value || []), ...currentBatch];
      messageListRef.value = truncateMessageList(newMessageList);

      currentBatch = [];
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      lastUpdateTime = Date.now();

      if (messageUpdateQueue.value.length > 0) {
        // eslint-disable-next-line no-await-in-loop, no-promise-executor-return
        await new Promise(resolve => setTimeout(resolve, MESSAGE_QUEUE_PROCESS_DELAY));
      }
    }
  } finally {
    isProcessingQueue.value = false;
  }
};

const processedMessageListUpdate = (list: Barrage[]) => {
  const newList = list.slice(messageListCursor.value);
  messageListCursor.value = list.length;

  if (newList.length === 0) {
    messageListRef.value = list;
    return;
  }

  for (let i = 0; i < newList.length; i += BATCH_SIZE) {
    messageUpdateQueue.value.push(newList.slice(i, i + BATCH_SIZE));
  }

  processMessageQueue();
};

const processMessageGroupTipQueue = async () => {
  if (isProcessingMessageGroupTipQueue.value || messageGroupTipQueue.value.length === 0) {
    return;
  }

  isProcessingMessageGroupTipQueue.value = true;

  try {
    while (messageGroupTipQueue.value.length > 0) {
      const tip = messageGroupTipQueue.value.splice(0, 1)[0];
      messageGroupTipRef.value = tip;
      // eslint-disable-next-line no-await-in-loop, @stylistic/block-spacing, @stylistic/brace-style, @stylistic/max-statements-per-line
      await new Promise((resolve) => {setTimeout(resolve, MESSAGE_GROUP_TIP_AUTO_CLEAR_DELAY);});
      messageGroupTipRef.value = undefined;
    }
  } catch (error) {
    console.error('[BarrageListState] processMessageGroupTipQueue error', error);
  } finally {
    isProcessingMessageGroupTipQueue.value = false;
  }
};

const processMessageGroupTipUpdate = (tip: IMessageGroupTip) => {
  messageGroupTipQueue.value.push(tip);
  if (messageGroupTipQueue.value.length > MESSAGE_GROUP_TIP_QUEUE_MAX_LENGTH) {
    messageGroupTipQueue.value = messageGroupTipQueue.value.slice(-MESSAGE_GROUP_TIP_QUEUE_REMAIN_LENGTH);
  }
  processMessageGroupTipQueue();
};

const initWatchers = () => {
  clearEventListeners();

  enterRoomListener = ({ userInfo }) => {
    processMessageGroupTipUpdate({
      avatarUrl: userInfo.avatarUrl,
      nameCard: userInfo.nameCard,
      roomCustomInfo: userInfo.roomCustomInfo,
      userId: userInfo.userId,
      userName: userInfo.userName,
      userRole: userInfo.userRole,
      displayAction: 'enter',
    });
  };

  leaveRoomListener = ({ userInfo }) => {
    processMessageGroupTipUpdate({
      avatarUrl: userInfo.avatarUrl,
      nameCard: userInfo.nameCard,
      roomCustomInfo: userInfo.roomCustomInfo,
      userId: userInfo.userId,
      userName: userInfo.userName,
      userRole: userInfo.userRole,
      displayAction: 'leave',
    });
  };

  if (enterRoomListener) {
    roomEngine.instance?.on(TUIRoomEvents.onRemoteUserEnterRoom, enterRoomListener);
  }
  if (leaveRoomListener) {
    roomEngine.instance?.on(TUIRoomEvents.onRemoteUserLeaveRoom, leaveRoomListener);
  }
};

watch(() => messageList.value.length, (length) => {
  if (length > 0) {
    processedMessageListUpdate(messageList.value);
  }
}, {
  immediate: true,
});

const resetState = () => {
  messageListRef.value = [];
  messageListCursor.value = 0;
  messageUpdateQueue.value = [];
  isProcessingQueue.value = false;
  messageGroupTipRef.value = undefined;
  messageGroupTipQueue.value = [];
};

watch(() => currentLive.value?.liveId, (newVal, oldVal) => {
  if (!newVal && oldVal) {
    resetState();
  } else {
    initWatchers();
  }
});

onUnmounted(() => {
  clearEventListeners();
});

function useBarrageListState() {
  return {
    messageList: messageListRef,
    messageGroupTip: messageGroupTipRef,
  };
}

function isGiftMessage (message: Barrage): boolean {
  if (!message.data) {
    return false;
  }

  try {
    const data = JSON.parse(message.data);
    return data.type === 'gift';
  } catch (error) {
    return false;
  }
};

export { useBarrageListState, isGiftMessage };
