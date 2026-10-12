import { TRTCVideoFillMode, TRTCVideoStreamType } from '@tencentcloud/tuiroom-engine-js';
import { useRoomEngine } from '../../../hooks/useRoomEngine';
import { useLoginState } from '../../../states/LoginState';
import { TUIVideoStreamType, VideoStreamType, FillMode } from '../../../types';
import { VideoStreamQuality } from './types';

const roomEngine = useRoomEngine();
const { loginUserInfo } = useLoginState();

/** TRTCCloud screen-share preview update (no public setLocalScreenView). */
type TRTCCloudScreenShareBridge = {
  _setScreenShareParams?: (params: {
    view?: string | string[] | HTMLElement | HTMLElement[] | null;
    fillMode?: 'contain' | 'cover' | 'fill';
  }) => void;
  _updateLocalScreen?: () => Promise<void>;
};

function getPictureInPictureDocument(): Document | null {
  const pictureInPicture = (
    globalThis as { documentPictureInPicture?: { window?: Window | null } }
  ).documentPictureInPicture;
  return pictureInPicture?.window?.document ?? null;
}

/** Same lookup as the engine adapter: main document first, then the PiP document. */
function resolveViewElement(token: string): HTMLElement | null {
  if (!token) {
    return null;
  }
  return document.getElementById(token)
    ?? getPictureInPictureDocument()?.getElementById(token)
    ?? null;
}

/**
 * 流播放器 - 负责视频流的播放控制
 * 职责：
 * 1. 管理视频流的播放和停止
 * 2. 处理本地和远程流的不同逻辑
 * 3. 设置视频渲染参数
 * 4. 管理流类型转换
 */
export class StreamPlayer {
  public async startPlayVideo(options: {
    userId: string;
    streamType: VideoStreamType;
    videoQuality?: VideoStreamQuality;
    viewIdList: string[];
  }): Promise<void> {
    const { userId, streamType, videoQuality, viewIdList } = options;
    if (viewIdList.length === 0) {
      console.warn(`[StreamPlayer] ${userId}_${streamType} No valid views to play video`);
      throw new Error(`[StreamPlayer] ${userId}_${streamType} No valid views to play video`);
    }

    try {
      const playStreamType = this.getPlayStreamType(streamType, videoQuality);
      if (userId === loginUserInfo.value?.userId) {
        if (playStreamType === TUIVideoStreamType.kCameraStream || playStreamType === TUIVideoStreamType.kCameraStreamLow) {
          await roomEngine.instance?.setLocalVideoView({ view: viewIdList });
        } else if (playStreamType === TUIVideoStreamType.kScreenStream) {
          await this.setLocalScreenView(viewIdList);
          console.log(`[StreamPlayer] setLocalScreenView: ${userId}_${streamType}`);
        }
      } else {
        await roomEngine.instance?.setRemoteVideoView({
          userId,
          streamType: playStreamType,
          view: viewIdList,
        });
        await roomEngine.instance?.startPlayRemoteVideo({
          userId,
          streamType: playStreamType,
        });

        console.log(`[StreamPlayer] startPlayRemoteVideo: ${userId}_${streamType}, videoQuality: ${videoQuality}`);
      }
    } catch (error) {
      console.error('[StreamPlayer] startPlayVideo error:', error);
      throw error;
    }
  }

  public async stopPlayVideo(options: {
    userId: string;
    streamType: VideoStreamType;
    videoQuality?: VideoStreamQuality;
  }): Promise<void> {
    const { userId, streamType, videoQuality } = options;

    try {
      const playStreamType = this.getPlayStreamType(streamType, videoQuality);

      if (userId === loginUserInfo.value?.userId) {
        if (playStreamType === TUIVideoStreamType.kCameraStream || playStreamType === TUIVideoStreamType.kCameraStreamLow) {
          await roomEngine.instance?.setLocalVideoView({ view: null });
        } else if (playStreamType === TUIVideoStreamType.kScreenStream) {
          // Clear preview only — do not stop the active screen capture.
          await this.setLocalScreenView(null);
        }
      } else {
        await roomEngine.instance?.stopPlayRemoteVideo({
          userId,
          streamType: playStreamType,
        });
      }
    } catch (error) {
      console.error('[StreamPlayer] stopPlayVideo error:', error);
      throw error;
    }
  }

  /**
   * 更新视频视图绑定
   */
  public async updateVideoView(options: {
    userId: string;
    streamType: VideoStreamType;
    viewIdList: string[];
  }): Promise<void> {
    const { userId, streamType, viewIdList } = options;

    if (viewIdList.length === 0) {
      console.warn('[StreamPlayer] No valid views to update');
      return;
    }

    try {
      const playStreamType = this.getPlayStreamType(streamType);

      if (userId === loginUserInfo.value?.userId) {
        if (playStreamType === TUIVideoStreamType.kCameraStream || playStreamType === TUIVideoStreamType.kCameraStreamLow) {
          await roomEngine.instance?.setLocalVideoView({ view: viewIdList });
        } else if (playStreamType === TUIVideoStreamType.kScreenStream) {
          await this.setLocalScreenView(viewIdList);
        }
      } else {
        // 远程视频流
        await roomEngine.instance?.setRemoteVideoView({
          userId,
          streamType: playStreamType,
          view: viewIdList,
        });
      }

      console.log(`[StreamPlayer] 视图更新: ${userId}_${streamType}, 视图数量: ${viewIdList.length}`);
    } catch (error) {
      console.error('[StreamPlayer] updateVideoView error:', error);
      throw error;
    }
  }

  public async updateVideoQuality(options: {
    userId: string;
    streamType: VideoStreamType;
    videoQuality: VideoStreamQuality;
  }): Promise<void> {
    const { userId, streamType, videoQuality } = options;
    if (userId === loginUserInfo.value?.userId || streamType === VideoStreamType.Screen) {
      return;
    }

    const playStreamType = this.getPlayStreamType(streamType, videoQuality);
    await roomEngine.instance?.startPlayRemoteVideo({
      userId,
      streamType: playStreamType,
    });
  }

  public async setRenderParams(options: {
    userId: string;
    streamType: VideoStreamType;
    renderParams: {
      fillMode?: FillMode;
    };
  }): Promise<void> {
    const { userId, streamType, renderParams } = options;
    const trtcCloud = roomEngine.instance?.getTRTCCloud();
    const trtcStreamType = this.getTRTCStreamType(streamType);
    const fillModeMap = {
      [FillMode.Fill]: TRTCVideoFillMode.TRTCVideoFillMode_Fill,
      [FillMode.Fit]: TRTCVideoFillMode.TRTCVideoFillMode_Fit,
    };
    const fillMode = fillModeMap[renderParams.fillMode || FillMode.Fit];
    try {
      if (userId === loginUserInfo.value?.userId) {
        if (streamType === VideoStreamType.Screen) {
          // Camera setLocalRenderParams must not be applied to the screen preview.
          await this.setLocalScreenFillMode(
            renderParams.fillMode === FillMode.Fill ? 'cover' : 'contain',
          );
          return;
        }
        await trtcCloud?.setLocalRenderParams({
          fillMode,
        });
      } else {
        await trtcCloud?.setRemoteRenderParams(userId, trtcStreamType, {
          fillMode,
        });
      }
    } catch (error) {
      console.error('[StreamPlayer] setRenderParams error:', userId, streamType, error);
      throw error;
    }
  }

  /**
   * Bind or clear local screen-share preview after capture has started.
   * RoomEngine.setLocalVideoView only covers the camera path; screen preview
   * is updated through TRTCCloud private APIs today.
   *
   * REVIEW: trtcCloud should expose a public API to update screenShare preview
   * (e.g. updateLocalScreenView), then replace _setScreenShareParams / _updateLocalScreen.
   */
  private async setLocalScreenView(viewIdList: string[] | null): Promise<void> {
    const trtcCloud = roomEngine.instance?.getTRTCCloud() as TRTCCloudScreenShareBridge | undefined;
    if (!trtcCloud?._setScreenShareParams || !trtcCloud._updateLocalScreen) {
      return;
    }

    // updateScreenShare rejects a string[] (arrayItem must be HTMLElement). Resolve
    // ids the same way the engine does: main document, then the PiP document.
    const view = viewIdList
      ? viewIdList.map(resolveViewElement).filter((el): el is HTMLElement => !!el)
      : null;
    trtcCloud._setScreenShareParams({ view });
    await trtcCloud._updateLocalScreen();
  }

  private async setLocalScreenFillMode(fillMode: 'contain' | 'cover' | 'fill'): Promise<void> {
    const trtcCloud = roomEngine.instance?.getTRTCCloud() as TRTCCloudScreenShareBridge | undefined;
    if (!trtcCloud?._setScreenShareParams || !trtcCloud._updateLocalScreen) {
      return;
    }

    trtcCloud._setScreenShareParams({ fillMode });
    await trtcCloud._updateLocalScreen();
  }

  private getPlayStreamType(streamType: VideoStreamType, videoQuality?: VideoStreamQuality): TUIVideoStreamType {
    if (streamType === VideoStreamType.Screen) {
      return TUIVideoStreamType.kScreenStream;
    }
    if (videoQuality === VideoStreamQuality.LD) {
      return TUIVideoStreamType.kCameraStreamLow;
    }
    return TUIVideoStreamType.kCameraStream;
  }

  private getTRTCStreamType(streamType: VideoStreamType, videoQuality?: VideoStreamQuality): TRTCVideoStreamType {
    if (streamType === VideoStreamType.Screen) {
      return TRTCVideoStreamType.TRTCVideoStreamTypeSub;
    }
    if (videoQuality === VideoStreamQuality.LD) {
      return TRTCVideoStreamType.TRTCVideoStreamTypeSmall;
    }
    return TRTCVideoStreamType.TRTCVideoStreamTypeBig;
  }
}

export default StreamPlayer;
