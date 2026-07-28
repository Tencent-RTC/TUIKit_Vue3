import { useUIKitModalState } from 'tuikit-atomicx-vue3';

const { openModal: reportModalView } = useUIKitModalState();

interface ApiStats {
  runs: number;
  successes: number;
  failures: number;
  errorCodeCounts: Record<string, number>;
}

const statsMap = new Map<string, ApiStats>();

function getStats(apiId: string): ApiStats {
  let stats = statsMap.get(apiId);
  if (!stats) {
    stats = { runs: 0, successes: 0, failures: 0, errorCodeCounts: {} };
    statsMap.set(apiId, stats);
  }
  return stats;
}

function getMainErrorCode(stats: ApiStats): string {
  let mainCode = 'UNKNOWN';
  let maxCount = 0;
  Object.entries(stats.errorCodeCounts).forEach(([code, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mainCode = code;
    }
  });
  return mainCode;
}

function hashApiId(apiId: string): number {
  let hash = 0;
  for (let i = 0; i < apiId.length; i += 1) {
    hash = (hash * 31 + apiId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function scrubMessage(message: string): string {
  if (!message) {
    return '';
  }
  const scrubbed = message.replace(/\d{6,}/g, '***');
  return scrubbed.length > 200 ? scrubbed.slice(0, 200) : scrubbed;
}

function extractError(error: unknown): { errorCode: string; errorName: string; errorMessage: string } {
  const raw = error as { code?: unknown; name?: unknown; message?: unknown } | null;
  const name = error instanceof Error && error.name
    ? error.name
    : typeof raw?.name === 'string' ? raw.name : '';
  let errorCode = 'UNKNOWN';
  if (raw && raw.code !== undefined && raw.code !== null && raw.code !== '') {
    errorCode = String(raw.code);
  } else if (name) {
    errorCode = name;
  }
  const rawMessage = error instanceof Error
    ? error.message
    : typeof raw?.message === 'string' ? raw.message : String(error);
  return { errorCode, errorName: name || 'Error', errorMessage: scrubMessage(rawMessage) };
}

type ApiEvent = 'run' | 'run_success' | 'run_error';

function reportEvent(
  event: ApiEvent,
  payload: { apiId: string; group: string; api: string; role?: string },
  stats: ApiStats,
  extraLines: string[] = [],
): void {
  const content = [
    'source: api-example',
    `event: ${event}`,
    `api: ${payload.group}.${payload.api}${payload.role ? ` (${payload.role})` : ''}`,
    `runs: ${stats.runs}, success: ${stats.successes}, failure: ${stats.failures}`,
    ...extraLines,
  ].join('\n');

  reportModalView({
    id: hashApiId(payload.apiId),
    title: `api-example: ${payload.api}`,
    content,
    type: event === 'run_error' ? 'error' : 'success',
  });
}

function reportApiRun(payload: { apiId: string; group: string; api: string; role?: string }): void {
  const stats = getStats(payload.apiId);
  stats.runs += 1;
  reportEvent('run', payload, stats);
}

function reportApiRunSuccess(payload: { apiId: string; group: string; api: string; role?: string; durationMs?: number }): void {
  const stats = getStats(payload.apiId);
  stats.successes += 1;
  reportEvent('run_success', payload, stats);
}

function reportApiRunError(payload: {
  apiId: string;
  group: string;
  api: string;
  role?: string;
  errorCode: string;
  errorName: string;
  errorMessage: string;
}): void {
  const stats = getStats(payload.apiId);
  stats.failures += 1;
  stats.errorCodeCounts[payload.errorCode] = (stats.errorCodeCounts[payload.errorCode] || 0) + 1;

  reportEvent('run_error', payload, stats, [
    `error: ${payload.errorName}: ${payload.errorMessage} (code: ${payload.errorCode})`,
    `mainErrorCode: ${getMainErrorCode(stats)}`,
  ]);
}

export { extractError, reportApiRun, reportApiRunError, reportApiRunSuccess };
