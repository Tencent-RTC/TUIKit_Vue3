import { computed } from 'vue';
import { useRoomParticipantState } from '../../../states/RoomParticipantState';
import { RoomParticipantRole } from '../../../types';
import useRoomAudioAction from './useRoomAudioAction';
import useRoomScreenAction from './useRoomScreenAction';
import useRoomVideoAction from './useRoomVideoAction';

const { localParticipant } = useRoomParticipantState();

export default function useRoomActions() {
  const canOperate = computed(() => localParticipant.value?.role === RoomParticipantRole.Owner || localParticipant.value?.role === RoomParticipantRole.Admin);
  const roomActionList = computed(() => {
    if (!canOperate.value) {
      return [];
    }
    return [useRoomAudioAction(), useRoomVideoAction(), useRoomScreenAction()];
  });

  return {
    canOperate,
    roomActionList,
  };
}
