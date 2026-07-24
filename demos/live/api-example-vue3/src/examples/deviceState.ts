import { useDeviceState, useLiveListState, useLiveSeatState } from 'tuikit-atomicx-vue3';
import { DeviceStatus, DeviceError } from 'tuikit-atomicx-vue3';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import type { ExampleGroup, StateViewDef } from '../lib/types';
import { ALL_ROLES } from '../lib/types';
import { pushToast } from '../services/toast/store';
import { session } from '../services/session/session';

/**
 * Fixed DOM id of the global camera-preview container.
 *
 * The container lives in GlobalCameraStage.vue (mounted at App level) so
 * it survives card switches. `startCameraTest({ view })` targets this id,
 * and the preview stays visible regardless of which card is active.
 */
const CAMERA_PREVIEW_VIEW_ID = 'global-camera-preview';

/**
 * Device control subset required by live broadcasting / co-guest flows.
 *
 * `useDeviceState` is a general RTC capability; this group surfaces the
 * subset a streamer needs: local camera preview, camera/microphone toggles,
 * device enumeration & switching, capture/playout volume, and screen share
 * start/stop. Non-live device features (virtual background, beauty, speaker
 * test) are out of scope.
 *
 * Note: there is no `useDeviceState` contract type in `uikit-core`, so this
 * group is intentionally not part of the coverage regression (TARGETS).
 */
function useDeviceExamples(): ExampleGroup {
  const device = useDeviceState();
  const { currentLive } = useLiveListState();
  const { seatList } = useLiveSeatState();
  const { t } = useUIKit();

  /**
   * Guard for device APIs that require an active live room.
   * The SDK's RoomEngine silently no-ops (or throws a vague error)
   * when these are called without having entered a room, so we
   * check upfront and throw a clear, actionable error instead.
   */
  function requireInRoom(apiName: string): void {
    if (!currentLive.value?.liveId) {
      throw new Error(
        t('Error.DeviceRoomRequired', {
          defaultValue: '{{api}} requires entering a live room first (call startLive or joinLive) before use',
          api: apiName,
        }),
      );
    }
  }

  /**
   * Guard for device APIs that require the user to be on a seat.
   * Hosts are always "on seat" (they own the room). Audience members
   * must have gone through the co-guest flow (applyForSeat → host
   * accepted) to appear in seatList. Without this guard the SDK's
   * RoomEngine silently rejects the call or throws a vague error.
   */
  function requireOnSeat(apiName: string): void {
    requireInRoom(apiName);
    const ownerId = currentLive.value?.liveOwner?.userId;
    const isHost = ownerId && ownerId === session.userId;
    if (isHost) {
      return;
    }
    const onSeat = seatList.value.some(
      seat => seat.userInfo?.userId === session.userId,
    );
    if (!onSeat) {
      throw new Error(
        t('Error.DeviceSeatRequired', {
          defaultValue: '{{api}} requires being on seat first: audience must applyForSeat via useCoGuestState, and after the host approves they can call this',
          api: apiName,
        }),
      );
    }
  }

  /** Compact, serializable view of the device state. */
  const snapshot = () => ({
    cameraStatus: device.cameraStatus.value,
    microphoneStatus: device.microphoneStatus.value,
    isCameraTesting: device.isCameraTesting.value,
    currentCamera: device.currentCamera.value?.deviceName ?? null,
    currentMicrophone: device.currentMicrophone.value?.deviceName ?? null,
    cameraCount: device.cameraList.value.length,
    microphoneCount: device.microphoneList.value.length,
    screenStatus: device.screenStatus.value,
    screenLastError: device.screenLastError.value,
  });

  const deviceItems = (list: { deviceId: string; deviceName: string }[]) =>
    list.map(d => ({ deviceId: d.deviceId, deviceName: d.deviceName }));

  /**
   * Humanized rendering schema for the `device.state` snapshot. The raw
   * snapshot object (from `run`) stays the data source; this only maps each
   * key to a readable label + value kind so the card shows
   * `Camera switch · On (1)` instead of a bare `cameraStatus: 1`. Co-located
   * here because the enum semantics (DeviceStatus.On === 1) are known at
   * authoring time. Groups mirror the three device concerns a streamer
   * cares about: camera / microphone / screen+volume.
   */
  const deviceStatusView: StateViewDef = {
    live: true,
    groups: [
      {
        title: 'Camera',
        rows: [
          { key: 'cameraStatus', label: 'Camera switch', kind: 'enum', enumRef: DeviceStatus as unknown as Record<string, string | number>, onValue: DeviceStatus.On },
          { key: 'isCameraTesting', label: 'Local preview on', kind: 'bool', onValue: true },
          { key: 'currentCamera', label: 'Current camera', kind: 'text' },
          { key: 'cameraCount', label: 'Camera device count', kind: 'count' },
        ],
      },
      {
        title: 'Microphone',
        rows: [
          { key: 'microphoneStatus', label: 'Microphone switch', kind: 'enum', enumRef: DeviceStatus as unknown as Record<string, string | number>, onValue: DeviceStatus.On },
          { key: 'currentMicrophone', label: 'Current microphone', kind: 'text' },
          { key: 'microphoneCount', label: 'Microphone device count', kind: 'count' },
        ],
      },
      {
        title: 'Screen share / volume',
        rows: [
          { key: 'screenStatus', label: 'Screen share', kind: 'enum', enumRef: DeviceStatus as unknown as Record<string, string | number>, onValue: DeviceStatus.On },
          { key: 'screenLastError', label: 'Screen share error', kind: 'enum', enumRef: DeviceError as unknown as Record<string, string | number>, onValue: DeviceError.NoError },
          { key: 'captureVolume', label: 'Capture volume', kind: 'volume' },
          { key: 'outputVolume', label: 'Playback volume', kind: 'volume' },
        ],
      },
    ],
  };

  return {
    state: 'device',
    hook: 'useDeviceState',
    title: 'Device control',
    category: '6.1.5',
    source: 'DeviceState/DeviceState.ts',
    // G6 — practical mental model for the device status flags: they reflect
    // whether the camera/mic/screen is *actually being captured and pushed*,
    // so the flag flips a beat after open*/close* (never instantly), and
    // entering a room never auto-starts capture. Verified against source.
    // NOTE: the rendered text lives in i18n (zh-CN/en-US cards/device.ts,
    // keys Card.DeviceIntroSummary / Card.DeviceIntro0Item0..2); this intro
    // is the fallback source and MUST stay in sync with those 3 keys.
    intro: {
      summary: 'cameraStatus / microphoneStatus etc. = "whether capture & push is actually ongoing now"',
      groups: [
        {
          tone: 'must',
          items: [
            'After calling openLocalCamera / openLocalMicrophone, the SDK needs a moment to actually open the device and start pushing the stream; the status flips to On "after a short wait", not instantly — so don\'t assert the status is already On right after open. Note: entering a room does NOT auto-open the camera / microphone; without actively calling openLocalCamera / openLocalMicrophone, the read is always Off. Also, openLocalCamera / openLocalMicrophone have role preconditions: the host must have startLive\'d; the audience must applyForSeat, get host approval, and appear in seatList before calling — otherwise the call is rejected with an error by the underlying RoomEngine (see each API card\'s "usage notes").',
            'closeLocalCamera / closeLocalMicrophone immediately set the status to Off, no wait needed; if screen share is stopped via a system "stop sharing" dialog, screenStatus also auto-returns to Off — you don\'t handle it manually.',
            'startCameraTest is only a local camera preview (no push); it is independent of openLocalCamera\'s "capture & push" and works even without entering a room. It is NOT auto-ended by endLive / leaveLive, so remember to call stopCameraTest() explicitly. getCameraList / getMicrophoneList / setCurrentCamera / setCurrentMicrophone are pure device operations, callable anytime, independent of room entry or pushing.',
          ],
        },
      ],
    },
    examples: [
      {
        id: 'device.state',
        api: 'state',
        title: 'Read device state (cameraStatus / microphoneStatus / device list / volume)',
        description:
          'Reactive snapshot of camera / microphone switch status, currently selected device, device list counts, capture / playback volume, screen share status, etc.',
        signature:
          'cameraStatus / microphoneStatus / screenStatus / currentCamera / currentMicrophone / cameraList / microphoneList / captureVolume / outputVolume',
        roles: ALL_ROLES,
        requireLogin: false,
        // Humanized inspector schema (see `deviceStatusView` above) replaces
        // the raw JSON dump for this card.
        stateView: deviceStatusView,
        // On card open, enumerate camera & microphone devices so the
        // operator sees real device counts / current device by default.
        // Fire-and-forget: the `cameraList` / `microphoneList` refs update
        // reactively and the state inspector re-renders — no await needed.
        // Device enumeration is SDK-ready, not room-gated (see getCameraList
        // / getMicrophoneList), so this is safe before entering a room.
        onActivate: () => {
          void device.getCameraList();
          void device.getMicrophoneList();
        },
        // Documents the auto-enumeration above: device lists are not
        // populated by entering a room — they must be pulled explicitly, so
        // doing it on card open means the counts/current-device rows are
        // already meaningful instead of 0 / null.
        notes: {
          summary: 'device.state · auto-pull on open',
          groups: [
            {
              tone: 'env',
              items: [
                'On opening this card, getCameraList() / getMicrophoneList() are auto-called to enumerate devices into cameraList / microphoneList — no need to click the corresponding enumeration cards manually. Results show in real time in the reactive-state panel above.',
              ],
            },
          ],
        },
        // Snapshot reads run on every render via watchEffect; toasting on
        // each tick would drown the screen in noise.
        successToast: false,
        run: () => ({
          cameraStatus: device.cameraStatus.value,
          microphoneStatus: device.microphoneStatus.value,
          screenStatus: device.screenStatus.value,
          isCameraTesting: device.isCameraTesting.value,
          currentCamera: device.currentCamera.value?.deviceName ?? null,
          currentMicrophone: device.currentMicrophone.value?.deviceName ?? null,
          cameraCount: device.cameraList.value.length,
          microphoneCount: device.microphoneList.value.length,
          captureVolume: device.captureVolume.value,
          outputVolume: device.outputVolume.value,
        }),
        snippet: `import { useDeviceState } from 'tuikit-atomicx-vue3';

const { cameraStatus, microphoneStatus, currentCamera } = useDeviceState();
// cameraStatus.value === DeviceStatus.On means the local camera is capturing`,
      },
      {
        id: 'device.startCameraTest',
        api: 'startCameraTest',
        title: 'Local camera preview (start camera test)',
        description:
          'Local camera preview (no push): renders the camera capture into the view container passed by the caller; callable without entering a room.',
        signature: 'startCameraTest(options: { view: string | HTMLDivElement }): Promise<void>',
        roles: ALL_ROLES,
        mount: { kind: 'camera-preview' },
        run: async () => {
          await device.startCameraTest({ view: CAMERA_PREVIEW_VIEW_ID });
          return snapshot();
        },
        snippet: `import { useDeviceState } from 'tuikit-atomicx-vue3';

const { startCameraTest } = useDeviceState();
// view is the DOM container id where the local preview is rendered
await startCameraTest({ view: 'camera-preview' });`,
      },
      {
        id: 'device.stopCameraTest',
        api: 'stopCameraTest',
        title: 'Stop local preview',
        signature: 'stopCameraTest(): Promise<void>',
        roles: ALL_ROLES,
        mount: { kind: 'camera-preview' },
        run: async () => {
          await device.stopCameraTest();
          return snapshot();
        },
        snippet: `const { stopCameraTest } = useDeviceState();
await stopCameraTest();`,
      },
      {
        id: 'device.openLocalCamera',
        api: 'openLocalCamera',
        title: 'Open camera capture',
        description: 'Open local camera capture and push the stream.',
        notes: {
          summary: 'openLocalCamera · role preconditions',
          groups: [
            {
              tone: 'must',
              items: [
                'Host: callable right after going live (startLive completed).',
                'Audience: must first joinLive into the room, then applyForSeat, get host approval (appear in seatList), before calling. Calling without being in a room or on seat is rejected with an error by the underlying RoomEngine.',
              ],
            },
          ],
        },
        signature: 'openLocalCamera(): Promise<void>',
        // Host can open the camera as part of pushing their stream. An
        // audience member that has been promoted onto a seat
        // (`applyForSeat` → host accepted) is also permitted by
        // RoomEngine to push their own A/V — this is the standard
        // co-guest flow. The card therefore lists both `host` and
        // `audience` as eligible roles; non-on-seat audience calls
        // will surface RoomEngine's "user not on seat" error which is
        // the intended teaching moment.
        roles: ALL_ROLES,
        run: async () => {
          requireOnSeat('openLocalCamera');
          await device.openLocalCamera();

          // Check if microphone is disabled and prompt user to enable it
          if (device.microphoneStatus.value === DeviceStatus.Off) {
            pushToast({
              source: 'live-player',
              role: session.role,
              level: 'info',
              title: t('Toast.MicNotOpened'),
              description: t('Toast.MicNotOpenedDesc'),
              action: {
                state: 'device',
                apiId: 'openLocalMicrophone',
                label: t('Toast.MicNotOpenedAction'),
                labelKey: 'Toast.MicNotOpenedAction',
                roles: ALL_ROLES,
              },
            });
          }

          return snapshot();
        },
        snippet: `const { openLocalCamera } = useDeviceState();
await openLocalCamera();`,
      },
      {
        id: 'device.closeLocalCamera',
        api: 'closeLocalCamera',
        title: 'Close camera capture',
        description: 'Used by the host or an on-seat audience to stop local camera capture.',
        signature: 'closeLocalCamera(): Promise<void>',
        // Symmetric with `openLocalCamera` — anyone able to open it
        // must be able to close it.
        roles: ALL_ROLES,
        run: async () => {
          requireOnSeat('closeLocalCamera');
          await device.closeLocalCamera();
          return snapshot();
        },
        snippet: `const { closeLocalCamera } = useDeviceState();
await closeLocalCamera();`,
      },
      {
        id: 'device.openLocalMicrophone',
        api: 'openLocalMicrophone',
        title: 'Open microphone capture',
        description: 'Open local microphone capture and push the stream.',
        notes: {
          summary: 'openLocalMicrophone · role preconditions',
          groups: [
            {
              tone: 'must',
              items: [
                'Host: callable right after going live (startLive completed).',
                'Audience: must first joinLive into the room, then applyForSeat, get host approval (appear in seatList), before calling. Calling without being in a room or on seat is rejected with an error by the underlying RoomEngine.',
              ],
            },
          ],
        },
        signature: 'openLocalMicrophone(): Promise<void>',
        // Same on-seat semantics as `openLocalCamera`. See that
        // card's role-list comment for the full reasoning.
        roles: ALL_ROLES,
        run: async () => {
          requireOnSeat('openLocalMicrophone');
          await device.openLocalMicrophone();
          return snapshot();
        },
        snippet: `const { openLocalMicrophone } = useDeviceState();
await openLocalMicrophone();`,
      },
      {
        id: 'device.closeLocalMicrophone',
        api: 'closeLocalMicrophone',
        title: 'Close microphone capture',
        description: 'Used by the host or an on-seat audience to stop local microphone capture.',
        signature: 'closeLocalMicrophone(): Promise<void>',
        // Symmetric with `openLocalMicrophone`.
        roles: ALL_ROLES,
        run: async () => {
          requireOnSeat('closeLocalMicrophone');
          await device.closeLocalMicrophone();
          return snapshot();
        },
        snippet: `const { closeLocalMicrophone } = useDeviceState();
await closeLocalMicrophone();`,
      },
      {
        id: 'device.getCameraList',
        api: 'getCameraList',
        title: 'Enumerate camera devices',
        signature: 'getCameraList(): Promise<void>',
        roles: ALL_ROLES,
        // List enumeration — the device list returned in the Output
        // panel is the natural feedback. A toast on top would be noise.
        successToast: false,
        run: async () => {
          await device.getCameraList();
          return deviceItems(device.cameraList.value);
        },
        snippet: `const { getCameraList, cameraList } = useDeviceState();
await getCameraList();
console.log(cameraList.value);`,
      },
      {
        id: 'device.setCurrentCamera',
        api: 'setCurrentCamera',
        title: 'Switch camera device',
        signature: 'setCurrentCamera(options: { deviceId: string }): Promise<void>',
        roles: ALL_ROLES,
        notes: {
          summary: 'setCurrentCamera · call conditions',
          groups: [
            {
              tone: 'must',
              items: [
                'Callable before / after entering a room; as long as the SDK is ready (logged in) it works, independent of room entry / seat. Device "switch / enumeration" is a pure device operation, independent of the capture switch.',
              ],
            },
            {
              tone: 'env',
              items: [
                'If currently pushing (camera open), the switch changes the camera used for the upstream feed in real time; switching before pushing only changes the default device.',
              ],
            },
          ],
        },
        fields: [
          { key: 'deviceId', label: 'deviceId', type: 'text', default: '', required: true, help: 'Run "Enumerate camera" first to get the deviceId' },
        ],
        run: async ({ inputs }) => {
          await device.setCurrentCamera({ deviceId: String(inputs.deviceId || '') });
          return snapshot();
        },
        snippet: `const { setCurrentCamera } = useDeviceState();
await setCurrentCamera({ deviceId: 'camera-device-id' });`,
      },
      {
        id: 'device.getMicrophoneList',
        api: 'getMicrophoneList',
        title: 'Enumerate microphone devices',
        signature: 'getMicrophoneList(): Promise<void>',
        roles: ALL_ROLES,
        successToast: false,
        run: async () => {
          await device.getMicrophoneList();
          return deviceItems(device.microphoneList.value);
        },
        snippet: `const { getMicrophoneList, microphoneList } = useDeviceState();
await getMicrophoneList();
console.log(microphoneList.value);`,
      },
      {
        id: 'device.setCurrentMicrophone',
        api: 'setCurrentMicrophone',
        title: 'Switch microphone device',
        signature: 'setCurrentMicrophone(options: { deviceId: string }): Promise<void>',
        roles: ALL_ROLES,
        notes: {
          summary: 'setCurrentMicrophone · call conditions',
          groups: [
            {
              tone: 'must',
              items: [
                'Callable before / after entering a room; as long as the SDK is ready (logged in) it works, independent of room entry / seat. Device "switch / enumeration" is a pure device operation, independent of the capture switch.',
              ],
            },
            {
              tone: 'env',
              items: [
                'If currently pushing (microphone open), the switch changes the microphone used for the upstream audio in real time; switching before pushing only changes the default device.',
              ],
            },
          ],
        },
        fields: [
          { key: 'deviceId', label: 'deviceId', type: 'text', default: '', required: true, help: 'Run "Enumerate microphone" first to get the deviceId' },
        ],
        run: async ({ inputs }) => {
          await device.setCurrentMicrophone({ deviceId: String(inputs.deviceId || '') });
          return snapshot();
        },
        snippet: `const { setCurrentMicrophone } = useDeviceState();
await setCurrentMicrophone({ deviceId: 'microphone-device-id' });`,
      },
      {
        id: 'device.setCaptureVolume',
        api: 'setCaptureVolume',
        title: 'Set capture volume',
        signature: 'setCaptureVolume(volume: number): Promise<void>',
        roles: ALL_ROLES,
        // Volume tweaking is iterative — operators drag the input and
        // hit Run repeatedly. Toasting every call drowns the screen.
        successToast: false,
        notes: {
          summary: 'setCaptureVolume · call conditions',
          groups: [
            {
              tone: 'must',
              items: [
                'Callable before / after entering a room; as long as the SDK is ready (logged in) it works, independent of room entry / seat.',
                'Controls the "capture volume of your own upstream audio" — affects how loud the peer hears you, not the local monitor.',
              ],
            },
            {
              tone: 'env',
              items: [
                'A value set before entering a room still takes effect after entering and pushing — no need to set it again.',
              ],
            },
          ],
        },
        fields: [{ key: 'volume', label: 'volume(0-100)', type: 'number', default: 80 }],
        run: async ({ inputs }) => {
          await device.setCaptureVolume(Number(inputs.volume));
          return { captureVolume: device.captureVolume.value };
        },
        snippet: `const { setCaptureVolume } = useDeviceState();
await setCaptureVolume(80);`,
      },
      {
        id: 'device.setOutputVolume',
        api: 'setOutputVolume',
        title: 'Set playback volume',
        signature: 'setOutputVolume(volume: number): Promise<void>',
        roles: ALL_ROLES,
        successToast: false,
        notes: {
          summary: 'setOutputVolume · call conditions',
          groups: [
            {
              tone: 'must',
              items: [
                'Callable before / after entering a room; as long as the SDK is ready (logged in) it works, independent of room entry / seat.',
                'Controls the "volume of the local playback of remote audio" — a local listening concern, not affecting the peer or other audiences.',
              ],
            },
            {
              tone: 'env',
              items: [
                'A value set before entering a room (no remote stream yet) is only recorded; it auto-takes effect after entering and pulling the stream.',
              ],
            },
          ],
        },
        fields: [{ key: 'volume', label: 'volume(0-100)', type: 'number', default: 60 }],
        run: async ({ inputs }) => {
          await device.setOutputVolume(Number(inputs.volume));
          return { outputVolume: device.outputVolume.value };
        },
        snippet: `const { setOutputVolume } = useDeviceState();
await setOutputVolume(60);`,
      },
      {
        id: 'device.startScreenShare',
        api: 'startScreenShare',
        title: 'Start screen share',
        description:
          'Start screen share (optionally carrying system audio screenAudio, or specifying the share view). Underlying calls RoomEngine.startScreenSharing; depends on being in a room and on seat.',
        notes: {
          summary: 'startScreenShare · role preconditions & limitations',
          groups: [
            {
              tone: 'must',
              items: [
                'Host: callable right after going live (startLive completed).',
                'Audience: must first joinLive into the room, then applyForSeat, get host approval (appear in seatList), before calling. Calling without being in a room or on seat is rejected with an error by the underlying RoomEngine.',
              ],
            },
            {
              tone: 'env',
              items: [
                'This demo does NOT composite the screen-share stream into the mix stream: when the camera is also open, viewers watching via startPlayStream see only the camera, not the screen share. The screen-share preview is visible only locally in the ScreenShareStage window. To let viewers see the screen share, either close the camera first (so the screen share becomes the sole video source) or integrate VideoMixerState to build a custom mix layout that includes the screen-share stream.',
              ],
            },
          ],
        },
        signature: 'startScreenShare(options?: { screenAudio?: boolean; view?: string }): Promise<void>',
        roles: ALL_ROLES,
        fields: [
          { key: 'screenAudio', label: 'screenAudio (system audio)', type: 'boolean', default: false },
          { key: 'view', label: 'view (share view ID)', type: 'text', default: 'global-screen-share', help: 'Container element ID for local screen-share preview; default uses the global ScreenShareStage' },
        ],
        run: async ({ inputs }) => {
          requireOnSeat('startScreenShare');
          const screenAudio = Boolean(inputs.screenAudio);
          const view = inputs.view ? String(inputs.view) : undefined;
          await device.startScreenShare(
            screenAudio || view ? { screenAudio, view } : undefined,
          );
          return snapshot();
        },
        snippet: `const { startScreenShare } = useDeviceState();
// Share screen only
await startScreenShare();
// Share screen and carry system audio
await startScreenShare({ screenAudio: true });`,
      },
      {
        id: 'device.stopScreenShare',
        api: 'stopScreenShare',
        title: 'Stop screen share',
        description: 'Stop the current screen share. Camera / microphone capture (if open) is unaffected and keeps pushing.',
        signature: 'stopScreenShare(): Promise<void>',
        roles: ALL_ROLES,
        run: async () => {
          requireOnSeat('stopScreenShare');
          await device.stopScreenShare();
          return snapshot();
        },
        snippet: `const { stopScreenShare } = useDeviceState();
await stopScreenShare();`,
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Public surface (single re-export point per project convention).
// ---------------------------------------------------------------------------

export const meta = { state: 'device', hook: 'useDeviceState', title: 'Device control', category: '6.1.5', source: 'DeviceState/DeviceState.ts' };
export { useDeviceExamples, useDeviceExamples as factory };
