<template>
  <tui-select
    v-model="currentDeviceId"
    placeholder="placeholder"
    class="select"
    :disabled="disabled"
    :teleported="false"
    :popper-append-to-body="false"
    @change="handleChange"
  >
    <tui-option
      v-for="item in microphoneList"
      :key="item.deviceId"
      :label="item.deviceName"
      :value="item.deviceId"
    />
  </tui-select>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, withDefaults, onBeforeMount } from 'vue';
import TuiSelect from '../../baseComp/Select';
import TuiOption from '../../baseComp/Option';
import { useDeviceState } from '../../states/DeviceState';
import { TUIDeviceInfo } from '@tencentcloud/tuiroom-engine-js';
const { microphoneList, currentMicrophone, setCurrentMicrophone, getMicrophoneList } = useDeviceState();

interface Props {
  onChange?: (id: string) => void;
  disabled?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});
const currentDeviceId = ref(currentMicrophone.value?.deviceId);

watch(
  () => currentMicrophone.value?.deviceId,
  val => {
    if (currentDeviceId.value !== val) {
      currentDeviceId.value = val;
    }
  },
  { immediate: true }
);

async function handleChange(deviceId: string) {
  props.onChange?.(deviceId);
  try {
    await setCurrentMicrophone({ deviceId });
  } catch (error) {
    if (
      currentMicrophone.value?.deviceId &&
      microphoneList.value
        .map((item: TUIDeviceInfo) => item.deviceId)
        .includes(currentMicrophone.value?.deviceId)
    ) {
      currentDeviceId.value = currentMicrophone.value?.deviceId;
    }
  }
}

onBeforeMount(async () => {
  await getMicrophoneList();
})
</script>

<style lang="scss" scoped>
.select {
  width: 100%;
  font-size: 14px;
}
</style>
