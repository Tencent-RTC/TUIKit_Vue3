// English (en-US) i18n resources — Device Control state list.
//
// Key set MUST stay identical to `zh-CN/cards/device.ts`; only the value
// differs. See `menuKey()` / `cardKey()` key derivation in the demo.

export const device: Record<string, string> = {
  'Card.DeviceSetCurrentCameraFieldDeviceId': "Device ID",
  'Card.DeviceSetCurrentMicrophoneFieldDeviceId': "Device ID",
  'Card.DeviceSetCaptureVolumeFieldVolume': "Volume (0-100)",
  'Card.DeviceSetOutputVolumeFieldVolume': "Volume (0-100)",
  'Card.DeviceStartScreenShareDesc': "Start screen sharing (optionally with system audio via screenAudio and a target share view). Calls RoomEngine.startScreenSharing; requires being in the room and on mic.",
  'Card.DeviceStartScreenShareNoteSummary': "startScreenShare · Role prerequisites & limitations",
  'Card.DeviceStartScreenShareNote0Item0': "Host: callable once you are live (after startLive completes).",
  'Card.DeviceStartScreenShareNote0Item1': "Audience: must first joinLive to enter the room, then applyForSeat and be approved by the host (appear in seatList) before calling. Calling before joining or being on mic will be rejected and throw by the underlying RoomEngine.",
  'Card.DeviceStartScreenShareNote1Item0': 'This demo does NOT composite the screen-share stream into the mix stream: when the camera is also open, viewers watching via startPlayStream see only the camera, not the screen share. The screen-share preview is visible only locally in the ScreenShareStage window. To let viewers see the screen share, either close the camera first (so the screen share becomes the sole video source) or integrate VideoMixerState to build a custom mix layout that includes the screen-share stream.',
  'Card.DeviceStartScreenShareFieldScreenAudio': "screenAudio (system audio)",
  'Card.DeviceStartScreenShareFieldView': "view (share view ID)",
  'Card.DeviceStartScreenShareFieldViewHelp': 'Container element ID for local screen-share preview; default uses the global ScreenShareStage',
  'Card.DeviceStopScreenShareDesc': "Stop the current screen sharing. Camera/microphone capture (if enabled) is unaffected and keeps streaming.",
  'Card.DeviceStateDesc':
    'Snapshot of reactive state: camera/microphone on-off status, the currently selected device, device-list counts, capture/playback volume, and screen-share status.',
  'Card.DeviceStateNoteSummary': 'device.state · Auto-pull on open',
  'Card.DeviceStateNote0Item0':
    'Opening this card auto-calls getCameraList() / getMicrophoneList() to enumerate devices into cameraList / microphoneList — no need to click the enumeration cards manually. Results show live in the "Reactive State" panel above.',
  'Menu.Device': "Device Control",
  'Menu.DeviceState': "Read device state (cameraStatus / microphoneStatus / device list / volume)",
  'Menu.DeviceStartCameraTest': "Local camera preview (start camera test)",
  'Menu.DeviceStopCameraTest': "Stop local preview",
  'Menu.DeviceOpenLocalCamera': "Start camera capture",
  'Menu.DeviceCloseLocalCamera': "Stop camera capture",
  'Menu.DeviceOpenLocalMicrophone': "Start microphone capture",
  'Menu.DeviceCloseLocalMicrophone': "Stop microphone capture",
  'Menu.DeviceStartScreenShare': "Start screen share",
  'Menu.DeviceStopScreenShare': "Stop screen share",
  'Menu.DeviceGetCameraList': "Enumerate cameras",
  'Menu.DeviceSetCurrentCamera': "Switch camera",
  'Menu.DeviceGetMicrophoneList': "Enumerate microphones",
  'Menu.DeviceSetCurrentMicrophone': "Switch microphone",
  'Menu.DeviceSetCaptureVolume': "Set capture volume",
  'Menu.DeviceSetOutputVolume': "Set playback volume",

  // StartCameraTest card
  'Card.DeviceStartCameraTestDesc':
    'End-to-end: local preview before / after going live. The state layer only handles capture; the picture renders into the global floating container (bottom-right). Usable even before entering a room.',

  // OpenLocalCamera card
  'Card.DeviceOpenLocalCameraDesc': 'Start local camera capture and push the stream.',
  'Card.DeviceOpenLocalCameraNoteSummary': 'openLocalCamera · role prerequisite',
  'Card.DeviceOpenLocalCameraNote0Item0': 'Host: callable right after going live (startLive done).',
  'Card.DeviceOpenLocalCameraNote0Item1':
    'Audience: must first joinLive to enter the room, then apply for a seat via useCoGuestState and be approved by the host (appear in seatList) before calling. Calling without being in the room or on seat is rejected by the underlying RoomEngine with an error.',

  // CloseLocalCamera card
  'Card.DeviceCloseLocalCameraDesc':
    'Used by the host or an on-seat audience member to stop local camera capture.',

  // OpenLocalMicrophone card
  'Card.DeviceOpenLocalMicrophoneDesc': 'Start local microphone capture and push the stream.',
  'Card.DeviceOpenLocalMicrophoneNoteSummary': 'openLocalMicrophone · role prerequisite',
  'Card.DeviceOpenLocalMicrophoneNote0Item0': 'Host: callable right after going live (startLive done).',
  'Card.DeviceOpenLocalMicrophoneNote0Item1':
    'Audience: must first joinLive to enter the room, then apply for a seat via useCoGuestState and be approved by the host (appear in seatList) before calling. Calling without being in the room or on seat is rejected by the underlying RoomEngine with an error.',

  // CloseLocalMicrophone card
  'Card.DeviceCloseLocalMicrophoneDesc':
    'Used by the host or an on-seat audience member to stop local microphone capture.',

  // SetCurrentCamera card
  'Card.DeviceSetCurrentCameraFieldDeviceIdHelp': 'Run "Enumerate cameras" first to get the deviceId',

  // SetCurrentMicrophone card
  'Card.DeviceSetCurrentMicrophoneFieldDeviceIdHelp': 'Run "Enumerate microphones" first to get the deviceId',

  // SetCurrentCamera / SetCurrentMicrophone / SetCaptureVolume / SetOutputVolume · when callable (notes)
  'Card.DeviceSetCurrentCameraNoteSummary': 'setCurrentCamera · when callable',
  'Card.DeviceSetCurrentCameraNote0Item0':
    'Callable before OR after entering a room — only requires the SDK to be ready (logged in); it does NOT depend on room entry or going on seat. Device "switch / enumerate" are pure device operations, independent of the capture on/off switch.',
  'Card.DeviceSetCurrentCameraNote1Item0':
    'If you are currently pushing the stream (camera already open), switching changes the camera used for the upstream picture in real time; switching before pushing only changes the default device.',
  'Card.DeviceSetCurrentMicrophoneNoteSummary': 'setCurrentMicrophone · when callable',
  'Card.DeviceSetCurrentMicrophoneNote0Item0':
    'Callable before OR after entering a room — only requires the SDK to be ready (logged in); it does NOT depend on room entry or going on seat. Device "switch / enumerate" are pure device operations, independent of the capture on/off switch.',
  'Card.DeviceSetCurrentMicrophoneNote1Item0':
    'If you are currently pushing the stream (microphone already open), switching changes the microphone used for the upstream audio in real time; switching before pushing only changes the default device.',
  'Card.DeviceSetCaptureVolumeNoteSummary': 'setCaptureVolume · when callable',
  'Card.DeviceSetCaptureVolumeNote0Item0':
    'Callable before OR after entering a room — only requires the SDK to be ready (logged in); it does NOT depend on room entry or going on seat.',
  'Card.DeviceSetCaptureVolumeNote0Item1':
    "Controls the capture volume of this device's upstream audio — it changes how loud the other side hears you, not your local monitoring.",
  'Card.DeviceSetCaptureVolumeNote1Item0':
    'A value set before entering the room stays in effect after you enter and start pushing — no need to set it again.',
  'Card.DeviceSetOutputVolumeNoteSummary': 'setOutputVolume · when callable',
  'Card.DeviceSetOutputVolumeNote0Item0':
    'Callable before OR after entering a room — only requires the SDK to be ready (logged in); it does NOT depend on room entry or going on seat.',
  'Card.DeviceSetOutputVolumeNote0Item1':
    "Controls the volume of locally played REMOTE audio — it is this device's listening level, not affecting the other side or other audience members.",
  'Card.DeviceSetOutputVolumeNote1Item0':
    'Setting it before entering the room (no remote stream yet) only records the value; it takes effect automatically once you enter and start pulling the stream.',

  // subscribeEvent / unsubscribeEvent (shared, generated by buildSubscriptionCards)
  'Card.DeviceSubscribeEventDesc':
    'This group subscribes to all `DeviceEvent` events by default (demo handler; log rows prefixed with `[demo]<eventName>`). '
      + 'If canceled by the unsubscribeEvent card below, you can re-subscribe here by picking "all" or a single event; '
      + 'if the event is already subscribed, this call is an idempotent no-op.',
  'Card.DeviceSubscribeEventFieldEventHelp': 'Pick "(all events)" to bulk-subscribe every event',
  'Card.DeviceSubscribeEventToastTitle': 'Subscribed',
  'Card.DeviceSubscribeEventToastDesc':
    'Next time the event fires, EventLog will also show a log row prefixed with "[demo]"',
  'Card.DeviceUnsubscribeEventDesc':
    'Unsubscribe one or all events from `DeviceEvent`. After unsubscribing, when the event fires again the "[demo] xxx" '
      + 'prefixed log row no longer appears (the unprefixed regular rows are still captured by the site\'s always-on log subscription). '
      + '⚠️ In real integrations the call MUST pass the EXACT SAME handler reference used for subscribeEvent, otherwise the SDK cannot find it and silently fails.',
  'Card.DeviceUnsubscribeEventFieldEventHelp': 'Pick "(all events)" to bulk-unsubscribe every event',
  'Card.DeviceUnsubscribeEventToastTitle': 'Unsubscribed',
  'Card.DeviceUnsubscribeEventToastDesc':
    'Next time the event fires, EventLog will no longer show the "[demo]" prefixed log row',

  // Device group intro (G6): what the status flags actually mean
  'Card.DeviceIntroSummary': 'cameraStatus / microphoneStatus = whether the camera/mic is actually being captured and pushed',
  'Card.DeviceIntro0Item0':
    'After openLocalCamera / openLocalMicrophone, the SDK needs a moment to actually open the device and start pushing, so the status flips to On slightly AFTER the call — not instantly. Don\'t assert the status is On right after calling openLocalCamera / openLocalMicrophone. Note: entering a room does NOT auto-start the camera/mic — if you never call openLocalCamera / openLocalMicrophone, the status you read is always Off. Also, openLocalCamera / openLocalMicrophone carry a role precondition: a host must have started live (startLive done); an audience must first applyForSeat, be approved by the host and appear in seatList before calling — otherwise the call is rejected with an error by the underlying RoomEngine (see each API card\'s "Usage notes").',
  'Card.DeviceIntro0Item1':
    'closeLocalCamera / closeLocalMicrophone set the status to Off immediately, no wait needed. If the OS "Stop sharing" dialog ends screen sharing, screenStatus also auto-resets to Off — nothing to handle manually.',
  'Card.DeviceIntro0Item2':
    'startCameraTest is only a LOCAL camera preview (no push) and is independent of openLocalCamera ("capture AND push"); usable without entering a room, and it does NOT auto-stop on endLive / leaveLive — call stopCameraTest() explicitly. getCameraList / getMicrophoneList / setCurrentCamera / setCurrentMicrophone are pure device operations, callable anytime, unrelated to room entry or streaming.',
};
