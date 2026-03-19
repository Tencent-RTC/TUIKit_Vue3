import { defineStore } from "pinia";

export const useSidebarStore = defineStore({
  id: "sidebar",
  state: () => ({
    callkit: {
      src: [
        {
          nameKey: "sidebar.docs.productIntro",
          name: "产品简介",
          url: "https://cloud.tencent.com/product/calling",
        },
        {
          nameKey: "sidebar.docs.quickStart",
          name: "快速接入",
          url: "https://cloud.tencent.com/document/product/647/78731",
        },
        {
          nameKey: "sidebar.docs.apiReference",
          name: "API参考",
          url: "https://cloud.tencent.com/document/product/647/78756",
        },
        {
          nameKey: "sidebar.docs.faq",
          name: "常见问题",
          url: "https://cloud.tencent.com/document/product/647/78769",
        },
      ],
      resources: {
        isShow: true,
        url: "https://console.cloud.tencent.com/vcube/project/manage?receive=1",
      },
      consolePanel: {
        isShow: false,
        url: "https://console.cloud.tencent.com/vcube/project/manage",
      },
      choose: {
        isShow: true,
        url: "https://buy.cloud.tencent.com/vcube?type=call",
      },
    },
    roomkit: {
      src: [
        {
          nameKey: "sidebar.docs.productIntro",
          name: "产品简介",
          url: "https://cloud.tencent.com/product/roomkit",
        },
        {
          nameKey: "sidebar.docs.quickStart",
          name: "快速接入",
          url: "https://cloud.tencent.com/document/product/647/81962",
        },
        {
          nameKey: "sidebar.docs.apiOverview",
          name: "API概览",
          url: "https://cloud.tencent.com/document/product/647/81969",
        },
        {
          nameKey: "sidebar.docs.faq",
          name: "常见问题",
          url: "https://cloud.tencent.com/document/product/647/81977",
        },
        {
          nameKey: "sidebar.docs.githubLink",
          name: "Github 链接",
          url: "https://github.com/tencentyun/TUIRoomKit/tree/main/Web",
        },
      ],
      resources: {
        isShow: true,
        url: "https://console.cloud.tencent.com/vcube/project/manage?receive=1",
      },
    },
    live: {
      src: [
        {
          nameKey: "sidebar.docs.productIntro",
          name: "产品简介",
          url: "https://cloud.tencent.com/document/product/647/105438",
        },
        {
          nameKey: "sidebar.docs.quickStart",
          name: "快速接入",
          url: "https://cloud.tencent.com/document/product/647/113798",
        },
        {
          nameKey: "sidebar.docs.githubLink",
          name: "Github 链接",
          url: "https://github.com/Tencent-RTC/TUILiveKit/tree/main/Web/web-vite-vue3",
        },
      ],
      resources: {
        isShow: true,
        url: "https://console.cloud.tencent.com/trtc?type=create&scene=live",
      },
      consolePanel: {
        isShow: false,
        url: "https://console.cloud.tencent.com/im",
      },
    },
    chatkit: {
      src: [
        {
          nameKey: "sidebar.docs.productIntro",
          name: "产品简介",
          url: "https://cloud.tencent.com/product/im",
        },
        {
          nameKey: "sidebar.docs.quickStart",
          name: "快速接入",
          url: "https://cloud.tencent.com/document/product/269/123276",
        },
        {
          nameKey: "sidebar.docs.apiReference",
          name: "API参考",
          url: "https://cloud.tencent.com/document/product/269/37411",
        },
      ],
      consolePanel: {
        isShow: true,
        url: "https://console.cloud.tencent.com/im",
      },
      choose: {
        isShow: true,
        url: "https://cloud.tencent.com/act/pro/imnew?from=16262",
      },
    },
  }),
});
