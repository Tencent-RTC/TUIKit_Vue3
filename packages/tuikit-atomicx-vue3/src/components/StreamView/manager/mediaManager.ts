import TUIRoomEngine, {
  TUIRoomEvents,
  TUIChangeReason,
  TUIVideoStreamType,
  TRTCVideoStreamType,
  TRTCVideoFillMode,
  TRTCVideoMirrorType,
  TRTCVideoRotation,
  TRTCVideoResolution,
  TRTCVideoResolutionMode,
} from '@tencentcloud/tuiroom-engine-js';
import { isMobile } from '../../../utils/environment';
import useUserState from '../../../states/UserState/index';
import { innerUserStore } from '../../../states/UserState/store';
import { DeviceStatus, LiveStatus, StreamPlayStatus } from '../../../types';
import useRoomEngine from '../../../hooks/useRoomEngine';
import useLiveState from '../../../states/LiveState';
import { useVideoMixerState } from '../../../states/VideoMixerState';
import { watch } from 'vue';

const { localUser } = useUserState();
const { isVideoMixerEnabled } = useVideoMixerState();
const { localLiveStatus } = useLiveState();
const roomEngine = useRoomEngine();
const playDomMap = new Map<string, Map<HTMLElement, TUIVideoStreamType>>();

// todo: 这里退出房间之后需要清空
function setPlayDomMap(params1: {userId: string, streamType: TUIVideoStreamType}, params2: {view: HTMLElement, streamType: TUIVideoStreamType}) {
  const playDomInfo = playDomMap.get(`${params1.userId}-${params1.streamType}`);
  if (!playDomInfo) {
    playDomMap.set(`${params1.userId}-${params1.streamType}`, new Map());
  }
  playDomMap.get(`${params1.userId}-${params1.streamType}`)?.set(params2.view, params2.streamType);
}

function getPlayDomMap(params: {userId: string, streamType: TUIVideoStreamType}) {
  return playDomMap.get(`${params.userId}-${params.streamType}`);
}

watch(localLiveStatus, (newVal) => {
  if (newVal === LiveStatus.IDLE) {
    playDomMap.clear();
  }
});

function updateStreamPlayStatus(params: {userId: string, streamType: TUIVideoStreamType, playStatus: StreamPlayStatus}) {
  if (params.userId === 'local_fake_user') {
    return;
  }
  const { userId, streamType, playStatus } = params;
  const assignObj = streamType === TUIVideoStreamType.kScreenStream ? {
    screenPlayStatus: playStatus
  } : {
    cameraPlayStatus: playStatus
  }
  innerUserStore.updateUserInfo({ userId, ...assignObj })
}

interface ObserverData {
  userId: string;
  streamType: TUIVideoStreamType;
  isIntersection?: boolean;
}

export enum StreamPlayMode {
  PLAY = 'play',
  STOP = 'stop',
  PLAY_IN_VISIBLE = 'playInVisible',
}

export enum StreamPlayQuality {
  HIGH = 'high',
  LOW = 'low',
  Default = 'default',
}

export class MediaManager {
  intersectionObserver: IntersectionObserver | null = null;

  observerDataMap: Map<HTMLElement | string, ObserverData> = new Map();

  observerRoot: HTMLElement | null = null;

  constructor() {
    this.bindRoomEngineEvents();
  }

  public async startPlayVideo(options: {
    userId: string;
    streamType: TUIVideoStreamType;
    view: HTMLElement;
    observerViewInVisible: boolean;
  }) {
    const { userId, streamType, view, observerViewInVisible } = options;
    console.info(
      'MediaManager.startPlayVideo',
      userId,
      streamType,
      view,
      observerViewInVisible
    );
    // if (userId.indexOf('livekit_') !== 0) {
    //   const hasVideo =
    //     streamType === TUIVideoStreamType.kScreenStream
    //     ? getUserInfo({ userId })?.screenStatus === DeviceStatus.On
    //     : getUserInfo({ userId })?.cameraStatus === DeviceStatus.On;
    //   if (!hasVideo) {
    //     return;
    //   }
    // }
    setPlayDomMap({ userId, streamType }, { view, streamType });
    if (!observerViewInVisible) {
      await this.doStartPlayVideo({ userId, streamType });
      return;
    }

    this.initIntersectionObserver();
    this.observerDataMap.set(
      view,
      Object.assign(this.observerDataMap.get(view) || {}, {
        userId,
        streamType,
      })
    );
    this.intersectionObserver?.observe(view);

    // The dom that was playing stream A is going to play stream B.
    // At this point, the dom already exists and will no longer trigger the intersection event,
    // so when you realize it's already visible, you should play it immediately.
    if (this.observerDataMap.get(view)?.isIntersection) {
      await this.doStartPlayVideo({ userId, streamType });
    }
  }

  // If only one view wants to stop playing, update the viewList, but don't stop the stream.
  // If no view is passed in, the stream is stopped.
  public async stopPlayVideo(options: {
    userId: string;
    streamType: TUIVideoStreamType;
    view: HTMLElement;
  }) {
    const { userId, streamType, view } = options;
    console.info('MediaManager.stopPlayVideo', userId, streamType, view);
    const playDomInfo = getPlayDomMap({ userId, streamType });
    if (!playDomInfo || playDomInfo.size === 0) {
      return;
    }

    if (this.observerDataMap.get(view)) {
      this.observerDataMap.delete(view);
      this.intersectionObserver?.unobserve(view);
    }

    playDomInfo.delete(view);
    if (playDomInfo.size > 0) {
      await this.doStartPlayVideo({
        userId,
        streamType,
      });
    } else {
      await this.doStopPlayVideo(options);
    }
  }

  private initIntersectionObserver() {
    if (
      !this.intersectionObserver ||
      document.getElementById('roomContainer') !== this.observerRoot
    ) {
      const observerRoot = document.getElementById('roomContainer');
      this.intersectionObserver = new IntersectionObserver(
        this.intersectionObserverCallback.bind(this),
        {
          root: observerRoot,
          rootMargin: '0px',
        }
      );
      this.observerDataMap = new Map();
      this.observerRoot = observerRoot;
    }
  }

  private intersectionObserverCallback(entries: IntersectionObserverEntry[]) {
    entries.forEach((entry: IntersectionObserverEntry) => {
      const { isIntersecting, target } = entry;
      const observerData = this.observerDataMap.get(target as HTMLElement);
      if (!observerData) {
        return;
      }
      const { userId, streamType } = observerData;
      const playDomInfo = getPlayDomMap({ userId, streamType });
      if (!playDomInfo) {
        return;
      }
      if (isIntersecting) {
        observerData.isIntersection = true;
        if (playDomInfo && playDomInfo.size > 0) {
          this.doStartPlayVideo({ userId, streamType });
        }
      } else {
        observerData.isIntersection = false;
        const isContinuePlay = Array.from(
          playDomInfo?.keys() || []
        ).find(
          item =>
            !this.observerDataMap.get(item) ||
            this.observerDataMap.get(item)?.isIntersection
        );
        if (!isContinuePlay) {
          this.doStopPlayVideo({ userId, streamType });
        }
      }
    });
  }

  private getPlayStreamType(userId: string, streamType: TUIVideoStreamType) {
    if (streamType === TUIVideoStreamType.kScreenStream) {
      return streamType;
    }
    const playDomInfo = getPlayDomMap({ userId, streamType });
    if (playDomInfo && playDomInfo.size > 0) {
      const playStreamTypeList = Array.from(playDomInfo.values());
      if (playStreamTypeList.includes(TUIVideoStreamType.kCameraStream)) {
        return TUIVideoStreamType.kCameraStream;
      }
      return TUIVideoStreamType.kCameraStreamLow;
    }
    return streamType;
  }

  private async doStartPlayVideo(options: {
    userId: string;
    streamType: TUIVideoStreamType;
  }) {
    const { userId, streamType } = options;
    const playDomInfo = getPlayDomMap({ userId, streamType });
    if (!playDomInfo) {
      return;
    }
    const playStreamType = this.getPlayStreamType(userId, streamType);
    const viewIdList = Array.from(playDomInfo.keys()).map(item => {
      if (item instanceof HTMLElement) {
        return item?.id;
      }
      return item;
    });

    updateStreamPlayStatus({ userId, streamType, playStatus: StreamPlayStatus.Loading })
    if (userId === localUser.value?.userId) {
      if (streamType === TUIVideoStreamType.kCameraStream) {
        if (isVideoMixerEnabled.value) {
          const mediaSourceManager = roomEngine.instance?.getTRTCCloud().getMediaMixingManager();
          mediaSourceManager.setDisplayParams(document.getElementById(viewIdList[0]) as HTMLElement);
          // const publishParams = {
          //   videoEncoderParams: {
          //     videoResolution: TRTCVideoResolution.TRTCVideoResolution_1280_720,
          //     resMode: TRTCVideoResolutionMode.TRTCVideoResolutionModePortrait,
          //     videoFps: 15,
          //     videoBitrate: 3000,
          //     minVideoBitrate: 3000,
          //     enableAdjustRes: true,
          //   },
          //   canvasColor: 0xFFFF00,
          //   selectedBorderColor: 0xFFFF00,
          // }
          // await mediaSourceManager.updatePublishParams(publishParams);
        } else {
          roomEngine.instance?.setLocalVideoView({ view: viewIdList });
        }
      } else {
        // todo: 这里的逻辑需要优化
        const trtc = roomEngine.instance?.getTRTCCloud()._trtc;
        await trtc.updateScreenShare({ view: document.getElementById(viewIdList[0]) as HTMLElement });
      }
    } else {
      roomEngine.instance?.setRemoteVideoView({
        userId,
        streamType: playStreamType,
        view: viewIdList,
      });
      await this.setVideoRenderParams({ userId, streamType });
      await roomEngine.instance?.startPlayRemoteVideo({
        userId,
        streamType: playStreamType,
      });
    }
    updateStreamPlayStatus({ userId, streamType, playStatus: StreamPlayStatus.Playing })
  }

  private async setVideoRenderParams(options: {
    userId: string;
    streamType: TUIVideoStreamType;
  }) {
    const { userId, streamType } = options;
    if (userId !== localUser.value?.userId) {
      const trtcCloud = roomEngine.instance?.getTRTCCloud();
      const trtcStreamType =
        streamType === TUIVideoStreamType.kScreenStream
          ? TRTCVideoStreamType.TRTCVideoStreamTypeSub
          : TRTCVideoStreamType.TRTCVideoStreamTypeBig;
      // todo: 确认这里的 cdn 流渲染模式
      if (userId.indexOf('livekit_') === 0) {
        // await TUIRoomEngine.callExperimentalAPI(JSON.stringify({
        //   api: 'setVideoRenderMode',
        //   params: {
        //     userID: userId,
        //     mode: 'fill',
        //   },
        // }));
      } else {
        let trtcFillMode = TRTCVideoFillMode.TRTCVideoFillMode_Fit;
        // if (isMobile && streamType !== TUIVideoStreamType.kScreenStream) {
        //   trtcFillMode = TRTCVideoFillMode.TRTCVideoFillMode_Fill;
        // }
        if (streamType !== TUIVideoStreamType.kScreenStream) {
          trtcFillMode = TRTCVideoFillMode.TRTCVideoFillMode_Fill;
        }
        // todo: 这里的 trtcFillMode 需要用户来设置
        await trtcCloud?.setRemoteRenderParams(userId, trtcStreamType, {
          mirrorType: TRTCVideoMirrorType.TRTCVideoMirrorType_Disable,
          rotation: TRTCVideoRotation.TRTCVideoRotation0,
          fillMode: trtcFillMode,
        });
      }
    }
  }

  private async doStopPlayVideo(options: {
    userId: string;
    streamType: TUIVideoStreamType;
  }) {
    const { userId, streamType } = options;
    // todo: 这里需要优化, 针对合图场景做特殊处理
    if (userId === localUser.value?.userId && isVideoMixerEnabled.value) {
      return;
    }
    updateStreamPlayStatus({ userId, streamType, playStatus: StreamPlayStatus.Stopped })
    if (
      userId === localUser.value?.userId &&
      streamType === TUIVideoStreamType.kCameraStream
    ) {
      roomEngine.instance?.setLocalVideoView({ view: null });
    } else {
      await roomEngine.instance?.stopPlayRemoteVideo({
        userId,
        streamType,
      });
    }
  }

  private onUserAudioStateChanged(eventInfo: {
    userId: string;
    hasAudio: boolean;
    reason: TUIChangeReason;
  }) {
    const { userId, hasAudio, reason } = eventInfo;
    // todo: 迁移这里的逻辑
    // if (
    //   userId === this.service.basicStore.userId &&
    //   !hasAudio &&
    //   reason === TUIChangeReason.kChangedByAdmin
    // ) {
    //   this.service.emit(EventType.ROOM_NOTICE_MESSAGE, {
    //     type: 'warning',
    //     message: this.service.t('Your microphone has been turned off'),
    //     duration: MESSAGE_DURATION.NORMAL,
    //   });
    // }
  }

  private onUserVideoStateChanged = (eventInfo: {
    userId: string;
    streamType: TUIVideoStreamType;
    hasVideo: boolean;
    reason: TUIChangeReason;
  }) => {
    const { userId, streamType, hasVideo, reason } = eventInfo;

    // Handle status changes
    // todo: 这里的逻辑不应该放在这里
    // if (
    //   userId === this.service.basicStore.userId &&
    //   !hasVideo &&
    //   reason === TUIChangeReason.kChangedByAdmin
    // ) {
    //   if (streamType === TUIVideoStreamType.kCameraStream) {
    //     this.service.emit(EventType.ROOM_NOTICE_MESSAGE, {
    //       type: 'warning',
    //       message: this.service.t('Your camera has been turned off'),
    //       duration: MESSAGE_DURATION.NORMAL,
    //     });
    //   }
    //   // Host turns off screen sharing
    //   if (streamType === TUIVideoStreamType.kScreenStream) {
    //     this.service.emit(EventType.ROOM_NOTICE_MESSAGE_BOX, {
    //       title: this.service.t('Your screen sharing has been stopped'),
    //       message: this.service.t(
    //         'Your screen sharing has been stopped, Now only the host/admin can share the screen'
    //       ),
    //       confirmButtonText: this.service.t('I got it'),
    //     });
    //   }
    // }
  };

  dispose() {
    this.intersectionObserver = null;
    this.observerDataMap = new Map();
  }

  private bindRoomEngineEvents() {
    TUIRoomEngine.once('ready', () => {
      roomEngine.instance?.on(
        TUIRoomEvents.onUserVideoStateChanged,
        this.onUserVideoStateChanged.bind(this)
      );
      roomEngine.instance?.on(
        TUIRoomEvents.onUserAudioStateChanged,
        this.onUserAudioStateChanged.bind(this)
      );
    });
  }

  private unbindRoomEngineEvents() {
    roomEngine.instance?.off(
      TUIRoomEvents.onUserVideoStateChanged,
      this.onUserVideoStateChanged
    );
    roomEngine.instance?.off(
      TUIRoomEvents.onUserAudioStateChanged,
      this.onUserAudioStateChanged
    );
  }
}
