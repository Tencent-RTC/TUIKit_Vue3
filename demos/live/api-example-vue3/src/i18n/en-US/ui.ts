// English (en-US) i18n resources — global (non-state-list) UI chrome.
//
// Key set MUST stay identical to `zh-CN/ui.ts`; only the value differs
// (English vs Chinese). Per-state-list resources (menu group titles,
// example titles, card descriptions) live under `./cards/*`.

export const ui: Record<string, string> = {
  // Common
  'Common.Login': 'Login',
  'Common.Logout': 'Logout',
  'Common.LoggingIn': 'Logging in…',
  'Common.Copy': 'Copy',
  'Common.Copied': 'Copied',
  'Common.Run': 'Run',
  'Common.Stop': 'Stop',
  'Common.Expand': 'Expand',
  'Common.Collapse': 'Collapse',
  'Common.Hide': 'Hide',
  'Common.Show': 'Show',
  'Common.Loading': 'Loading…',
  'Common.Search': 'Search API...',
  'Common.CopyLiveIdSuccess': 'Copied liveId to clipboard',
  'Common.CopyLiveIdFailed': 'Copy failed, please copy manually',
  'Common.Save': 'Save',
  'Common.Saving': 'Saving…',

  // Topbar
  'Topbar.Brand': 'LiveKit Vue3',
  'Topbar.Subtitle': 'API Example · tuikit-atomicx-vue3',
  'Topbar.GoHome': 'Back to start',
  'Topbar.Role': 'Role',
  'Topbar.CurrentLive': 'Current live room',
  'Topbar.CopyLiveId': 'Copy liveId',
  'Topbar.StartLive': 'Start live',
  'Topbar.JoinLive': 'Join live room',
  'Topbar.UserIdPlaceholder': 'userId (dev quick login)',
  'Topbar.UserIdNoChinese': 'Chinese characters are not supported',
  'Topbar.LoggedIn': 'Logged in: ',
  'Topbar.UserName': 'Username',
  'Topbar.AvatarUrl': 'Avatar URL',
  'Topbar.AvatarPlaceholder': 'Enter avatar image URL',
  'Topbar.UserId': 'userId',
  'Topbar.LoginDisabledHint': 'Enter a userId before logging in',
  'Login.UserIdRequired': 'userId is required',
  'Login.KickedOfflineTitle': 'Account logged in elsewhere',
  'Login.KickedOfflineDesc': 'Your account has been logged in on another device. You have been disconnected.',
  'Login.ExpiredTitle': 'Login expired',
  'Login.ExpiredDesc': 'Your login credentials have expired. Please log in again.',

  // Role
  'Role.Unassigned': 'Not in room',
  'Role.Host': 'Host',
  'Role.Audience': 'Audience',
  'Role.Admin': 'Admin',
  'Role.TooltipUnassignedLoggedOut': 'Please log in first, then choose how to enter the live room:\n• startLive to create a room → become Host\n• joinLive to join someone\'s room → become Audience\n• Host can call setAdministrator to promote you to Admin',
  'Role.TooltipUnassignedLoggedIn': 'Not yet in a live room. Choose how to start:\n• startLive to create a room → become Host\n• joinLive to join someone\'s room → become Audience\n• Host can call setAdministrator to promote you to Admin',
  'Role.TooltipHost': 'You are the Host · auto-assigned after creating a room via startLive\n• Can push stream, manage audience, set administrators\n• Returns to "Not in room" after endLive',
  'Role.TooltipAudience': 'You are the Audience · auto-assigned after joining someone\'s room via joinLive\n• Can watch, send barrage, apply for co-guest\n• Host can call setAdministrator to promote you to Admin\n• Returns to "Not in room" after leaveLive',
  'Role.TooltipAdmin': 'You are the Admin · assigned after the Host calls setAdministrator on you\n• Has all audience capabilities\n• Can assist the Host in managing the audience (kick, mute, etc.)\n• Returns to Audience after the Host revokes your admin rights',

  // Placeholder / home page
  'Placeholder.Title': 'Live State API Example',
  'Placeholder.Intro': 'Select an API from the left to view: signature · inputs · run result · event log · copyable snippet.',
  'Placeholder.Hint1': 'Tip: complete a dev login with any userId in the top-right first. Role is "the relationship between a user and a live room" and only exists after entering a room — the badge shows "Not in room" right after login; it becomes "Host" after startLive, "Audience" after joinLive into someone\'s room, and "Admin" after the Host calls setAdministrator on you; it returns to "Not in room" after leaveLive / endLive. The role is derived automatically from SDK state — no manual (or possible) switching.',
  'Placeholder.Hint2': 'Multi-role flow: log in with a separate userId in another browser window and enter the same liveId to play Host / Audience / Admin respectively, which helps observe cross-client events like setAdministrator.',

  // EventLog
  'EventLog.Title': 'Event Log',
  'EventLog.Export': 'Export JSON',
  'EventLog.Clear': 'Clear',
  'EventLog.Filter': 'Filter',
  'EventLog.All': 'All',
  'EventLog.Empty': 'No events yet. Subscribed events will appear here in real time.',
  'EventLog.DockExpandTitle': 'Click to expand Event Log · global event log',
  'EventLog.DockCollapseTitle': 'Collapse Event Log',
  'EventLog.DockUnreadCount': 'Unread events',
  'EventLog.DockLatest': 'Latest: ',
  'EventLog.DockExpandHint': 'Click to expand / view all',
  'EventLog.DockCollapseHint': 'Click to collapse',

  // Toast
  'Toast.StartLiveSuccess': 'Live started',
  'Toast.StartLiveDesc': 'Next step: enable the camera to start pushing stream',
  'Toast.StartLiveAction': 'Enable camera push',
  'Toast.JoinLiveSuccess': 'Joined live room',
  'Toast.JoinLiveDesc': 'The pull-stream video is now shown on the global stage at bottom-right',
  'Toast.JoinLiveAction': 'View playback controls',
  'Toast.LeaveLiveSuccess': 'Left live room',
  'Toast.LeaveLiveDesc': 'The global pull-stream stage will auto-hide',
  'Toast.EndLiveSuccess': 'Live ended',
  'Toast.EndLiveDesc': 'The audience will receive onLiveEnded',
  'Toast.CopyLiveIdSuccess': 'Copied liveId to clipboard',
  'Toast.CopyLiveIdFailed': 'Copy failed, please copy manually',
  'Toast.MicNotOpened': 'Tip: microphone not enabled',
  'Toast.MicNotOpenedDesc': 'Camera is enabled; we recommend also enabling the microphone for a better live experience',
  'Toast.MicNotOpenedAction': 'Enable microphone',
  'Toast.RoleHost': 'Role changed · Host',
  'Toast.RoleHostDesc': 'Live started successfully, you are now the Host of the live room',
  'Toast.RoleAudience': 'Role changed · Audience',
  'Toast.RoleAudienceDesc': 'Joined the live room, current identity is regular Audience',
  'Toast.RoleAdmin': 'Role changed · Admin',
  'Toast.RoleAdminDesc': 'The Host has set you as the live room administrator',
  'Toast.RoleAdminRevoked': 'Role changed · Admin',
  'Toast.RoleAdminRevokedDesc': 'The Host has revoked your administrator rights',
  'Toast.RoleLeftHost': 'Role changed · Not in room',
  'Toast.RoleLeftHostDesc': 'Live ended',
  'Toast.RoleLeft': 'Role changed · Not in room',
  'Toast.RoleLeftDesc': 'Left the live room',
  'Toast.CtaPrefix': 'Go to',
  'Toast.Dismiss': 'Dismiss',

  // Suggested follow-up action labels (event-driven toast CTAs)
  'Toast.Action.AcceptGuestApplication': 'Accept seat application',
  'Toast.Action.AcceptHostInvitation': 'Accept co-guest invitation',
  'Toast.Action.ViewSeatState': 'View seat state',
  'Toast.Action.ViewCoGuestState': 'View co-guest state',
  'Toast.Action.RefreshLiveList': 'Refresh live list',

  // Global stages
  'Stage.CameraTitle': 'Camera preview',
  'Stage.ScreenShareTitle': 'Screen share',
  'Stage.LiveTitle': 'Live video',
  'Stage.ShowLive': 'Show live video',

  // SDK source picker
  'Sdk.Switching': 'Switching…',
  'Sdk.LocalSource': 'Local source',
  'Sdk.PanelTitle': 'Switch SDK version · tuikit-atomicx-vue3',
  'Sdk.WorkspaceTitle': 'Local source',
  'Sdk.WorkspaceSub': 'Use source from ui-component/packages in the repo (default)',
  'Sdk.OnlineTitle': 'Published npm version',
  'Sdk.Refresh': 'Refresh version list from npm',
  'Sdk.Loading': 'Loading…',
  'Sdk.LoadingVersions': 'Loading version list from npm…',
  'Sdk.NoVersions': 'No published versions',
  'Sdk.NpmError': 'Cannot access npm',
  'Sdk.NpmErrorSuffix': 'Only locally installed versions are shown',
  'Sdk.Prereleases': 'Pre-release versions',
  'Sdk.MissingExports': 'Current SDK is missing',
  'Sdk.MissingExportsSuffix': 'exports required by the demo',
  'Sdk.MissingMore': 'Plus',
  'Sdk.MissingMoreSuffix': 'more',
  'Sdk.Peers': 'Related dependencies',
  'Sdk.InstallPlaceholder': 'e.g. 6.2.5 / latest / next',
  'Sdk.Install': 'Install',
  'Sdk.Installing': 'Installing…',
  'Sdk.Installed': 'Installed',
  'Sdk.InstalledClickToSwitch': ', click the corresponding version above to switch',
  'Sdk.InstallFailed': 'Installation failed',
  'Sdk.SwitchFailed': 'Switch failed',
  'Sdk.NotAvailable': 'Current build does not support install',
  'Sdk.LoadStateFailed': 'Failed to load SDK state',
  'Sdk.OverlayRestarting': 'Switching to',
  'Sdk.OverlayRestartingGeneric': 'Switching SDK version…',
  'Sdk.OverlaySwitching': 'Switching to',
  'Sdk.OverlaySwitchingGeneric': 'Switching SDK source…',
  'Sdk.OverlayInstalling': 'Installing',
  'Sdk.OverlayInstallingGeneric': 'Installing SDK…',
  'Sdk.OverlayRestartSub': 'Vite is restarting, the page will refresh automatically',
  'Sdk.OverlaySwitchSub': 'Vite will restart shortly',
  'Sdk.OverlayInstallSub': 'Downloading package and related dependencies via npm, may take a minute',
  'Sdk.TooltipWorkspace': 'tuikit-atomicx-vue3 (local source)\nFrom ui-component/packages/uikit-component-vue3 in the repo, click to switch',
  'Sdk.TooltipOnline': 'From the published npm version, click to switch',
  'Sdk.VersionOnDisk': 'Downloaded · compatible',
  'Sdk.VersionIncompatible': 'Missing',
  'Sdk.VersionIncompatibleSuffix': 'exports — affected API cards will be disabled',
  'Sdk.VersionInstalling': 'Installing…',
  'Sdk.VersionPreviously': 'Previously installed',
  'Sdk.VersionPublished': 'Published on',
  'Sdk.VersionInstallSwitch': 'Install and switch',
  'Sdk.VersionReinstallSwitch': 'Reinstall and switch',
  'Sdk.VersionTitlePublished': 'Published on',
  'Sdk.VersionTitleOnDisk': 'Downloaded locally, click to switch',
  'Sdk.VersionTitleReinstall': 'Installed before, click to reinstall and switch',
  'Sdk.VersionTitleInstall': 'Click to install and switch',
  'Sdk.VersionTitleIncompatiblePrefix': 'Missing exports required by the demo',
  'Sdk.VersionTitleIncompatibleSuffix': 'You can still switch; affected API cards will be disabled',

  // Left API list status badges.
  'Menu.Pending': 'Planned',
  'Menu.SdkUnavailable': 'SDK unavailable',

  // Language switcher
  'Lang.Switch': '中/EN',
  'Lang.SwitchLanguage': 'Switch language',

  // Card UI (shared chrome across all API cards)
  'Card.ApiSignature': 'API Signature',
  'Card.Inputs': 'Inputs',
  'Card.Output': 'Output',
  'Card.Error': 'Error',
  'Card.CodeSnippet': 'Code Snippet',
  'Card.Run': 'Run',
  'Card.Running': 'Running…',
  'Card.NotImplemented': 'This example has no run logic yet',
  'Card.LoginRequired': 'Please log in first',
  'Card.RoleRestricted': "Current role unavailable. Allowed: ",
  'Card.NotInRoom': 'Not in a live room — join or start a live first',
  'Card.AlreadyOnSeat': 'Already on seat — leave the seat first',
  'Card.AutoFill': 'Auto-fill',
  'Card.AutoFillTitle': 'Auto-filled from events',
  'Card.UsageNotes': 'Usage notes',
  'Card.GroupIntroLabel': 'Group notes',
  'Card.RenderCarrier': 'Render carrier',
  'Card.LiveViewCarrier': 'LiveView pull (global)',
  'Card.CameraCarrier': 'Local camera preview (global)',
  'Card.NoteHeadMust': 'Integration notes',
  'Card.NoteHeadEnv': 'Business / environment prerequisites',
  'Card.NoChineseInline': 'Chinese characters are not supported',
  'Card.RequiredFieldEmpty': '{{field}} is required',
  'Card.AlreadyLoggedIn': 'Already logged in',
  // Card helper text
  'Card.CameraPreviewStartedLead': 'Camera preview is on (global floating, bottom-right) · run',
  'Card.CameraPreviewStartedTail': ' or click "Stop" on the floating window to close it',
  'Card.CameraPreviewNotStartedLead': 'Camera preview is off: run',
  'Card.CameraPreviewNotStartedTail': ' and the local view appears in the bottom-right automatically.',
  'Card.LiveViewMountedLead': 'Global LiveView mounted (bottom-right) · current live room ',
  'Card.LiveViewNotJoinedLead': 'Not in a live room yet: audience runs',
  'Card.LiveViewNotJoinedMid': ', host runs',
  'Card.LiveViewNotJoinedTail': ', and the pull stream appears in the bottom-right automatically after joining.',

  // Default success-toast description (used when an example's
  // `successToast` has no `description`). See ExampleCard.vue.
  'Card.SuccessToastDefault': 'Call succeeded',

  // Mount-carrier Usage notes — LiveView (rendered by ExampleCard.vue)
  'Card.MountNotesSummaryLiveView': 'LiveView',
  'Card.LiveViewMustItem0':
    '<strong>Global singleton</strong>: LiveView renders into a fixed container '
    + "<code>#atomicx-live-stream-content</code> and binds a global player singleton — "
    + "only one instance may be mounted at any time across the entire app. "
    + "This demo promotes LiveView to an App-level resident container (bottom-right) so it stays visible across card switches; "
    + "real integrations should similarly ensure a single persistent instance at the router/layout level to avoid duplicate mounts per page/card.",
  'Card.LiveViewMustItem1':
    '<strong>Parent container must provide dimensions</strong>: The component root '
    + "<code>.live-core-view-container</code> is <code>width:100%; height:100%</code>; "
    + "the video area collapses to 0 when the parent lacks explicit dimensions (global stage is 16:9, 360 px wide).",
  'Card.LiveViewMustItem2':
    '<strong>Browser autoplay policy</strong>: Before user interaction, browsers may block autoplay with sound (black screen / silent). '
    + "LiveView detects <code>onAutoPlayFailed</code> and auto-shows a built-in <code>DefaultAutoPlayPrompt</code> to guide the user to click and resume — "
    + "no manual handling needed on the business side. If the default overlay doesn't match your product style, replace it via the "
    + "<code>autoplay-prompt</code> named slot with custom UI.",
  'Card.LiveViewEnvItem0':
    '<strong>Video source</strong>: The pull-stream video depends on whether a host is pushing in the room; mounting ≠ immediate picture. '
    + "Two-window verification: host runs <code>startLive</code> + <code>openLocalCamera</code>, audience runs <code>joinLive</code>.",
  'Card.LiveViewEnvItem1':
    '<strong>Theme</strong>: Depends on global CSS variables injected by <code>UIKitProvider</code>, a prerequisite for the entire uikit-base system. '
    + "All components look broken without it.",

  // Mount-carrier Usage notes — Camera test (rendered by ExampleCard.vue)
  'Card.MountNotesSummaryCameraTest': 'startCameraTest',
  'Card.NoteHeadEnvCamera': 'Device / environment prerequisites',
  'Card.CameraTestMustItem0':
    '<strong>Render target is the `view` you pass</strong>: <code>startCameraTest({ view })</code> renders the local preview into the <code>view</code> container (DOM id or element) you supply. '
    + "It is independent from and can coexist with <code>openLocalCamera</code> (\"capture AND push stream\") — one is a local device preview, the other pushes the stream out.",
  'Card.CameraTestMustItem1':
    '<strong>RoomEngine must be ready before calling</strong>: Call only after <code>TUIRoomEngine.once(\'ready\', ...)</code>. '
    + "It does NOT depend on being in a room (no need to startLive / joinLive first).",
  'Card.CameraTestMustItem2':
    '<strong>endLive / leaveLive does NOT auto-stop the preview</strong>: the state interface does not call <code>stopCameraTest()</code> automatically after leaving or ending the live, so the preview keeps holding the camera. '
    + 'You must call <code>stopCameraTest()</code> explicitly to release the device.',
  'Card.CameraTestEnvItem0':
    '<strong>Single test stream per camera</strong>: A physical device has only one capture stream; calling <code>startCameraTest</code> again takes over the same stream.',
  'Card.CameraTestEnvItem1':
    '<strong>Permissions &amp; HTTPS</strong>: First call triggers the browser permission prompt; <code>getUserMedia</code> is unavailable under non-HTTPS / non-localhost.',

  // State inspector (reactive snapshot panel) — shared render tokens.
  'Card.StateInspector': 'Reactive State',
  'State.On': 'On',
  'State.Off': 'Off',
  'State.Count': '{{count}}',
  'State.Empty': '(empty)',
  // Enum member labels for `kind: 'enum'` rows — key is `State.Enum.<RawEnumMemberName>`.
  'State.Enum.UNKNOWN': 'Unknown',
  'State.Enum.LOGINED': 'Logged in',
  'State.Enum.Off': 'Off',
  'State.Enum.On': 'On',
  'State.Enum.NoError': 'No error',
  'State.Enum.NoDeviceDetected': 'No device detected',
  'State.Enum.NoSystemPermission': 'No system permission',
  'State.Enum.NotSupportCapture': 'Capture not supported',
  'State.Enum.OccupiedError': 'Device occupied',
  'State.Enum.UnknownError': 'Unknown error',
  'State.Enum.Connected': 'Connected',
  'State.Enum.Disconnected': 'Disconnected',
  // Per-field format placeholders / units — `t` is passed into `format`.
  'State.Placeholder.NotInLive': '(not in a live room)',
  'State.Placeholder.None': '(none)',
  'State.Placeholder.NotStarted': '(not started)',
  'State.Placeholder.NotOnSeat': '(not on seat)',
  'State.Unit.Times': '{{count}}',
  'State.Unit.Seconds': '{{count}}s',

  // Select placeholder fallback (PrettySelect) when no per-field placeholder is set.
  'Card.PleaseSelect': 'Please select',
  // Role-badge tooltip reasons (derivedRole.ts), shown on hover.
  'Role.ReasonNotLoggedIn': 'Not logged in · role undetermined',
  'Role.ReasonUnassigned':
    'Not in any live room · role is only determined after startLive (become host) or joinLive (become audience)',
  'Role.ReasonHost': 'You are currentLive.liveOwner ({{userId}}) · derived from useLiveListState',
  'Role.ReasonAdmin': 'SDK getUserInfo / onUserInfoChanged reports userRole = TUIRole.kAdministrator',
  'Role.ReasonAudience': 'Entered {{ownerId}}\'s live room, and not set as admin',
  // Runtime guard errors thrown by `run()` across example groups.
  'Error.BattleUserIdEmpty':
    'target userId is empty: please run requestHostConnection in the co-host group first and let the peer acceptHostConnection; only then will this card\'s dropdown have options',
  'Error.BattleIdEmpty': 'battleId cannot be empty',
  'Error.BattleTargetUserIdEmpty': 'target userId cannot be empty',
  'Error.CoHostLiveIdEmpty':
    'target liveId is empty: please run getCoHostCandidates to pull the candidate list first, then select the target broadcaster in the dropdown',
  'Error.CoHostTargetLiveIdEmpty': 'target liveId cannot be empty',
  'Error.CoHostInviterLiveIdEmpty': 'inviter liveId cannot be empty',
  'Error.CoHostRemoteLiveIdEmpty': 'remote host liveId cannot be empty',
  'Error.LoginUserIdEmpty': 'userId cannot be empty',
  'Error.LoginSelfInfoEmpty': 'fill in at least one of userName and avatarUrl',
  'Error.BarrageTextEmpty': 'text cannot be empty',
  'Error.BarrageBusinessIdEmpty': 'businessId cannot be empty',
  'Error.BarrageTipEmpty': 'tip text cannot be empty',
  'Error.BarrageNotJsonObject': '{{fieldName}} must be a JSON object (key-value map)',
  'Error.BarrageJsonParseFailed': '{{fieldName}} JSON parse failed: {{reason}}',
  'Error.GiftIdEmpty':
    'giftId is empty: please run refreshGiftList to pull the gift list first, then pick a specific gift in the giftId dropdown',
  'Error.DeviceRoomRequired':
    '{{api}} requires entering a live room first (call startLive or joinLive) before use',
  'Error.DeviceSeatRequired':
    '{{api}} requires being on seat first: audience must applyForSeat via useCoGuestState, and after the host approves they can call this',
  'Error.PlayerResListEmpty': 'resolutionList is empty; please start playback first',
  'Error.PlayerResOutOfRange': 'resolutionList out of range: index={{index}}',
};
