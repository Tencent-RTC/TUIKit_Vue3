import {
  useLoginState,
  LoginEvent,
  LoginStatus,
} from 'tuikit-atomicx-vue3';
import { useEventLogSubscription } from '../services/event-log/useSubscription';
import { useDemoHandlerToggle } from '../services/event-log/useDemoHandlerToggle';
import { buildSubscriptionCards } from '../services/event-log/buildSubscriptionCards';
import type { ExampleGroup, StateViewDef } from '../lib/types';
import { ALL_ROLES } from '../lib/types';
import { SDKAppID, genTestUserSig } from '../services/session/env';

/**
 * 6.0 useLoginState —— Login and user profile.
 *
 * Manages the login state (loginUserInfo / loginStatus), login / logout
 * actions, setSelfInfo for updating the profile, and login events
 * (credential expired / kicked offline).
 *
 * Note: this group's login / logout cards call the SDK's
 * loginState.login() / loginState.logout() directly, NOT the
 * loginSession glue in session.ts. App.vue syncs the SDK login
 * status into session via watch(loginStatus), so the header and
 * ExampleCard login gates also react to it.
 *
 * Difference from the topbar login: topbar's onLogin calls
 * setSelfInfo after login to set a default avatar and random
 * username; this group's cards perform a pure login and set no profile.
 */
function useLoginStateExamples(): ExampleGroup {
  const loginState = useLoginState();

  // Always-on log subscription + toggleable demo-handler set.
  useEventLogSubscription('login', loginState, LoginEvent);
  const demoToggle = useDemoHandlerToggle('login', loginState, LoginEvent);

  // Raw snapshot: keep empty fields as '' / null rather than a hardcoded
  // '(empty)' string, so StateInspector's `case 'text'` branch (which
  // checks `v == null || v === ''`) can localize the placeholder via
  // tLocal('State.Empty', ...) instead of rendering a fixed English string.
  const snapshot = () => ({
    loginStatus: loginState.loginStatus.value,
    loginStatusText: loginState.loginStatus.value === LoginStatus.LOGINED ? 'LOGINED' : 'UNKNOWN',
    userId: loginState.loginUserInfo.value?.userId ?? '',
    userName: loginState.loginUserInfo.value?.userName ?? '',
    avatarUrl: loginState.loginUserInfo.value?.avatarUrl ?? '',
    customInfo: loginState.loginUserInfo.value?.customInfo ?? null,
  });

  /** Humanized inspector schema for the `login.state` snapshot. */
  const loginStatusView: StateViewDef = {
    live: true,
    groups: [
      {
        title: 'Login state',
        rows: [
          { key: 'loginStatus', label: 'Login status', kind: 'enum', enumRef: LoginStatus as unknown as Record<string, string | number>, onValue: LoginStatus.LOGINED },
          { key: 'userId', label: 'User ID', kind: 'text' },
          { key: 'userName', label: 'User name', kind: 'text' },
          { key: 'avatarUrl', label: 'Avatar URL', kind: 'text' },
          {
            key: 'customInfo',
            label: 'Extended info',
            kind: 'custom',
            format: (v, t) => (v && typeof v === 'object' ? JSON.stringify(v) : t('State.Empty', '(empty)')),
          },
        ],
      },
    ],
  };

  return {
    state: 'login',
    hook: 'useLoginState',
    title: 'Login and user profile',
    category: '6.0',
    source: 'LoginState/index.ts',
    // G1 — group-level mental-model primer. No single login card owns
    // "what does useXxxState() return", so surface it here once.
    // Scope: ONLY login's own refs/actions; other groups' APIs are only
    // mentioned when they are strict prerequisites (e.g. startLive/joinLive
    // require login first).
    intro: {
      summary: '{hook}() provides login state and login / logout / profile-edit actions',
      groups: [
        {
          tone: 'must',
          head: 'Key points',
          items: [
            'The hook returns two reactive values: loginUserInfo (current user profile, null when not logged in) and loginStatus (enum: UNKNOWN / LOGINED); actions include login / logout / setSelfInfo / subscribeEvent / unsubscribeEvent.',
            'login is the single entry point for the whole site\'s login state: after await login({ userId, userSig, sdkAppId }) succeeds, loginStatus.value === LOGINED, and all downstream capabilities wait for this signal. It is a side-effect API returning Promise<void> — the result is written into refs, do not read the return value.',
            'A failed login throws directly, and the module already logs in the console which of userId / userSig / sdkAppId is missing, so check those three first when debugging.',
          ],
        },
        {
          tone: 'env',
          head: 'Business prerequisites',
          items: [
            'login does not sign the userSig for you: you must pass a userSig signed by your backend (this demo uses a test service to generate it). The demo may also inject an IM proxy config and auto-merge it into the login params — that is demo-only behavior; in production the signing must be done by your backend.',
          ],
        },
      ],
    },
    examples: [
      {
        id: 'login.state',
        api: 'state',
        title: 'Read login state (loginUserInfo / loginStatus)',
        description:
          'Reactive snapshot of loginUserInfo (current user profile) / loginStatus (login status).',
        signature: 'loginUserInfo / loginStatus',
        roles: ALL_ROLES,
        requireLogin: false,
        events: [...Object.values(LoginEvent)],
        // Humanized inspector schema (see `loginStatusView` above) replaces
        // the raw JSON dump for this card.
        stateView: loginStatusView,
        successToast: false,
        run: () => snapshot(),
        snippet: `import { useLoginState, LoginStatus } from 'tuikit-atomicx-vue3';

const { loginUserInfo, loginStatus } = useLoginState();
// loginStatus.value === LoginStatus.LOGINED means the user is logged in`,
      },
      {
        id: 'login.login',
        api: 'login',
        title: 'Login',
        description:
          'Log into IM via userId + userSig + sdkAppId. userSig is generated by the test service; real integration requires your backend to sign it. After login you usually continue with [[Start Live|startLive]], see [[Official Docs|officialDocsLogin]].',
        signature: 'login(options: { userId: string; userSig: string; sdkAppId: number }): Promise<void>',
        // ALL_ROLES + requireLogin: false means the card is runnable
        // before any role is established — the runtime gate treats
        // `unassigned` as allow, so login itself can be called.
        roles: ALL_ROLES,
        requireLogin: false,
        // Already logged in: block Run and surface "Already logged in"
        // ahead of the required-field hint, since re-login is meaningless
        // until logout. Switch accounts via the topbar / logout card.
        disabled: () =>
          loginState.loginStatus.value === LoginStatus.LOGINED ? 'Card.AlreadyLoggedIn' : '',
        events: [...Object.values(LoginEvent)],
        fields: [
          {
            key: 'userId',
            label: 'userId',
            type: 'text',
            default: '',
            required: true,
            placeholder: 'Enter userId',
            help: 'IM user ID',
            noChinese: true,
          },
        ],
        run: async ({ inputs, t }) => {
          const userId = String(inputs.userId ?? '').trim();
          if (!userId) {
            throw new Error(t('Error.LoginUserIdEmpty', 'userId cannot be empty'));
          }
          const userSig = await genTestUserSig(userId);
          await loginState.login({ userId, userSig, sdkAppId: SDKAppID });
          return {
            loginStatus: loginState.loginStatus.value,
            loginStatusText: loginState.loginStatus.value === LoginStatus.LOGINED ? 'LOGINED' : 'UNKNOWN',
            userId: loginState.loginUserInfo.value?.userId ?? '(empty)',
          };
        },
        snippet: `import { useLoginState } from 'tuikit-atomicx-vue3';

const { login } = useLoginState();
await login({ userId: 'user_1', userSig: '...', sdkAppId: SDKAPPID });`,
      },
      {
        id: 'login.logout',
        api: 'logout',
        title: 'Logout',
        description:
          'End the current IM session. After logout, loginUserInfo is cleared and loginStatus returns to UNKNOWN.',
        signature: 'logout(): Promise<void>',
        roles: ALL_ROLES,
        requireLogin: false,
        events: [...Object.values(LoginEvent)],
        run: async () => {
          await loginState.logout();
          return {
            loginStatus: loginState.loginStatus.value,
            loginStatusText: loginState.loginStatus.value === LoginStatus.LOGINED ? 'LOGINED' : 'UNKNOWN',
          };
        },
        snippet: `const { logout } = useLoginState();
await logout();`,
      },
      {
        id: 'login.setSelfInfo',
        api: 'setSelfInfo',
        title: 'Edit user profile',
        description:
          'Update the current logged-in user\'s name and avatar. The change is written to the local login profile and synced to the IM server.',
        signature: 'setSelfInfo(options: { userName?: string; avatarUrl?: string; customInfo?: Record<string, any> }): Promise<void>',
        roles: ALL_ROLES,
        events: [...Object.values(LoginEvent)],
        fields: [
          {
            key: 'userName',
            label: 'userName',
            type: 'text',
            default: '',
            placeholder: 'Leave empty to keep unchanged',
            help: 'New user name',
          },
          {
            key: 'avatarUrl',
            label: 'avatarUrl',
            type: 'text',
            default: '',
            placeholder: 'Leave empty to keep unchanged',
            help: 'New avatar image URL',
          },
        ],
        run: async ({ inputs, t }) => {
          const params: { userName?: string; avatarUrl?: string } = {};
          const userName = String(inputs.userName ?? '').trim();
          const avatarUrl = String(inputs.avatarUrl ?? '').trim();
          if (userName) params.userName = userName;
          if (avatarUrl) params.avatarUrl = avatarUrl;
          if (Object.keys(params).length === 0) {
            throw new Error(t('Error.LoginSelfInfoEmpty', 'fill in at least one of userName and avatarUrl'));
          }
          await loginState.setSelfInfo(params);
          return snapshot();
        },
        snippet: `const { setSelfInfo } = useLoginState();
await setSelfInfo({ userName: 'New name', avatarUrl: 'https://...' });`,
      },
      ...buildSubscriptionCards({
        groupSlug: 'login',
        hookName: 'useLoginState',
        eventEnumName: 'LoginEvent',
        toggle: demoToggle,
      }),
    ],
  };
}

// ---------------------------------------------------------------------------
// Public surface (single re-export point per project convention).
// ---------------------------------------------------------------------------

export const meta = { state: 'login', hook: 'useLoginState', title: 'Login and user profile', category: '6.0', source: 'LoginState/index.ts' };
export { useLoginStateExamples, useLoginStateExamples as factory };
