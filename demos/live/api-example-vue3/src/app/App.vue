<template>
  <UIKitProvider theme="light" :language="lang" style="height: 100%;">
  <ToastStack />
  <GlobalLiveStage />
  <GlobalCameraStage />
  <GlobalScreenShareStage />
  <div class="layout">
    <Topbar
      :role="role"
      :role-reason="roleReason"
      :is-logged-in="isLoggedIn"
      :logging-in="session.loggingIn"
      :has-joined-live="hasJoinedLive"
      :current-live-id="currentLiveId"
      :lang="lang"
      v-model:userIdInput="userIdInput"
      :user-id="loginUserInfo?.userId || ''"
      :user-display-name="userDisplayName"
      :user-avatar="userAvatar"
      :user-initial="userInitial"
      @go-home="goHome"
      @copy-live-id="copyLiveId"
      @select="select"
      @toggle-lang="toggleLang"
      @login="onLogin"
      @logout="onLogout"
      @save-profile="onSaveProfile"
    />

    <div class="body">
      <ApiMenu
        :groups="groups"
        :menu-width="menuWidth"
        :active-state="route.params.state as string"
        :active-api-id="route.params.apiId as string"
        @select="select"
        @resize-start="onResizeStart"
      />

      <main class="content">
        <GroupIntro
          v-if="selectedGroup && selectedGroup.intro"
          :key="selectedGroup.state"
          :group="selectedGroup"
        />
        <ExampleCard
          v-if="selectedExample && selectedGroup"
          :key="selectedExample.id"
          :example="selectedExample"
          :group-slug="selectedGroup.state"
        />
        <Placeholder v-else :group="selectedGroup" />
      </main>
    </div>

    <GlobalEventLogDock />
  </div>
  </UIKitProvider>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useLoginState, useLiveListState, useDeviceState, LoginStatus, LoginEvent } from 'tuikit-atomicx-vue3';
import { UIKitProvider, useUIKit, i18next } from '@tencentcloud/uikit-base-component-vue3';
import { saveLocale, getSavedLocale } from '../i18n';
import { pushToast } from '../services/toast/store';
import ExampleCard from '../lib/components/ExampleCard.vue';
import GroupIntro from '../lib/components/GroupIntro.vue';
import ToastStack from '../services/toast/ToastStack.vue';
import GlobalLiveStage from '../lib/stages/GlobalLiveStage.vue';
import GlobalCameraStage from '../lib/stages/GlobalCameraStage.vue';
import GlobalScreenShareStage from '../lib/stages/GlobalScreenShareStage.vue';
import GlobalEventLogDock from '../services/event-log/GlobalEventLogDock.vue';

import Topbar from './layout/Topbar.vue';
import ApiMenu from './layout/ApiMenu.vue';
import Placeholder from './layout/Placeholder.vue';
import { useManifest } from '../examples';
import {
  session,
  bindLoginApi,
  loginSession,
  logoutSession,
  applyQuery,
  getCachedUserId,
  getCachedRoom,
  clearCachedRoom,
  clearCachedUserId,
} from '../services/session/session';
import { installDerivedRole } from '../services/session/derivedRole';
import { clearBridgeCache } from '../services/event-log/bridge';
import type { ExampleGroup } from '../lib/types';

const route = useRoute();
const router = useRouter();

const { login, logout, setSelfInfo, loginUserInfo, loginStatus, subscribeEvent: subscribeLoginEvent, unsubscribeEvent: unsubscribeLoginEvent } = useLoginState();
bindLoginApi(login, logout);

// --- Live room state ---
// Declared early so the isLoggedIn watcher (immediate: true) can safely
// reference resetLiveState during the initial synchronous run.
const { currentLive, joinLive, leaveLive, reset: resetLiveState } = useLiveListState();

const groups = useManifest();
const { t } = useUIKit();

// --- Login state (SDK-driven) ---
const isLoggedIn = computed(() => loginStatus.value === LoginStatus.LOGINED);

watch(isLoggedIn, (loggedIn, wasLoggedIn) => {
  session.loggedIn = loggedIn;
  if (loggedIn) {
    session.userId = loginUserInfo.value?.userId || '';
  } else {
    session.userId = '';
    // Tear down the floating GlobalLiveStage UI: the SDK's logout()
    // (e.g. via the login.logout example card) doesn't emit an event
    // that clears currentLive, so the stage would otherwise stay pinned
    // with the previous liveId. resetLiveState() writes defaultLiveInfo
    // (liveId: '') into the atom, flipping hasJoinedLive to false.
    resetLiveState();
    // Clear the cached userId so a page refresh doesn't auto-relogin.
    // logoutSession() does this for the topbar path, but direct calls to
    // useLoginState().logout() bypass it.
    // Only clear on a real logout transition: the watcher runs immediately
    // during setup (loginStatus is still UNKNOWN on a cold start), and
    // clearing there would wipe the cache before onMounted's auto-restore
    // reads it — breaking the "refresh keeps you logged in" feature.
    if (wasLoggedIn) {
      clearCachedUserId();
    }
  }
}, { immediate: true });

// --- Kicked-offline / login-expired handling ---
// When the account is kicked (logged in elsewhere) or the userSig expires,
// the SDK fires these events. We clean up all local state and surface a
// toast so the operator knows why they were disconnected.
async function handleKickedOffline(): Promise<void> {
  // Leave the live room if still joined.
  if (currentLive.value?.liveId) {
    try { await leaveLive(); } catch { /* proceed */ }
  }
  // Stop camera test if active.
  const device = useDeviceState();
  if (device.isCameraTesting.value) {
    try { await device.stopCameraTest(); } catch { /* proceed */ }
  }
  // Clear cached state so a re-login doesn't auto-rejoin a stale room.
  clearCachedRoom();
  clearBridgeCache();
  pushToast({
    source: 'login',
    role: session.role,
    level: 'info',
    title: t('Login.KickedOfflineTitle', 'Account logged in elsewhere'),
    description: t('Login.KickedOfflineDesc', 'Your account has been logged in on another device. You have been disconnected.'),
  });
}

async function handleLoginExpired(): Promise<void> {
  if (currentLive.value?.liveId) {
    try { await leaveLive(); } catch { /* proceed */ }
  }
  const device = useDeviceState();
  if (device.isCameraTesting.value) {
    try { await device.stopCameraTest(); } catch { /* proceed */ }
  }
  clearCachedRoom();
  clearBridgeCache();
  pushToast({
    source: 'login',
    role: session.role,
    level: 'info',
    title: t('Login.ExpiredTitle', 'Login expired'),
    description: t('Login.ExpiredDesc', 'Your login credentials have expired. Please log in again.'),
  });
}

const userDisplayName = computed(() => loginUserInfo.value?.userName || loginUserInfo.value?.userId || '');
const userAvatar = computed(() => loginUserInfo.value?.avatarUrl || '');
const userInitial = computed(() => (userDisplayName.value || '?').slice(0, 1).toUpperCase());

const userIdInput = ref('');

const DEFAULT_AVATAR_URL = 'https://qcloudimg.tencent-cloud.cn/raw/7e7e51d4692c95e965538d7f65e0faf1.jpg';

const RANDOM_NAMES_ZH = [
  '路明非', '楚子航', '恺撒', '陈墨瞳', '诺诺', '上杉绘梨衣',
  '源稚生', '源稚女', '昂热', '芬格尔', '零', '酒德麻衣',
  '苏晓樯', '柳淼淼', '座头鲸', '诺玛', '夏弥', '耶梦加得',
  '黑王', '白王', '李雾月', '风间琉璃', '八岐大蛇', '恩慈',
];
// English persona names used when the active locale is en-US, so the
// auto-filled username stays locale-consistent instead of rendering Chinese.
const RANDOM_NAMES_EN = [
  'Luke', 'Charles', 'Caesar', 'Catherine', 'Nono', 'Erii',
  'Yuan', 'Yuanji', 'Angers', 'Finger', 'Zero', 'Mama',
  'Susie', 'Liu', 'Whale', 'Norma', 'Xia', 'Jörmungandr',
  'BlackKing', 'WhiteKing', 'Liyue', 'Glory', 'Yamata', 'Enki',
];

function randomUserName(): string {
  const pool = lang.value === 'en-US' ? RANDOM_NAMES_EN : RANDOM_NAMES_ZH;
  return pool[Math.floor(Math.random() * pool.length)];
}

async function onLogin(): Promise<void> {
  try {
    await loginSession(userIdInput.value.trim());
    try {
      await setSelfInfo({ avatarUrl: DEFAULT_AVATAR_URL, userName: randomUserName() });
    } catch { /* non-fatal */ }
  } catch {
    // The topbar and the LoginState login card call the same login
    // interface. Rather than surface the raw error here, hand the
    // attempted userId to ExampleCard (login.login) so it auto-runs the
    // login example and shows the API error in its own output area.
    session.pendingLoginUserId = userIdInput.value.trim();
    select('login', 'login');
  }
}

async function onLogout(): Promise<void> {
  if (currentLive.value?.liveId) {
    try { await leaveLive(); } catch { /* proceed */ }
  }
  const device = useDeviceState();
  if (device.isCameraTesting.value) {
    try { await device.stopCameraTest(); } catch { /* proceed */ }
  }
  await logoutSession();
  clearCachedRoom();
  clearBridgeCache();
}

async function onSaveProfile(payload: { userName: string; avatarUrl: string }): Promise<void> {
  try {
    await setSelfInfo({
      userName: payload.userName,
      avatarUrl: payload.avatarUrl,
    });
  } catch { /* non-fatal */ }
}

// --- Language ---
// Seed from the persisted choice so a refresh keeps the selected language.
// Falls back to 'zh-CN' when nothing was saved (matches the SDK default).
// The value is bound to <UIKitProvider :language>, whose mount/browser
// default would otherwise override the saved locale.
const lang = ref(getSavedLocale() ?? 'zh-CN');
const unsubscribeLang: (() => void) | undefined = i18next.on('languageChanged', (lng: string) => {
  if (lng === 'en-US' || lng === 'zh-CN') {
    lang.value = lng;
  }
}) as (() => void) | undefined;
onBeforeUnmount(() => {
  unsubscribeLang?.();
  unsubscribeLoginEvent(LoginEvent.onKickedOffline, handleKickedOffline);
  unsubscribeLoginEvent(LoginEvent.onLoginExpired, handleLoginExpired);
});

function toggleLang(): void {
  const next = lang.value === 'zh-CN' ? 'en-US' : 'zh-CN';
  // Update the ref; <UIKitProvider> watches it and calls changeLanguage.
  lang.value = next;
  saveLocale(next);
}

// --- Role derivation ---
const { role: derivedRole, reason: roleReason } = installDerivedRole();
const role = derivedRole;

// --- Live room state (derived) ---
const currentLiveId = computed(() => currentLive.value?.liveId || '');
const hasJoinedLive = computed(() => !!currentLiveId.value);

async function copyLiveId(): Promise<void> {
  const id = currentLiveId.value;
  if (!id) return;
  try {
    await navigator.clipboard.writeText(id);
    pushToast({ source: 'live-list', role: session.role, level: 'success', title: t('Common.CopyLiveIdSuccess'), description: id });
  } catch {
    pushToast({ source: 'live-list', role: session.role, level: 'info', title: t('Common.CopyLiveIdFailed') });
  }
}

// --- Menu width (resizable, persisted) ---
const MENU_WIDTH_KEY = 'live-demo:menuWidth';
const MENU_MIN = 240;
const MENU_MAX = 520;
const menuWidth = ref(Number(localStorage.getItem(MENU_WIDTH_KEY)) || 340);

function onResizeStart(e: MouseEvent): void {
  e.preventDefault();
  const startX = e.clientX;
  const startWidth = menuWidth.value;
  const onMove = (ev: MouseEvent): void => {
    const next = Math.max(MENU_MIN, Math.min(MENU_MAX, startWidth + ev.clientX - startX));
    menuWidth.value = next;
  };
  const onUp = (): void => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.body.classList.remove('is-resizing-menu');
    localStorage.setItem(MENU_WIDTH_KEY, String(menuWidth.value));
  };
  document.body.classList.add('is-resizing-menu');
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

// --- Routing ---
const selectedGroup = computed<ExampleGroup | undefined>(() =>
  groups.find(g => g.state === route.params.state),
);

const selectedExample = computed(() => {
  const group = selectedGroup.value;
  if (!group || group.pending) return undefined;
  return group.examples.find(ex => ex.api === route.params.apiId);
});

function select(state: string, api: string): void {
  router.push({ name: 'example', params: { state, apiId: api } });
}

function goHome(): void {
  router.push({ name: 'example', params: { state: '', apiId: '' } });
}

// --- On mount: restore login + room ---
onMounted(async () => {
  // Subscribe to kicked-offline / login-expired events before any login
  // attempt so we never miss the event if the kick arrives during the
  // restore-login async window below.
  subscribeLoginEvent(LoginEvent.onKickedOffline, handleKickedOffline);
  subscribeLoginEvent(LoginEvent.onLoginExpired, handleLoginExpired);

  applyQuery(route.query as Record<string, unknown>);
  const apiId = route.query.apiId;
  if (typeof apiId === 'string' && apiId.includes('.')) {
    const [state, api] = apiId.split('.');
    select(state, api);
  }
  const restoreUserId =
    (typeof route.query.userId === 'string' && route.query.userId) || getCachedUserId();
  if (restoreUserId && !isLoggedIn.value) {
    userIdInput.value = restoreUserId;
    try { await loginSession(restoreUserId); } catch { /* error */ }
  }
  const cachedRoom = getCachedRoom();
  if (cachedRoom && isLoggedIn.value && !currentLive.value?.liveId) {
    try { await joinLive({ liveId: cachedRoom.liveId }); }
    catch { clearCachedRoom(); }
  }
});
</script>

<style lang="scss" scoped>
// Layout shell styles — scoped to App.vue (the only consumer).
// Global body manipulation rules live in global.scss.
.layout {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.body {
  display: flex;
  flex: 1;
  min-height: 0;
  // Reserve space for the Event Log dock's collapsed strip (32px).
  // The dock is absolutely positioned so it doesn't participate in
  // flex layout — without this padding the content would be hidden
  // behind the strip.
  padding-bottom: 32px;
}

.content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  scrollbar-gutter: stable;
}
</style>
