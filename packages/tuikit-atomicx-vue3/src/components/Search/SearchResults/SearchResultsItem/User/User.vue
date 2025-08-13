<!-- eslint-disable import/extensions -->
<template>
  <div :class="$style.SearchUser" @click="handleClick">
    <div :class="$style['SearchUser__avatar']">
      <Avatar :src="profile?.avatar" :alt="profile?.nick || profile?.userID" />
    </div>
    <div :class="$style['SearchUser__profile']">
      <div
        :class="$style['SearchUser__nickname']"
        v-html="highlightText(profile?.nick || profile?.userID, keyword, $style['SearchUser__highlight'])"
      ></div>
      <div
        v-if="profile?.selfSignature"
        :class="$style['SearchUser__signature']"
        v-html="highlightText(profile?.selfSignature, keyword, $style['SearchUser__highlight'])"
      ></div>
      <div v-else :class="$style['SearchUser__signature']">
        {{ getGenderText(profile?.gender as string) }}
        &nbsp;
        {{ profile?.birthday && `${birthdayToAge(profile?.birthday)}${t('Search.filter.age.yearsOld')}` }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, defineProps } from 'vue';
import TUIChatEngine from '@tencentcloud/chat-uikit-engine';
import { SearchType } from '../../../../../types/engine';
import type { ResultItemProps } from '../../../../../types/search';
import { Avatar } from '../../../../Avatar';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { highlightText } from '../utils';

const { t } = useUIKit();

const birthdayToAge = (birthday: number): number => {
  const today = new Date();
  const birthDate = new Date(birthday);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age = age - 1;
  }

  return age;
};

const props = defineProps<ResultItemProps<SearchType.USER>>();

const profile = computed(() => props.data.profile);

const getGenderText = (gender: string) => {
  switch (gender) {
    case TUIChatEngine.TYPES.GENDER_MALE:
      return t('Search.filter.gender.male');
    case TUIChatEngine.TYPES.GENDER_FEMALE:
      return t('Search.filter.gender.female');
    default:
      return t('Search.filter.gender.secret');
  }
};

const handleClick = () => {
  props.onClick?.(props.data, SearchType.USER);
};
</script>

<style lang="scss" module>
@import './User.scss';
</style>
