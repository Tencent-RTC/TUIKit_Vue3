import useRoomParticipantState from '../../states/RoomParticipantState';

const { participantList } = useRoomParticipantState();

export const getDisplayName = (userId: string) => {
  const participant = participantList.value.find(p => p.userId === userId);
  return participant?.nameCard || participant?.userName || participant?.userId || userId;
};
