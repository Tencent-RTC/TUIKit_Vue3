import { ref, computed } from 'vue';
import { TUILiveLayoutManagerEvents } from '@tencentcloud/tuiroom-engine-js';
import { useRoomEngine } from '../../../hooks/useRoomEngine';
import { useRoomState } from '../../../states/RoomState';
import type { TUIDeviceStatus, TUISeatLayout, TUISeatRegion } from '@tencentcloud/tuiroom-engine-js';

const { currentRoom } = useRoomState();
const roomEngine = useRoomEngine();
const seatList = ref<any[]>([]);
const canvas = ref<any>({
  width: 0,
  height: 0,
  background: '#000000',
});

const containerSize = ref({
  width: 0,
  height: 0,
});

let containerId: string | null = null;

function handleStreamContainerSize(entries: ResizeObserverEntry[]) {
  // Guard against null container: the DOM node may have been removed
  // before the ResizeObserver callback fires, causing TypeError on
  // accessing clientWidth/clientHeight.
  if (!containerId) {
    return;
  }
  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }
  containerSize.value.width = container.clientWidth;
  containerSize.value.height = container.clientHeight;
}

const ro = new ResizeObserver((entries) => {
  handleStreamContainerSize(entries);
});

function createResizeObserver({ view }: { view: string }) {
  if (!view) {
    return;
  }
  const container = document.getElementById(view);
  if (!container) {
    return;
  }
  containerId = view;
  ro.observe(container);
}

function deleteResizeObserver() {
  // Guard against null container: during teardown the element may already
  // be detached from the DOM, and unobserve(null) throws in some browsers.
  if (!containerId) {
    return;
  }
  const container = document.getElementById(containerId);
  if (container) {
    ro.unobserve(container);
  }
  containerId = null;
}

const config = computed(() => {
  const layoutCanvas = canvas.value;
  const layoutList = seatList.value?.map(seat => ({ userId: seat.userInfo?.userId, ...seat.region }));
  if (!layoutList) {
    return {
      layoutList: [],
    };
  }
  return {
    layoutList: layoutList.map((item: any) => ({
      userId: item.userId,
      x: item.x / layoutCanvas.width,
      y: item.y / layoutCanvas.width,
      w: item.w / layoutCanvas.width,
      h: item.h === layoutCanvas.height ? -1 : item.h / layoutCanvas.width,
      zOrder: item.zOrder,
    })),
  };
});

const positionList = computed(() => {
  const { layoutList } = config.value;
  return layoutList.map((item: any, index: number) => ({
    userId: item.userId,
    left: `${containerSize.value.width * item.x}px`,
    top: `${containerSize.value.width * item.y}px`,
    width: `${containerSize.value.width * item.w}px`,
    height: item.h === -1 ? `${containerSize.value.height}px` : `${containerSize.value.width * item.h}px`,
    zIndex: item.zOrder,
  }));
});

type SeatInfo = {
  index: number;
  isLocked: boolean;
  userInfo: {
    userId: string;
    userName: string;
    avatarUrl: string;
    userMicrophoneStatus: TUIDeviceStatus;
    userCameraStatus: TUIDeviceStatus;
  };
  region: {
    x: number;
    y: number;
    w: number;
    h: number;
    zOrder: number;
  };
};

function getNewSeatInfo(seatRegion: TUISeatRegion): SeatInfo {
  return {
    index: seatRegion.seatIndex,
    isLocked: seatRegion.isSeatLocked,
    userInfo: {
      userId: seatRegion.userId,
      userName: seatRegion.userName,
      avatarUrl: seatRegion.userAvatar,
      userMicrophoneStatus: seatRegion.userMicrophoneStatus,
      userCameraStatus: seatRegion.userCameraStatus,
    },
    region: {
      x: seatRegion.x,
      y: seatRegion.y,
      w: seatRegion.width,
      h: seatRegion.height,
      zOrder: seatRegion.zorder,
    },
  };
}

const onSeatLayoutChanged = ({ roomId, seatLayout }: { roomId: string; seatLayout: TUISeatLayout }) => {
  if (roomId !== currentRoom.value?.roomId) {
    return;
  }
  canvas.value = {
    width: seatLayout.canvasWidth,
    height: seatLayout.canvasHeight,
    background: '#000000',
  };
  seatList.value = seatLayout.regions.map(region => getNewSeatInfo(region));
};

export function useStreamPosition() {
  const liveLayoutManager = roomEngine.instance?.getLiveLayoutManager();
  liveLayoutManager?.on(TUILiveLayoutManagerEvents.onSeatLayoutChanged, onSeatLayoutChanged);

  return {
    seatList,
    positionList,
    createResizeObserver,
    deleteResizeObserver,
  };
}
