## [6.5.3] (2026-08-09)

### feat
* Room: Migrated the barrage (on-screen comments) feature into RoomKit, and upgraded the `@tencentcloud/lite-chat` dependency to 1.6.18

### fix
* Room: Optimized the `RoomView` video playback logic to avoid log errors caused by invalid calls
* Room: Fixed error messages and abnormal behavior in standard and seminar rooms (occasional local stream black screen in seminar rooms, log errors during standard meeting stream playback, and added key-node logging to `roomState`)
* Room: Fixed abnormal whiteboard display caused by local preview going through `videoMixer`
* Room: Fixed experience issues reported during whiteboard beta testing
* Live: Improved live player visuals and fixed device control menu interaction for voice co-guest in landscape mode
* Live: Fixed errors caused by the chat plugin not being registered and the room engine not being logged in when refreshing the live list
* Chat: Restored `useMessageAction`, used by the room scenario, which had been mistakenly removed

### refactor
* Live: Changed event binding for live-related states to lazy binding (lazyBind), avoiding binding execution immediately on module load
* Room: Removed obsolete virtual background code, as the SDK now supports background saving when the camera is not enabled

### perf
* Room: Reduced RoomKit build time, lowered the frequency and log level of `KeyMetricsStats` reporting
