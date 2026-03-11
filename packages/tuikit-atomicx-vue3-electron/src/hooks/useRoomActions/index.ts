import useRoomAudioAction from './useRoomAudioAction';
import useRoomScreenAction from './useRoomScreenAction';
import useRoomVideoAction from './useRoomVideoAction';
import type { ActionType } from '../../types';

export default function useRoomActions(options?: {
  actionList: RoomAction[];
}): ActionType<RoomAction>[] {
  const roomActionObj = {
    [RoomAction.AudioAction]: useRoomAudioAction(),
    [RoomAction.VideoAction]: useRoomVideoAction(),
    [RoomAction.ScreenAction]: useRoomScreenAction(),
  };

  if (options && options.actionList && options.actionList.length > 0) {
    return options.actionList.map(action => roomActionObj[action]);
  }
  return Object.values(roomActionObj);
}
