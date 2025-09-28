// Live related exports
import { AudioSetting as AudioSettingComponent } from '../components/AudioSetting';
import { AudioSettingPanel as AudioSettingPanelComponent } from '../components/AudioSettingPanel';
import { BarrageInput as BarrageInputComponent } from '../components/BarrageInput';
import { BarrageList as BarrageListComponent } from '../components/BarrageList';
import { CameraButton as CameraButtonComponent } from '../components/CameraButton';
import { CoGuestPanel as CoGuestPanelComponent } from '../components/CoGuestPanel';
import { CoHostPanel as CoHostPanelComponent } from '../components/CoHostPanel';
import { LiveAudienceList as LiveAudienceListComponent } from '../components/LiveAudienceList';
import { LiveCoreView as LiveCoreViewComponent } from '../components/LiveCoreView';
import { LiveList as LiveListComponent } from '../components/LiveList';
import { LiveMonitorView as LiveMonitorViewComponent } from '../components/LiveMonitorView';
import { LiveScenePanel as LiveScenePanelComponent } from '../components/LiveScenePanel';
import { MicButton as MicButtonComponent } from '../components/MicButton';
import { StreamMixer as StreamMixerComponent } from '../components/StreamMixer';
import { StreamView as StreamViewComponent } from '../components/StreamView';
import { VideoSetting as VideoSettingComponent } from '../components/VideoSetting';
import { VideoSettingPanel as VideoSettingPanelComponent } from '../components/VideoSettingPanel';
import { useBarrageListState as BarrageListState } from '../states/BarrageListState';
import { useCoGuestState as CoGuestState } from '../states/CoGuestState';
import { useCoHostState as CoHostState } from '../states/CoHostState';
import { useDeviceState as DeviceState } from '../states/DeviceState';
import { useLiveAudienceState as LiveAudienceState } from '../states/LiveAudienceState';
import { useLiveMonitorState as LiveMonitorState } from '../states/LiveMonitorState';
import { useLiveSeatState as LiveSeatState } from '../states/LiveSeatState';
import { useLiveState as LiveState } from '../states/LiveState';
import { useRoomState as RoomState } from '../states/RoomState';
import { useUserState as UserState } from '../states/UserState';
import { useVideoMixerState as VideoMixerState } from '../states/VideoMixerState';
import { useBattleState  } from '../states/BattleState';
import { useRoomEngine as RoomEngine } from '../hooks/useRoomEngine';

import RTCLoginServer from './server';

RTCLoginServer.getInstance().init();

const BarrageList = BarrageListComponent;
const BarrageInput = BarrageInputComponent;
const LiveCoreView = LiveCoreViewComponent;
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
const StreamView = StreamViewComponent;
const AudioSetting = AudioSettingComponent;
const VideoSetting = VideoSettingComponent;

const useBarrageListState = BarrageListState;
const useLiveMonitorState = LiveMonitorState;
const useLiveSeatState = LiveSeatState;
const useLiveState = LiveState;
const useUserState = UserState;
const useCoGuestState = CoGuestState;
const useCoHostState = CoHostState;
const useDeviceState = DeviceState;
const useLiveAudienceState = LiveAudienceState;
const useRoomState = RoomState;
const useVideoMixerState = VideoMixerState;
const useRoomEngine = RoomEngine;

export {
  // Components
  BarrageList,
  BarrageInput,
  LiveCoreView,
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
  StreamView,
  AudioSetting,
  VideoSetting,

  // States
  useRoomEngine,
  useLiveState,
  useRoomState,
  useUserState,
  useDeviceState,
  useVideoMixerState,
  useLiveSeatState,
  useCoGuestState,
  useCoHostState,
  useLiveAudienceState,
  useLiveMonitorState,
  useBarrageListState,
  useBattleState,
};
