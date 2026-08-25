// Aegis stub - no-op implementation for GitHub demo

interface IAegisReportParams {
  apiName?: string;
  content?: string;
}

export default function useAegis() {
  const reportEvent = (_params: IAegisReportParams): void => {};

  return {
    reportEvent,
  };
}
