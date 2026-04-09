<script setup lang="ts">
import { ref } from 'vue';
import { UIKitProvider } from '@tencentcloud/uikit-base-component-vue3';
import { medicalLanguageResources } from './locales';
import Login from './components/Login.vue';
import MedicalChat from './MedicalChat.vue';

const MEDICAL_THEME = { themeStyle: 'light', primaryColor: '#2ba471' };

const isLoggedIn = ref(false);
const currentLanguage = ref('zh-CN');

const handleLoginSuccess = () => {
  isLoggedIn.value = true;
};

const handleLanguageChange = (lng: string) => {
  currentLanguage.value = lng;
};
</script>

<template>
  <UIKitProvider :theme="MEDICAL_THEME" :language-resources="medicalLanguageResources" :language="currentLanguage">
    <Login v-if="!isLoggedIn" @success="handleLoginSuccess" @language-change="handleLanguageChange" />
    <MedicalChat v-else />
  </UIKitProvider>
</template>
