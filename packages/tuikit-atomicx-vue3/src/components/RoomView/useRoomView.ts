import { ref, computed } from 'vue';
import { useRoomParticipantState } from '../../states/RoomParticipantState';
import { DeviceStatus, RoomLayoutTemplate, RoomParticipantRole, VideoStreamType } from '../../types';
import { combineComparators, createComparator } from '../../utils/compare';
import type { RoomParticipant } from '../../types';

export function useRoomView() {
  const layoutTemplate = ref<RoomLayoutTemplate>(RoomLayoutTemplate.GridLayout);

  const { localParticipant, participantList, participantWithScreen } = useRoomParticipantState();

  const defaultUserListCompareFunction = combineComparators(
    createComparator((userInfo: RoomParticipant) =>
      Boolean(userInfo.role === RoomParticipantRole.Owner),
    ),
    createComparator((userInfo: RoomParticipant) =>
      Boolean(userInfo.userId === localParticipant.value?.userId),
    ),
    createComparator((userInfo: RoomParticipant) =>
      Boolean(userInfo.role === RoomParticipantRole.Admin),
    ),
    createComparator((userInfo: RoomParticipant) => Boolean(userInfo.screenShareStatus === DeviceStatus.On)),
    createComparator((userInfo: RoomParticipant) =>
      Boolean(userInfo.cameraStatus === DeviceStatus.On && userInfo.microphoneStatus === DeviceStatus.On),
    ),
    createComparator((userInfo: RoomParticipant) => Boolean(userInfo.cameraStatus === DeviceStatus.On)),
    createComparator((userInfo: RoomParticipant) => Boolean(userInfo.microphoneStatus === DeviceStatus.On)),
  );

  const participantCameraList = computed(
    () => participantList.value.sort(defaultUserListCompareFunction).map(participant => ({ participant, streamType: VideoStreamType.Camera })),
  );

  const participantStreamList = computed(() => {
    const result = [];
    if (participantWithScreen.value) {
      result.push({ participant: participantWithScreen.value, streamType: VideoStreamType.Screen });
    }
    result.push(...participantCameraList.value);
    return result;
  });

  return {
    layoutTemplate,
    participantCameraList,
    participantStreamList,
  };
}
