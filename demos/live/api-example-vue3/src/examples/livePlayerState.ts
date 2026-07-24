import {
  useLivePlayerState,
  PlayerControlEvent,
  type Resolution,
} from 'tuikit-atomicx-vue3';
import { useEventLogSubscription } from '../services/event-log/useSubscription';
import { useDemoHandlerToggle } from '../services/event-log/useDemoHandlerToggle';
import { buildSubscriptionCards } from '../services/event-log/buildSubscriptionCards';
import type { ExampleGroup, StateViewDef } from '../lib/types';
import { ALL_ROLES, Role } from '../lib/types';

/**
 * 6.9 useLivePlayerState —— playback control.
 * State-readout panel + play/volume/fullscreen/picture-in-picture/resolution controls, with event callbacks visualized.
 */
function useLivePlayerExamples(): ExampleGroup {
  const player = useLivePlayerState();

  // Always-on event-log subscription (every event lands in EventLog).
  useEventLogSubscription('live-player', player, PlayerControlEvent);
  // Toggleable demo-handler subscription driven by the subscribeEvent /
  // unsubscribeEvent cards (emits `[demo] *` rows).
  const demoToggle = useDemoHandlerToggle('live-player', player, PlayerControlEvent);

  const snapshot = () => ({
    isPlaying: player.isPlaying.value,
    isMuted: player.isMuted.value,
    isFullscreen: player.isFullscreen.value,
    isPictureInPicture: player.isPictureInPicture.value,
    controlBarVisible: player.controlBarVisible.value,
    currentVolume: player.currentVolume.value,
    currentResolution: player.currentResolution.value,
    resolutionCount: player.resolutionList.value.length,
  });

  /** Humanized inspector schema for the `live-player.state` snapshot. */
  const playerView: StateViewDef = {
    live: true,
    groups: [
      {
        title: 'Playback',
        rows: [
          { key: 'isPlaying', label: 'Playing', kind: 'bool', onValue: true },
          { key: 'isMuted', label: 'Muted', kind: 'bool', onValue: true },
          { key: 'currentVolume', label: 'Volume', kind: 'volume' },
          {
            key: 'currentResolution',
            label: 'Current resolution',
            kind: 'custom',
            format: (v, t) =>
              v == null
                ? t('State.Empty', '(empty)')
                : typeof v === 'object'
                  ? String((v as Record<string, unknown>).label ?? (v as Record<string, unknown>).value ?? v)
                  : String(Resolution[String(v) as keyof typeof Resolution] ?? v),
          },
          { key: 'resolutionCount', label: 'Resolution options', kind: 'count' },
        ],
      },
      {
        title: 'Stage',
        rows: [
          { key: 'isFullscreen', label: 'Fullscreen', kind: 'bool', onValue: true },
          { key: 'isPictureInPicture', label: 'Picture-in-picture', kind: 'bool', onValue: true },
          { key: 'controlBarVisible', label: 'Control bar visible', kind: 'bool', onValue: true },
        ],
      },
    ],
  };

  return {
    state: 'live-player',
    hook: 'useLivePlayerState',
    title: 'Playback control',
    // The entire player-control surface targets audience + admin (the
    // host uses the push-stream / camera APIs, not the pull-stream
    // player). Surface this as colored role badges on the group title
    // instead of repeating per-API tags on every card.
    roles: [Role.Audience, Role.Admin],
    category: '6.2',
    source: 'LivePlayerState/index.ts',
    // Group-level "about this group" banner (rendered ONCE by GroupIntro.vue
    // above the cards). Verified against source: playback auto-starts on room
    // entry; this group only exposes controls on top of a mounted player.
    intro: {
      summary: 'After entering a room playback starts automatically; this group only provides controls on top of playback',
      groups: [
        {
          tone: 'must',
          head: 'Key points',
          items: [
            'You do NOT need, and cannot, actively "start playback": after entering a live room (or going on seat) playback starts automatically inside; isPlaying is set true as soon as the liveId is obtained; this group only provides controls on top of an already-mounted player — pause / resume / refresh etc.; there is no startPlay/stopPlay.',
            'The difference in pull source (realtime / CDN) is invisible to the upper layer; the engine auto-selects based on the pull-stream URL protocol, so this group uniformly only exposes pause/resume/setVolume/switchResolution etc.',
            'The resolution list resolutionList starts empty and is only populated after playback starts; before that, switchResolution has no target to switch to.',
          ],
        },
        {
          tone: 'env',
          head: 'Common pitfalls',
          items: [
            'Calling control APIs before entering a room / before playback starts may fail with an error due to engine-instance or playback-state issues; switchResolution has no target when resolutionList is empty.',
            'requestFullscreen() returns FullscreenResult and does NOT throw: on failure success=false and isFullscreen is NOT set true, so the caller must judge the return value themselves, don\'t only read isFullscreen.',
            'switchResolution must pass a {label, value} object from resolutionList, not a bare number; setVolume only accepts 0–100, out of range throws directly.',
            'hideControlBar() "locks" the control bar hidden — hovering / clicking the stage won\'t pop it up again; you must explicitly call showControlBar() to restore it.',
          ],
        },
      ],
    },
    examples: [
      {
        id: 'live-player.state',
        api: 'state',
        title: 'Player renders the stage + read state',
        description: 'Reactive snapshot of playback state (isPlaying / volume / resolution, etc.).',
        notes: {
          summary: 'Prerequisites for playback control',
          groups: [
            {
              tone: 'must',
              items: [
                'LiveView is the observable prerequisite for all playback controls: pause / resume / setVolume / switchResolution etc. only act on the currently mounted LiveView. This card mounts one below; if you see nothing, first confirm the stage is ready in this card.',
              ],
            },
            {
              tone: 'env',
              items: [
                'The player hides the underlying pull-source difference from the upper layer, uniformly exposing pause / resume / setVolume / switchResolution etc.; whether the underlying stream is realtime or CDN is auto-selected by the engine based on the pull-stream URL protocol — integrators don\'t need to perceive it.',
              ],
            },
          ],
        },
        signature: 'isPlaying / isMuted / isFullscreen / currentVolume / currentResolution / resolutionList',
        roles: ALL_ROLES,
        requireLogin: false,
        mount: { kind: 'live-view' },
        // Humanized inspector schema (see `playerView` above) replaces the
        // raw JSON dump for this card.
        stateView: playerView,
        // Snapshot read; silence the success toast (re-runs on every render).
        successToast: false,
        run: () => snapshot(),
        snippet: `import { useLivePlayerState } from 'tuikit-atomicx-vue3';

const { isPlaying, currentVolume, currentResolution } = useLivePlayerState();`,
      },
      // All "immediate sensory feedback" player controls below silence
      // their success toast: pause / resume / volume / fullscreen / PiP
      // each produce a visible or audible change on the stage that's
      // far more informative than a corner toast. We keep `refresh`
      // and `switchResolution` on the default toast because their
      // effect (rebuilding the player / re-negotiating stream) takes
      // a moment to be visible and a "call completed" cue is useful.
      {
        id: 'live-player.pause',
        api: 'pause',
        title: 'Pause',
        signature: 'pause(): Promise<void>',
        roles: ALL_ROLES,
        events: ['playStateChange'],
        successToast: false,
        run: async () => {
          await player.pause();
          return snapshot();
        },
        snippet: `const { pause } = useLivePlayerState();
await pause();`,
      },
      {
        id: 'live-player.resume',
        api: 'resume',
        title: 'Resume playback',
        signature: 'resume(): Promise<void>',
        roles: ALL_ROLES,
        events: ['playStateChange'],
        successToast: false,
        run: async () => {
          await player.resume();
          return snapshot();
        },
        snippet: `const { resume } = useLivePlayerState();
await resume();`,
      },
      {
        id: 'live-player.refresh',
        api: 'refresh',
        title: 'Refresh (restore volume/resolution)',
        signature: 'refresh(): Promise<void>',
        roles: ALL_ROLES,
        events: ['playStateChange', 'volumeChange', 'resolutionChange'],
        run: async () => {
          await player.refresh();
          return snapshot();
        },
        snippet: `const { refresh } = useLivePlayerState();
await refresh();`,
      },
      {
        id: 'live-player.setVolume',
        api: 'setVolume',
        title: 'Set volume',
        signature: 'setVolume(volume: number): Promise<void>',
        roles: ALL_ROLES,
        events: ['volumeChange'],
        successToast: false,
        fields: [{ key: 'volume', label: 'volume(0-100)', type: 'number', default: 60 }],
        run: async ({ inputs, t }) => {
          await player.setVolume(inputs.volume as number);
          return { currentVolume: player.currentVolume.value };
        },
        snippet: `const { setVolume } = useLivePlayerState();
await setVolume(60);`,
      },
      {
        id: 'live-player.mute',
        api: 'mute',
        title: 'Mute',
        signature: 'mute(): Promise<void>',
        roles: ALL_ROLES,
        events: ['volumeChange'],
        successToast: false,
        run: async () => {
          await player.mute();
          return { isMuted: player.isMuted.value };
        },
        snippet: `const { mute } = useLivePlayerState();
await mute();`,
      },
      {
        id: 'live-player.unmute',
        api: 'unmute',
        title: 'Unmute',
        signature: 'unmute(): Promise<void>',
        roles: ALL_ROLES,
        events: ['volumeChange'],
        successToast: false,
        run: async () => {
          await player.unmute();
          return { isMuted: player.isMuted.value };
        },
        snippet: `const { unmute } = useLivePlayerState();
await unmute();`,
      },
      {
        id: 'live-player.requestFullscreen',
        api: 'requestFullscreen',
        title: 'Enter fullscreen',
        signature: 'requestFullscreen(): Promise<FullscreenResult>',
        roles: ALL_ROLES,
        events: ['fullscreenChange'],
        successToast: false,
        run: () => {
          player.requestFullscreen();
          return { isFullscreen: player.isFullscreen.value };
        },
        snippet: `const { requestFullscreen } = useLivePlayerState();
requestFullscreen();`,
      },
      {
        id: 'live-player.exitFullscreen',
        api: 'exitFullscreen',
        title: 'Exit fullscreen',
        signature: 'exitFullscreen(): Promise<FullscreenResult>',
        roles: ALL_ROLES,
        events: ['fullscreenChange'],
        successToast: false,
        run: () => {
          player.exitFullscreen();
          return { isFullscreen: player.isFullscreen.value };
        },
        snippet: `const { exitFullscreen } = useLivePlayerState();
exitFullscreen();`,
      },
      {
        id: 'live-player.requestPictureInPicture',
        api: 'requestPictureInPicture',
        title: 'Enter picture-in-picture',
        signature: 'requestPictureInPicture(): Promise<void>',
        roles: ALL_ROLES,
        events: ['pictureInPictureChange'],
        successToast: false,
        run: async () => {
          await player.requestPictureInPicture();
          return { isPictureInPicture: player.isPictureInPicture.value };
        },
        snippet: `const { requestPictureInPicture } = useLivePlayerState();
await requestPictureInPicture();`,
      },
      {
        id: 'live-player.exitPictureInPicture',
        api: 'exitPictureInPicture',
        title: 'Exit picture-in-picture',
        signature: 'exitPictureInPicture(): Promise<void>',
        roles: ALL_ROLES,
        events: ['pictureInPictureChange'],
        successToast: false,
        run: async () => {
          await player.exitPictureInPicture();
          return { isPictureInPicture: player.isPictureInPicture.value };
        },
        snippet: `const { exitPictureInPicture } = useLivePlayerState();
await exitPictureInPicture();`,
      },
      {
        id: 'live-player.switchResolution',
        api: 'switchResolution',
        title: 'Switch resolution',
        signature: 'switchResolution(resolution: Resolution): Promise<void>',
        roles: ALL_ROLES,
        events: ['resolutionChange'],
        fields: [
          {
            key: 'index',
            label: 'Resolution',
            type: 'pretty-select',
            // Empty string so the empty-state option resolves via the
            // `Card.LivePlayerSwitchResolutionFieldIndexOpt` key (see
            // PrettySelect: an empty value drops the numeric suffix).
            default: '',
            // SDK exposes each Resolution as `{ label, value }`, so we just
            // surface its built-in `label` in the dropdown. The select binds
            // to the array index (not the object) because <option :value> is
            // serialized to a string and we don't want to round-trip JSON.
            options: () => {
              const list = player.resolutionList.value as Resolution[];
              if (!list.length) {
                // Aligns with `default: ''` so the empty-state hint is selected
                // by default; the runtime guard below still rejects the click
                // because `resolutionList` is empty (Number('') → 0, list[0] undefined).
                return [{ label: '— waiting for resolutionList (start playback first)', value: '' }];
              }
              return list.map((r, i) => ({ label: r.label, value: i }));
            },
            help: 'Start playback first; resolutionList is populated only then',
          },
        ],
        run: async ({ inputs, t }) => {
          const list = player.resolutionList.value as Resolution[];
          if (!list.length) {
            throw new Error(t('Error.PlayerResListEmpty', 'resolutionList is empty; please start playback first'));
          }
          const idx = Number(inputs.index);
          const target = list[idx];
          if (!target) {
            throw new Error(t('Error.PlayerResOutOfRange', { defaultValue: 'resolutionList out of range: index={{index}}', index: idx }));
          }
          await player.switchResolution(target);
          return { currentResolution: player.currentResolution.value };
        },
        snippet: `import { useLivePlayerState } from 'tuikit-atomicx-vue3';

const { resolutionList, switchResolution } = useLivePlayerState();
// Each item in resolutionList looks like { label: '720P', value: 3 }
await switchResolution(resolutionList.value[0]);`,
      },
      {
        id: 'live-player.addCustomButtons',
        api: 'addCustomButtons',
        title: 'Inject custom buttons (experimental)',
        signature: 'addCustomButtons(buttons: CustomButton[]): void',
        roles: ALL_ROLES,
        requireLogin: false,
        // Visual confirmation appears in the player controls bar — the
        // newly injected button is the feedback. A toast on top would
        // duplicate.
        successToast: false,
        run: ({ log }) => {
          player.addCustomButtons([
            {
              id: 'demo-share',
              icon: () => '🔗',
              tooltip: 'Share',
              position: 'end',
              onClick: () => log('customButton.click', { id: 'demo-share' }),
            },
          ]);
          return { added: 'demo-share' };
        },
        snippet: `const { addCustomButtons } = useLivePlayerState();
addCustomButtons([
  { id: 'share', icon: ShareIcon, tooltip: 'Share', position: 'end', onClick: () => {} },
]);`,
      },
      {
        id: 'live-player.showControlBar',
        api: 'showControlBar',
        title: 'Show control bar',
        signature: 'showControlBar(): void',
        roles: ALL_ROLES,
        requireLogin: false,
        events: ['controlBarVisibilityChange'],
        successToast: false,
        run: () => {
          player.showControlBar();
          return { controlBarVisible: player.controlBarVisible.value };
        },
        snippet: `const { showControlBar } = useLivePlayerState();
showControlBar();`,
      },
      {
        id: 'live-player.hideControlBar',
        api: 'hideControlBar',
        title: 'Hide control bar',
        signature: 'hideControlBar(): void',
        roles: ALL_ROLES,
        requireLogin: false,
        events: ['controlBarVisibilityChange'],
        successToast: false,
        run: () => {
          player.hideControlBar();
          return { controlBarVisible: player.controlBarVisible.value };
        },
        snippet: `const { hideControlBar } = useLivePlayerState();
hideControlBar();`,
      },
      {
        id: 'live-player.setAutoHideDelay',
        api: 'setAutoHideDelay',
        title: 'Set control bar auto-hide delay',
        signature: 'setAutoHideDelay(delay: number): void',
        roles: ALL_ROLES,
        requireLogin: false,
        successToast: false,
        fields: [{ key: 'delay', label: 'delay(ms)', type: 'number', default: 3000 }],
        run: ({ inputs }) => {
          player.setAutoHideDelay(inputs.delay as number);
          return { delay: inputs.delay };
        },
        snippet: `const { setAutoHideDelay } = useLivePlayerState();
setAutoHideDelay(3000);`,
      },
      ...buildSubscriptionCards({
        groupSlug: 'live-player',
        hookName: 'useLivePlayerState',
        eventEnumName: 'PlayerControlEvent',
        toggle: demoToggle,
      }),
    ],
  };
}

// ---------------------------------------------------------------------------
// Public surface (single re-export point per project convention).
// ---------------------------------------------------------------------------

export const meta = { state: 'live-player', hook: 'useLivePlayerState', title: 'Playback control', category: '6.2', source: 'LivePlayerState/index.ts' };
export { useLivePlayerExamples, useLivePlayerExamples as factory };
