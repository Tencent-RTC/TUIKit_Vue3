## [6.6.0] (2026-10-12)
### Fix
* Room: Fixed an initialization issue in the room members module where the watcher was not properly unsubscribed upon component destruction.

## [6.5.12] (2026-10-10)
### fix
* Chat/Room/Live: Fixed the issue where the login state of each module was not reset after the user was kicked offline or the userSig expired in on-demand loading scenarios.

## [6.5.11] (2026-09-18)
### feat
* Chat: chat-store supports streaming messages in cloud search results.

## [6.5.10] (2026-09-17)
### fix
* Room/Live: Fixed the issue where the speaker test failed to play because Safari does not support `setSinkId`

## [6.5.9] (2026-09-15)
### feat
* Live: Unified device failure prompts and recovery guidance, with persistent explanations and user-controlled recovery

## [6.5.8] (2026-09-04)
### feat
* Chat: chat-store supports the parsing of streaming messages.

## [6.5.7] (2026-08-26)
### fix
* Room: Fixed an issue where video streams covered the header after joining a webinar room.

## [6.5.6] (2026-08-19)
### fix
* Chat: Fixed the issue with the read acknowledgment parameter for forwarding messages.

## [6.5.5] (2026-08-17)

### feat
* Roomkit: Optimize real-time subtitle interaction

## [6.5.4] (2026-08-11)
### fix
* Chat: Fixed the issue where the reference message does not exist due to the read acknowledgment in the single chat scenario

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
