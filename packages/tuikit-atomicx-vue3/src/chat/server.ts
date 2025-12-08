import type { Ref } from 'vue';
import { ref } from 'vue';
import TUIChatEngine from '@tencentcloud/chat-uikit-engine';
import TUICore, { TUILogin, TUIConstants } from '@tencentcloud/tui-core';
import { useLoginState } from '../states/LoginState';
import { ChatSceneType, useStatistical } from '../statistical';
import { isPC } from '../utils';

const { setChatScene } = useStatistical();

export default class ChatLoginServer {
  static instance: ChatLoginServer;
  private isReady = false;
  private isEngineLoggingIn = false;
  public isLogin: Ref<boolean> = ref(false);
  private resolveList: any[] = [];
  private rejectList: any[] = [];

  constructor() {
    this.init();
  }

  static getInstance() {
    if (!ChatLoginServer.instance) {
      ChatLoginServer.instance = new ChatLoginServer();
    }
    return ChatLoginServer.instance;
  }

  public init() {
    setChatScene(isPC ? ChatSceneType.CHAT_WEB : ChatSceneType.CHAT_H5);
    if (!this.isReady) {
      this.isReady = true;
      TUICore.registerEvent(
        TUIConstants.TUILogin.EVENT.LOGIN_STATE_CHANGED,
        TUIConstants.TUILogin.EVENT_SUB_KEY.USER_LOGIN_SUCCESS,
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
    const {
      chat,
      SDKAppID,
      userID,
      userSig,
    } = TUILogin.getContext();

    if (this.isEngineLoggingIn) {
      return new Promise((resolve, reject) => {
        this.resolveList.push(resolve);
        this.rejectList.push(reject);
      });
    }

    try {
      this.isEngineLoggingIn = true;
      const res = await TUIChatEngine.login({
        chat,
        SDKAppID,
        userID,
        userSig,
      });
      this.isLogin.value = true;
      this.resolveList.forEach((resolve) => {
        resolve();
      });
      this.rejectList = [];
      this.resolveList = [];
      const { loginUserInfo } = useLoginState();
      const result = await chat.getUserProfile({ userIDList: [userID] });
      const localUserInfo = result.data[0];
      if (!localUserInfo.value) {
        loginUserInfo.value = {
          userId: localUserInfo.userID,
          userName: localUserInfo.nick,
          avatarUrl: localUserInfo.avatar,
          customInfo: localUserInfo.profileCustomField,
        };
      }
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
    this.isLogin.value = false;
    this.isEngineLoggingIn = false;
  }
}
