// Live related exports
import { AudioSettingPanel as AudioSettingPanelComponent } from '../components/AudioSettingPanel';
import { BarrageInput as BarrageInputComponent } from '../components/BarrageInput';
import { BarrageList as BarrageListComponent } from '../components/BarrageList';
import { CameraButton as CameraButtonComponent } from '../components/CameraButton';
import { CoGuestPanel as CoGuestPanelComponent } from '../components/CoGuestPanel';
import { CoHostPanel as CoHostPanelComponent } from '../components/CoHostPanel';
import { LiveAudienceList as LiveAudienceListComponent } from '../components/LiveAudienceList';
import { LiveList as LiveListComponent } from '../components/LiveList';
import { LiveMonitorView as LiveMonitorViewComponent } from '../components/LiveMonitorView';
import { LiveScenePanel as LiveScenePanelComponent } from '../components/LiveScenePanel';
import { LiveCoreView, LiveView } from '../components/LiveView';
import { MicButton as MicButtonComponent } from '../components/MicButton';
import { RoomParticipantList as RoomParticipantListComponent } from '../components/RoomParticipantList';
import { RoomParticipantView as RoomParticipantViewComponent } from '../components/RoomParticipantView';
import { ScheduleRoomPanel, ScheduledRoomList } from '../components/ScheduleRoomPanel';
import { StreamMixer as StreamMixerComponent } from '../components/StreamMixer';
import { VideoSettingPanel as VideoSettingPanelComponent } from '../components/VideoSettingPanel';
import { useRoomEngine as RoomEngine } from '../hooks/useRoomEngine';
import { useASRState } from '../states/ASRState/ASRState';
import { useBarrageState } from '../states/BarrageState';
import { useBattleState } from '../states/BattleState';
import { useCoGuestState as CoGuestState } from '../states/CoGuestState';
import { useCoHostState as CoHostState } from '../states/CoHostState';
import { useDeviceState as DeviceState } from '../states/DeviceState';
import { useFreeBeautyState } from '../states/FreeBeautyState';
import { useLiveAudienceState as LiveAudienceState } from '../states/LiveAudienceState';
import { useLiveListState } from '../states/LiveListState';
import { useLiveMonitorState as LiveMonitorState } from '../states/LiveMonitorState';
import { useLiveSeatState as LiveSeatState } from '../states/LiveSeatState';
import { useRoomState as RoomListState } from '../states/RoomState';
import { useRoomParticipantState as RoomParticipantState } from '../states/RoomParticipantState';
import { useVideoMixerState as VideoMixerState } from '../states/VideoMixerState';
import { useVirtualBackgroundState } from '../states/VirtualBackgroundState';

import RTCLoginServer from './server';

RTCLoginServer.getInstance().init();

const BarrageList = BarrageListComponent;
const BarrageInput = BarrageInputComponent;
const StreamMixer = StreamMixerComponent;
const LiveScenePanel = LiveScenePanelComponent;
const LiveAudienceList = LiveAudienceListComponent;
const CoGuestPanel = CoGuestPanelComponent;
const CoHostPanel = CoHostPanelComponent;
const AudioSettingPanel = AudioSettingPanelComponent;
const VideoSettingPanel = VideoSettingPanelComponent;
const MicButton = MicButtonComponent;
const CameraButton = CameraButtonComponent;
const LiveList = LiveListComponent;
const LiveMonitorView = LiveMonitorViewComponent;
const RoomParticipantView = RoomParticipantViewComponent;
const RoomParticipantList = RoomParticipantListComponent;

const useLiveMonitorState = LiveMonitorState;
const useLiveSeatState = LiveSeatState;
const useCoGuestState = CoGuestState;
const useCoHostState = CoHostState;
const useDeviceState = DeviceState;
const useLiveAudienceState = LiveAudienceState;
const useRoomState = RoomListState;
const useRoomParticipantState = RoomParticipantState;
const useVideoMixerState = VideoMixerState;
const useRoomEngine = RoomEngine;

export {
  // Components
  BarrageList,
  BarrageInput,
  LiveCoreView,
  LiveView,
  StreamMixer,
  LiveScenePanel,
  LiveAudienceList,
  CoGuestPanel,
  CoHostPanel,
  AudioSettingPanel,
  VideoSettingPanel,
  MicButton,
  CameraButton,
  LiveList,
  LiveMonitorView,
  ScheduleRoomPanel,
  ScheduledRoomList,
  RoomParticipantView,
  RoomParticipantList,

  // States
  useRoomEngine,
  useLiveListState,
  useRoomState,
  useRoomParticipantState,
  useDeviceState,
  useVideoMixerState,
  useLiveSeatState,
  useCoGuestState,
  useCoHostState,
  useLiveAudienceState,
  useLiveMonitorState,
  useBattleState,
  useBarrageState,
  useASRState,
  useVirtualBackgroundState,
  useFreeBeautyState,
};
