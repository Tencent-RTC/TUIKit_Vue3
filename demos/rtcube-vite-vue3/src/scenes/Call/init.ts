import { TUICallKitServer } from '@tencentcloud/call-uikit-vue';
class CallInitServer {
  static instance: CallInitServer;
  public isReady: boolean = false;

  constructor() {}

  static getInstance() {
    if (!CallInitServer.instance) {
      CallInitServer.instance = new CallInitServer();
    }
    return CallInitServer.instance;
  }

  public async init(userInfo: { userID: string; userSig: string; SDKAppID: number }) {
    try {
      await TUICallKitServer.init({
        userID: userInfo.userID,
        userSig: userInfo.userSig,
        SDKAppID: userInfo.SDKAppID,
      });
      this.isReady = true;
    } catch (error) {
      console.error('Failed to initialize call:', error);
    }
  }

  public async logout() {
    try {
      await TUICallKitServer.destroyed();
      this.isReady = false;
    } catch (error) {
      console.error('Failed to logout from call:', error);
    }
  }
}

export default CallInitServer.getInstance();
