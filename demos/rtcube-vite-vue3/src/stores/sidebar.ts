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
      consolePanel: {
        isShow: true,
        url: "https://console.cloud.tencent.com/trtc",
      },
    },
    roomkit: {
      src: [
        {
          nameKey: "sidebar.docs.productIntro",
          name: "产品简介",
          url: "https://cloud.tencent.com/document/product/647/81959",
        },
        {
          nameKey: "sidebar.docs.quickStart",
          name: "快速接入",
          url: "https://cloud.tencent.com/document/product/647/81962",
        },
        {
          nameKey: "sidebar.docs.apiReference",
          name: "API参考",
          url: "https://cloud.tencent.com/document/product/647/81969",
        },
        {
          nameKey: "sidebar.docs.faq",
          name: "常见问题",
          url: "https://cloud.tencent.com/document/product/647/81977",
        }
      ],
      consolePanel: {
        isShow: true,
        url: "https://console.cloud.tencent.com/trtc",
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
          nameKey: "sidebar.docs.apiReference",
          name: "API参考",
          url: "https://cloud.tencent.com/document/product/647/124656",
        }
      ],
      consolePanel: {
        isShow: true,
        url: "https://console.cloud.tencent.com/trtc",
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
