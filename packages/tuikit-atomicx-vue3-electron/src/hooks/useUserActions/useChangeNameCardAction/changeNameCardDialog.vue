<template>
  <tui-dialog
    v-model="isShowDialog"
    :title="t('ParticipantList.ChangeName')"
    :modal="true"
    width="480px"
    :before-close="handleCancel"
    :close-on-click-modal="true"
    :append-to-room-container="true"
  >
    <div class="dialog-content">
      <tui-input
        :model-value="inputUserName"
        @input="inputUserName = $event"
        class="dialog-input"
        :placeholder="t('ParticipantList.InputUserName')"
      />
    </div>
    <template #footer>
      <TUIButton
        type="primary"
        style="min-width: 88px"
        @click="handleConfirm"
        :disabled="isConfirmButtonDisable"
      >
        {{ t('ParticipantList.Confirm') }}
      </TUIButton>
      <TUIButton style="min-width: 88px" @click="handleCancel">
        {{ t('ParticipantList.Cancel') }}
      </TUIButton>
    </template>
  </tui-dialog>
</template>

<script setup lang="ts">
import { ref, defineProps, computed } from 'vue';
import TuiDialog from '../../../baseComp/Dialog';
import TuiInput from '../../../baseComp/Input';
import { TUIButton, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { UserInfo } from '../../../types';

interface Props {
  userInfo: UserInfo;
  confirmFunction: (name: string) => void;
}

const props = defineProps<Props>();
const { t } = useUIKit();

const inputUserName = ref(props.userInfo.nameCard);
const isShowDialog = ref(true);
const isConfirmButtonDisable = computed(() => !inputUserName.value.trim());

async function handleConfirm() {
  await props.confirmFunction(inputUserName.value);
  isShowDialog.value = false;
}

function handleCancel() {
  inputUserName.value =
    props.userInfo.nameCard || props.userInfo.userName || '';
  isShowDialog.value = false;
}
</script>

<style lang="scss" scoped>
.dialog-content {
  display: flex;
  align-items: center;

  .dialog-input {
    flex-grow: 1;
  }
}
</style>
