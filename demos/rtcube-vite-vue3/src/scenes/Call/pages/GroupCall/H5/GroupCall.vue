<template>
  <div class="group-call-h5">
    <div class="header">
      <Icon :src="LeftArrowSrc" @click="goBack"/>
      <p> {{ t('Group Call') }} </p>
    </div>
    <div class="content">
      <div class="title-panel">
        <span> {{ t('Group Members') }} </span>
        <span> 
          {{`(${groupCallMember.length + 1} ${t('people')} / 9 ${t('people')}) `}}
        </span>
      </div>
      <div class="member-box">
        <div :class="['card', 'you']">
          <Text :max-width="60"> {{ loginUserInfo?.userId }} </Text>
          <span> {{ `(${t('You')})` }} </span>
        </div>
        <template v-for="(item) in groupCallMember" :key="item">
        <div class="card">
          <Text :max-width="80"> {{ item }} </Text>
          <Icon
            :src="ChaSrc"
            :size="12"
            @click="() => deleteGroupCallUser(item)"
          />
        </div>
      </template>
      </div>
      <p class="line"></p>
      <Input
        class="call-input"
        v-model="inputUserID"
        :placeholder="placeholderText"
        @input="handleInputUserID"
        @keyup="handleAddGroupCallMember"
      >
        <template #append>
          <span class="add-btn" @click="handleAddGroupCallMember" > {{ t('Add') }} </span>
        </template>
      </Input>
    </div>
    <div
      class="call-btn"
      @click="handleGroupCall"
    > 
      {{ t('Initiate Group Call') }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useLoginState } from '@tencentcloud/chat-uikit-vue3';
import { useLanguage } from '../../../hooks';
import useGroupCall from '../useGroupCall';
import Text from '../../../components/common/Text/Text.vue';
import Icon from '../../../components/common/Icon/Icon.vue';
import Input from '../../../components/common/Input/Input.vue';
import LeftArrowSrc from '../../../assets/Call/left-arrow.svg';
import ChaSrc from '../../../assets/GroupCall/cha.svg';

const { t } = useLanguage();
const { loginUserInfo } = useLoginState();
const inputUserID = ref('');
const groupCallMember = ref<string[]>([]);
const { groupCall, inputUserIDHandler, addGroupCallMemberHandler, deleteGroupCallUserHandler } = useGroupCall();

const emit = defineEmits(['back']);

const placeholderText = computed(() => {
  return t('input userID to Add');
})

const goBack = () => {
  emit('back');
}

const handleGroupCall = async () => {
  await groupCall(groupCallMember);
}
const handleInputUserID = () => {
  inputUserIDHandler(inputUserID);
}
const handleAddGroupCallMember = () => {
  addGroupCallMemberHandler(inputUserID, groupCallMember);
}
const deleteGroupCallUser = (userID: string) => {
  deleteGroupCallUserHandler(userID, groupCallMember);
}

</script>

<style lang="scss" scoped>
.group-call-h5 {
  width: 100%;
  height: 100%;
  background: #f8f9fb;
  display: flex;
  flex-direction: column;
  align-items: center;

  .header {
    box-sizing: border-box;
    width: 100%;
    height: 54px;
    padding: 0 16px;
    background: #FFFFFF;
    display: flex;
    align-items: center;

    img {
      cursor: pointer;
    }

    p {
      margin: 0 auto;
      font-weight: 600;
      font-size: 16px;
    }
  }

  .content {
    box-sizing: border-box;
    width: 343px;
    padding: 20px;
    margin: 19px 0px;
    background: #FFFFFF;
    border-radius: 6px;
  
    .title-panel {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
    }

    .member-box {
      margin-top: 17px;
      display: flex;
      gap: 4px;
      flex-wrap: wrap;

      .card {
        box-sizing: border-box;
        width: 98px;
        height: 30px;
        padding: 4px 6px;
        background: #F2F5FC;
        border-radius: 8px;
        font-weight: 400;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .you {
        color: #727A8A;
      }
    }

    .line {
      height: 0px;
      margin: 20px 0px;
      border: 1px solid rgba(79, 88, 107, 0.2);
    }

    .add-btn {
      font-weight: 500;
      font-size: 16px;
      color: #0567FB;
      cursor: pointer;
    }
  }

  .call-btn {
    width: 347px;
    height: 46px;
    margin: 0 auto;
    background: linear-gradient(315deg, #006EFF 0%, #0C59F2 98.81%);
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
    border-radius: 10px;
    font-weight: 500;
    font-size: 16px;
    line-height: 46px;
    text-align: center;
    color: #FFFFFF;
    cursor: pointer;
  }
}
</style>
