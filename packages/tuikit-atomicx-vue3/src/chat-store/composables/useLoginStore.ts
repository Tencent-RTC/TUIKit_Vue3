// packages/vue3/src/composables/useLoginStore.ts
import { LoginStore } from '@atomicxcore/core';
import type { LoginState, LoginEvent, LoginParams, UserProfile, Unsubscribe } from '@atomicxcore/core';
import type { ComputedRef } from 'vue';
import { createSingletonComposable } from '../internal/createSingletonComposable';

interface LoginStoreAPI {
  loginStatus: ComputedRef<LoginState['loginStatus']>;
  loginUserInfo: ComputedRef<LoginState['loginUserInfo']>;
  login(params: LoginParams): Promise<void>;
  logout(): Promise<void>;
  setSelfInfo(profile: Partial<UserProfile>): Promise<void>;
  getChat(): any;
  onEvent(listener: (event: LoginEvent) => void): Unsubscribe;
}

const createLoginStore = createSingletonComposable(
  LoginStore,
  ['loginStatus', 'loginUserInfo'],
  ['login', 'logout', 'setSelfInfo', 'getChat', 'onEvent'],
) as () => LoginStoreAPI;

const LoginStoreVue = Object.assign(createLoginStore, {
  create: createLoginStore,
});

/** @deprecated Use LoginStore() instead */
const useLoginStore = createLoginStore;

export { LoginStoreVue as LoginStore, useLoginStore };
export type { LoginStoreAPI };
