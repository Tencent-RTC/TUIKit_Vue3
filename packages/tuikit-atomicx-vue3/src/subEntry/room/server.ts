import type { Ref } from 'vue';
import { ref } from 'vue';
import TUIChatEngine from '@tencentcloud/chat-uikit-engine-lite';
import TUICore, { TUILogin, TUIConstants } from '@tencentcloud/tui-core-lite';
import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';
import { dataReport, MetricsKey } from '../../report';
import { isMobile } from '../../utils';
import { waitForLogin } from '../../utils/loginCoordinator';

export default class RTCLoginServer {
  private static instance: RTCLoginServer;
  private isReady = false;
  private isEngineLoggingIn = false;
  public isLogin: Ref<boolean> = ref(false);
  private resolveList: any[] = [];
  private rejectList: any[] = [];

  constructor() {
    this.init();
  }

  static getInstance() {
    if (!RTCLoginServer.instance) {
      RTCLoginServer.instance = new RTCLoginServer();
    }
    return RTCLoginServer.instance;
  }

  public init() {
    if (!this.isReady) {
      this.isReady = true;
      TUICore.registerEvent(
        TUIConstants.TUILogin.EVENT.LOGIN_STATE_CHANGED,
        TUIConstants.TUILogin.EVENT_SUB_KEY.USER_LOGIN_SUCCESS,
        this,
      );
      TUICore.registerEvent(
        TUIConstants.TUILogin.EVENT.LOGIN_STATE_CHANGED,
        TUIConstants.TUILogin.EVENT_SUB_KEY.USER_LOGOUT_SUCCESS,
        this,
      );
    }
  }

  /**
   * @param { TUIInitParam } params
   */
  public onNotifyEvent(eventName: string, subKey: string) {
    if (eventName === TUIConstants.TUILogin.EVENT.LOGIN_STATE_CHANGED) {
      switch (subKey) {
        case TUIConstants.TUILogin.EVENT_SUB_KEY.USER_LOGIN_SUCCESS:
          this.login();
          break;
        case TUIConstants.TUILogin.EVENT_SUB_KEY.USER_LOGOUT_SUCCESS:
          this.logout();
          break;
        default:
          break;
      }
    }
  }

  public async login() {
    await waitForLogin();
    const {
      chat,
      SDKAppID,
      userID,
      userSig,
    } = TUILogin.getContext();
    if (!SDKAppID || !userID || !userSig) {
      throw new Error('Please login firstly by useLoginState');
    }
    if (this.isEngineLoggingIn) {
      return new Promise((resolve, reject) => {
        this.resolveList.push(resolve);
        this.rejectList.push(reject);
      });
    }

    try {
      this.isEngineLoggingIn = true;
      const metricsKey = !isMobile ? MetricsKey.T_METRICS_STATE_API_LOGIN_COUNT : MetricsKey.T_METRICS_STATE_API_LOGIN_MOBILE_COUNT;
      dataReport.reportCount(metricsKey);
      await TUIChatEngine.login({
        chat,
        SDKAppID,
        userID,
        userSig,
      }).catch((error: any) => {
        // Ignore error code 2025 (duplicate login), allow subsequent code to continue
        if (error?.code === 2025) {
          return;
        }
        throw error;
      });
      const res = await TUIRoomEngine.login({
        sdkAppId: SDKAppID,
        userId: userID,
        userSig,
        tim: chat,
      });
      this.isLogin.value = true;
      this.resolveList.forEach((resolve) => {
        resolve();
      });
      this.rejectList = [];
      this.resolveList = [];
      return res;
    } catch (error) {
      this.rejectList.forEach((reject) => {
        reject(error);
      });
      this.rejectList = [];
      this.resolveList = [];
      throw error;
    } finally {
      this.isEngineLoggingIn = false;
    }
  }

  public logout() {
    TUIRoomEngine.logout();
    this.isLogin.value = false;
    this.isEngineLoggingIn = false;
  }
}
