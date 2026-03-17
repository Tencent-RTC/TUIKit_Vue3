import { TUILogin } from '@tencentcloud/tui-core-lite';

// Global record to track reported states in page lifecycle
const reportedTypes = new Set<StateUsageType>();

enum StateUsageType {
  MessageListState = 1001,
  MessageInputState = 1002,
  MessageActionState = 1003,
  ConversationListState = 1004,
  ConversationGroupState = 1005,
  SearchState = 1006,
  ContactState = 1007,
  ChatEvokeCall = 1020,
}

interface StateUsageReportOptions {
  type: StateUsageType;
}

function reportStateUsageData(options: StateUsageReportOptions) {
  try {
    // Skip if already reported for this type
    if (reportedTypes.has(options.type)) {
      return;
    }
    // Mark as reported
    reportedTypes.add(options.type);
    setTimeout(() => {
      TUILogin.getContext()?.chat.callExperimentalAPI('reportTUIFeatureUsage', { atomicStoreID: options.type });
    }, 3000);
  } catch (_error) {
    // Ignore errors
  }
}

export {
  reportStateUsageData,
  StateUsageType,
};
