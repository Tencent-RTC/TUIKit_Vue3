<template>
  <div class="gift-card-container">
    <div class="gift-card-content">
      <!-- User avatar -->
      <div class="user-avatar">
        <img :src="sender.avatarUrl || DEFAULT_AVATAR_URL" :alt="sender.userName" />
      </div>

      <!-- Gift info -->
      <div class="gift-info">
        <div class="user-name">{{ displayName }}</div>
        <div class="gift-action">
          {{ t("LiveGift.Send") }} {{ giftInfo.name }} x {{
            giftCount
          }}
        </div>
      </div>

      <!-- Gift image -->
      <div class="gift-image">
        <img :src="giftInfo.iconUrl" :alt="giftInfo.name" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useUIKit } from "@tencentcloud/uikit-base-component-vue3";
import type { GiftInfo, TUIUserInfo } from "@tencentcloud/tuiroom-engine-js";
import { useLoginState } from "../../../states/LoginState";

interface GiftCardProps {
  sender: TUIUserInfo;
  giftInfo: GiftInfo;
  giftCount: number;
}

const props = defineProps<GiftCardProps>();

const { t } = useUIKit();
const { loginUserInfo } = useLoginState();

const DEFAULT_AVATAR_URL = "https://qcloudimg.tencent-cloud.cn/raw/7e7e51d4692c95e965538d7f65e0faf1.jpg";

// Display "Me" if sender is current user, otherwise display sender's name
const displayName = computed(() => {
  const isMe = props.sender.userId === loginUserInfo.value?.userId;
  return isMe ? t("LiveGift.Me") : (props.sender.userName || props.sender.userId);
});
</script>

<style scoped lang="scss">
.gift-card-container {
  display: inline-flex;
  position: relative;
  width: 175px;
  height: 40px;
  padding: 4px;
  border-radius: 40px;
  background: var(--uikit-color-black-6);
  user-select: none;

  .gift-card-content {
    display: flex;
    align-items: center;
    gap: 10px;

    .user-avatar {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      margin-left: 4px;
      border-radius: 50%;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .gift-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 0;

      .user-name {
        max-width: 96px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 12px;
        font-weight: 500;
        color: var(--text-color-primary);
      }

      .gift-action {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 10px;
        color: var(--text-color-secondary);
      }
    }

    .gift-image {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      position: absolute;
      right: 0;
      width: 60px;
      height: 60px;
      transform: translate(75%, -15%);
      animation: imageSlideIn 0.4s ease-out 0.4s both;

      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }
  }
}

@keyframes imageSlideIn {
  from {
    transform: translate(-400%, -15%); // Ensure image starts off-screen (60px * 4 = 240px left offset)
  }
  to {
    transform: translate(75%, -15%);
  }
}
</style>
