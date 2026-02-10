import { TRTCVideoFillMode, TRTCVideoMirrorType, TRTCVideoRotation, TUIVideoStreamType } from '@tencentcloud/tuiroom-engine-js';
import { useRoomEngine } from '../../../hooks/useRoomEngine';
import { useLoginState } from '../../../states/LoginState';

const roomEngine = useRoomEngine();
const { loginUserInfo } = useLoginState();

type PlayerRect = {
  left: string;
  top: string;
  width: string;
  height: string;
  zIndex: number;
};

export default class RTCStreamPlayer {
  private userId: string;
  private streamType: TUIVideoStreamType;
  private container: HTMLElement;
  private view: HTMLElement;
  private rect: PlayerRect | null = null;
  private isVideoPlaying = false;

  constructor(options: { userId: string; streamType: TUIVideoStreamType; container: HTMLElement; rect?: PlayerRect }) {
    const { userId, streamType, container, rect } = options;
    this.userId = userId;
    this.streamType = streamType;
    this.container = container;
    if (rect) {
      this.rect = rect;
    }
    this.createRtcStreamView();
  }

  private createRtcStreamView() {
    const view = document.createElement('div');
    view.id = `rtc_stream_view_${this.userId}_${this.streamType}_${Math.floor(Math.random() * 1000000)}`;
    view.style.position = 'absolute';
    if (this.rect) {
      view.style.width = this.rect.width;
      view.style.height = this.rect.height;
      view.style.top = this.rect.top;
      view.style.left = this.rect.left;
      view.style.zIndex = this.rect.zIndex.toString();
    }
    this.container.appendChild(view);
    this.view = view;
  }

  public updateRect(rect: PlayerRect) {
    console.log('RTCStreamPlayer.updateRect', rect);
    this.rect = rect;
    this.view.style.width = this.rect.width;
    this.view.style.height = this.rect.height;
    this.view.style.top = this.rect.top;
    this.view.style.left = this.rect.left;
    this.view.style.zIndex = this.rect.zIndex.toString();
  }

  public async play() {
    console.log('RTCStreamPlayer.play', this.isVideoPlaying, this.view);
    if (this.isVideoPlaying) {
      return;
    }
    if (this.userId === loginUserInfo.value?.userId && this.streamType === TUIVideoStreamType.kCameraStream) {
      await roomEngine.instance?.setLocalVideoView({
        streamType: this.streamType,
        view: this.view.id,
      });
      this.isVideoPlaying = true;
    } else {
      await roomEngine.instance?.setRemoteVideoView({
        userId: this.userId,
        streamType: this.streamType,
        view: this.view.id,
      });
      const trtcCloud = roomEngine.instance?.getTRTCCloud();
      await trtcCloud?.setRemoteRenderParams(this.userId, this.streamType, {
        mirrorType: TRTCVideoMirrorType.TRTCVideoMirrorType_Disable,
        rotation: TRTCVideoRotation.TRTCVideoRotation0,
        fillMode: TRTCVideoFillMode.TRTCVideoFillMode_Fill,
      });
      await roomEngine.instance?.startPlayRemoteVideo({
        userId: this.userId,
        streamType: this.streamType,
      });
      this.isVideoPlaying = true;
    }
  }

  public async stop() {
    console.log('RTCStreamPlayer.stop');
    if (!this.isVideoPlaying) {
      return;
    }
    if (this.userId === loginUserInfo.value?.userId) {
      await roomEngine.instance?.setLocalVideoView({ view: null });
    } else {
      await roomEngine.instance?.stopPlayRemoteVideo({
        userId: this.userId,
        streamType: this.streamType,
      });
    }
    this.isVideoPlaying = false;
  }

  public async destroy() {
    await this.stop();
    this.container.removeChild(this.view);
  }
}
