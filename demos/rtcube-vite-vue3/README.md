# RTCube

[简体中文](./README_ZH.md) | English

RTCube is a sample project demonstrating multi-product capabilities in TencentCloud RTC scenarios, including sample code for products like Chat. You can quickly experience multi-product capabilities in RTC scenarios and use it as a reference for integration.

## 🚀 Recommended: AI Integration Assistant

We provide a brand-new AI integration approach. If you don't need the complete Demo project and just want to get started quickly with integration, we recommend using our more efficient AI Integration Assistant. Simply describe your requirements, and it will automatically generate integration code, significantly improving development efficiency.</br>

[Click here to experience AI Integration](https://trtc.io/document/72277?product=chat&menulabel=uikit&platform=react)

## Directory Structure

RTCube currently includes the following pages:

- `src/pages/Home`: Home page, providing product introduction and entry points to various scenarios.
- `src/pages/stages`: Stages page, displaying various RTCube scenarios, currently including the Chat scenario.
- `src/pages/login`: Login page, for logging into RTCube, currently supporting login via UserID\SDKAppID\SecretKey.
- `src/scenes/Chat`: Chat scenario, demonstrating the Chat product and serving as the entry point for Chat Demo code.

## Quick Start

1. Install dependencies and run the project

  ```bash
  git clone https://github.com/Tencent-RTC/TUIKit_Vue3.git
  cd ./demos/web-vite-vue3
  npm i
  npm run dev
  ```

2. Create a Tencent Cloud IM Application

  Log in to the [IM Console](https://console.trtc.io/) and create a new application (if you don't have one).

  ![Create Application](https://cloudcache.intl.tencent-cloud.com/cms/backend-cms/7ff233feab4811f0b5345254005ef0f7.png)

3. Get SDKAppID and SecretKey

  Get the SDKAppID from the SDKAppID column on the application management page.
  Get the SecretKey from the Key column on the application management page.

  ![Get SDKAppID](https://cloudcache.intl.tencent-cloud.com/cms/backend-cms/8e31513bab4811f09b75525400bf7822.png)


4. Create Users and Get userID

  Go to the user [management page](https://console.trtc.io/chat/account-management), create 2–3 test accounts for experience in C2C chat and group chat capacities.

  ![Create Users](https://cloudcache.intl.tencent-cloud.com/cms/backend-cms/27ca22a6adb411f0a68e5254001c06ec.png)

5. Get UserSig

  userSig info. Click Chat console > Development tool > userSig tool, fill in the created userID to generate userSig.

  ![Create Users](https://cloudcache.intl.tencent-cloud.com/cms/backend-cms/2f29a385c07911f0b4a7525400454e06.png)


5. Enter SDKAppID, userID, and SecretKey on the login page, then click Login.
