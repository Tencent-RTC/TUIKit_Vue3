import { TRTCVideoFillMode, TRTCVideoMirrorType, TRTCVideoRotation } from '@tencentcloud/tuiroom-engine-js';
import { useRoomEngine } from '../../../hooks/useRoomEngine';
import { useLoginState } from '../../../states/LoginState';
import { TUIVideoStreamType, VideoStreamType, FillMode } from '../../../types';
import { VideoStreamQuality } from './types';

const roomEngine = useRoomEngine();
const { loginUserInfo } = useLoginState();

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
      console.warn('[StreamPlayer] No valid views to play video');
      return;
    }

    try {
      const playStreamType = this.getPlayStreamType(streamType, videoQuality);
      if (userId === loginUserInfo.value?.userId && playStreamType !== TUIVideoStreamType.kScreenStream) {
        await roomEngine.instance?.setLocalVideoView({ view: viewIdList });
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

        console.log(`[StreamPlayer] startPlayRemoteVideo: ${userId}_${streamType}, videoQuality: ${videoQuality || 'HD'}`);
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

      if (userId === loginUserInfo.value?.userId && playStreamType === TUIVideoStreamType.kCameraStream) {
        await roomEngine.instance?.setLocalVideoView({ view: null });
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

      if (userId === loginUserInfo.value?.userId && playStreamType !== TUIVideoStreamType.kScreenStream) {
        // 本地视频流
        await roomEngine.instance?.setLocalVideoView({ view: viewIdList });
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
    const trtcStreamType = this.getPlayStreamType(streamType);
    const fillModeMap = {
      [FillMode.Fill]: TRTCVideoFillMode.TRTCVideoFillMode_Fill,
      [FillMode.Fit]: TRTCVideoFillMode.TRTCVideoFillMode_Fit,
    };
    const fillMode = fillModeMap[renderParams.fillMode || FillMode.Fit];
    try {
      if (userId === loginUserInfo.value?.userId) {
        await trtcCloud?.setLocalRenderParams({
          mirrorType: TRTCVideoMirrorType.TRTCVideoMirrorType_Auto,
          rotation: TRTCVideoRotation.TRTCVideoRotation0,
          fillMode,
        });
      } else {
        await trtcCloud?.setRemoteRenderParams(userId, trtcStreamType, {
          mirrorType: TRTCVideoMirrorType.TRTCVideoMirrorType_Auto,
          rotation: TRTCVideoRotation.TRTCVideoRotation0,
          fillMode,
        });
      }
    } catch (error) {
      console.error('[StreamPlayer] setRenderParams error:', error);
      throw error;
    }
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
}

export default StreamPlayer;
