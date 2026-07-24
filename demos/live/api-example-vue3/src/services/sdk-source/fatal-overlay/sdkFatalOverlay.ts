/**
 * Vanilla-JS SDK fatal-error overlay.
 *
 * Why this isn't a Vue component:
 *   The most common failure mode we want to recover from is "the
 *   active SDK build is missing an export the demo source uses"
 *   (`SyntaxError: ... does not provide an export named X`). That
 *   error fires DURING the ES module link phase, before any of our
 *   Vue components — including a hypothetical `<AppErrorBoundary>` —
 *   have had a chance to evaluate. Anything that lives downstream of
 *   `import 'tuikit-atomicx-vue3'` is poisoned by the same failure.
 *
 *   The recovery UI therefore has to:
 *     1. Be registered BEFORE any SDK import in `main.ts`.
 *     2. Not depend on Vue / vue-router / the SDK.
 *     3. Stay loaded even if the rest of the bundle never evaluates.
 *
 *   Vanilla DOM + `fetch` against `/__sdk/switch` is enough — and
 *   it's small enough to keep inlined without significant cost.
 *
 * What it captures:
 *   - `window.error`              — synchronous + script-load errors
 *   - `window.unhandledrejection` — async errors / dynamic imports
 *   - The vite HMR `vite:error` event when `import.meta.hot` is up
 *
 * What it does NOT do:
 *   - Application-level runtime errors after the app is mounted.
 *     Those should bubble through Vue's normal `errorHandler` path
 *     and surface as toasts (or in the EventLog), not blow away the
 *     whole UI. We expose `markAppReady()` to flip a flag once the
 *     Vue app's `mounted` hook has fired; afterwards we only escalate
 *     errors whose messages match a strict allow-list (module
 *     resolution failures), not every uncaught exception.
 */

import { createSdkSourceAdapter } from '../adapter/select';

const FATAL_MESSAGE_PATTERNS = [
  /does not provide an export named/i,
  /Failed to fetch dynamically imported module/i,
  /Failed to resolve module/i,
  /Importing binding name/i,
  /The requested module .* does not provide an export/i,
];

interface FatalSnapshot {
  message: string;
  stack?: string;
}

interface InstallOptions {
  /** SDK source the bundle was built against. Read from `import.meta.env`. */
  sdkSource: 'workspace' | 'online';
  /** Version of the SDK currently loaded (or `'workspace'`). */
  sdkVersion: string;
}

let captured: FatalSnapshot | null = null;
let appMounted = false;
let opts: InstallOptions = { sdkSource: 'workspace', sdkVersion: 'workspace' };

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Build the overlay DOM once and inject it. Subsequent calls are
 * idempotent: the first error wins.
 */
function renderOverlay(snapshot: FatalSnapshot): void {
  if (document.getElementById('sdk-fatal-overlay')) {
    return;
  }
  const wrap = document.createElement('div');
  wrap.id = 'sdk-fatal-overlay';
  wrap.setAttribute(
    'style',
    [
      'position:fixed',
      'inset:0',
      'z-index:99999',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'padding:32px',
      'background:rgba(15,23,42,0.6)',
      'backdrop-filter:blur(6px)',
      'overflow:auto',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif',
    ].join(';'),
  );

  const sourceBadgeColor = opts.sdkSource === 'online' ? '#fef3c7;color:#b45309' : '#dbeafe;color:#1e3a8a';
  const sourceLabel = opts.sdkSource === 'online' ? `npm@${opts.sdkVersion}` : 'workspace';

  // Recovery action depends on whether the active adapter supports
  // switching back to workspace (dev) or only resetting to the
  // default version (prod). We compose the relevant button + the
  // "common causes" hint text accordingly so the user sees options
  // that actually do something.
  const recoveryAdapter = createSdkSourceAdapter();
  const recoverLabel = recoveryAdapter.capabilities.canChooseWorkspace
    ? '切回 workspace 版本'
    : '重置为默认版本';
  const recoverHint = recoveryAdapter.capabilities.canChooseWorkspace
    ? '<code>vendor/tuikit-atomicx-online/node_modules</code> 被手动清理或损坏。'
    : '当前选择的版本可能没有发布到 npm 或 CDN（esm.sh）无法访问。';
  // In online mode there's always a recovery action; in workspace
  // dev mode (which "shouldn't fail", in theory) we still surface
  // the button defensively because workspace itself can have
  // type-check errors that look like missing exports.
  const recoverButtonHtml =
    `<button id="sdk-fatal-recover" type="button" `
    + `style="padding:8px 16px;font-size:13px;font-weight:500;color:#fff;`
    + `cursor:pointer;background:#1c66e5;border:1px solid #1c66e5;border-radius:8px;">`
    + `${escapeHtml(recoverLabel)}</button>`;

  wrap.innerHTML = `
    <div style="width:min(720px,100%);padding:28px 32px;background:#fff;border-radius:14px;box-shadow:0 20px 60px rgba(15,23,42,0.25);">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
        <span style="font-size:24px;">⚠️</span>
        <h1 style="margin:0;font-size:20px;color:#b91c1c;">SDK 加载失败</h1>
      </div>
      <p style="margin:0 0 12px;font-size:14px;color:#1f2937;">
        当前 SDK 来源
        <code style="padding:2px 8px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;border-radius:10px;background:${sourceBadgeColor};">${escapeHtml(sourceLabel)}</code>
        无法被本 demo 正常加载。
      </p>
      <pre style="max-height:200px;margin:0 0 12px;padding:12px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;color:#991b1b;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;overflow:auto;white-space:pre-wrap;word-break:break-word;">${escapeHtml(snapshot.message)}</pre>
      ${
        snapshot.stack
          ? `<details style="margin:0 0 16px;font-size:12px;"><summary style="cursor:pointer;color:#6b7280;user-select:none;">调用栈</summary><pre style="max-height:220px;margin:8px 0 0;padding:10px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;color:#4b5563;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;overflow:auto;">${escapeHtml(snapshot.stack)}</pre></details>`
          : ''
      }
      <section style="margin:0 0 18px;">
        <h2 style="margin:0 0 6px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.04em;">常见原因</h2>
        <ul style="margin:0;padding-left:20px;font-size:13px;line-height:1.6;color:#4b5563;">
          <li>目标 SDK 版本里<strong>不存在</strong>本 demo 引用到的某个导出（多见于 workspace 新加的 API 还没发版）。错误中带 <code>does not provide an export named</code> 字样的就是这类。</li>
          <li>目标 SDK 版本的依赖图与 demo 期望的不兼容（peer 缺失 / 版本差距过大）。</li>
          <li>${recoverHint}</li>
        </ul>
      </section>
      <div style="display:flex;gap:10px;">
        ${recoverButtonHtml}
        <button id="sdk-fatal-reload" type="button" style="padding:8px 16px;font-size:13px;font-weight:500;color:#1f2937;cursor:pointer;background:#f3f4f6;border:1px solid #d1d5db;border-radius:8px;">重新加载页面</button>
      </div>
      <p id="sdk-fatal-recover-err" style="margin:12px 0 0;font-size:12px;color:#b91c1c;display:none;"></p>
    </div>
  `;

  document.body.appendChild(wrap);

  const recoverBtn = wrap.querySelector('#sdk-fatal-recover') as HTMLButtonElement | null;
  const reloadBtn = wrap.querySelector('#sdk-fatal-reload') as HTMLButtonElement | null;
  const errEl = wrap.querySelector('#sdk-fatal-recover-err') as HTMLParagraphElement | null;

  if (recoverBtn) {
    recoverBtn.addEventListener('click', async () => {
      recoverBtn.disabled = true;
      const originalLabel = recoverBtn.textContent;
      recoverBtn.textContent = '切换中…';
      try {
        // Recovery target depends on which adapter is active:
        //   - Dev (DevServerAdapter, canChooseWorkspace=true):
        //     switch back to `workspace` source, which is always
        //     compatible because it IS the source code the demo
        //     was written against.
        //   - Prod (ImportMapAdapter, canChooseWorkspace=false):
        //     `workspace` doesn't exist; clear the localStorage
        //     selection and reload — the bootstrap script will
        //     fall back to `bootstrap.defaultVersion` (typically
        //     `latest`), which is the most likely-to-work option.
        if (recoveryAdapter.capabilities.canChooseWorkspace) {
          await recoveryAdapter.switchTo({ source: 'workspace' });
        } else {
          // Drop the user's selection so the bootstrap script
          // falls back to the build-time default version on
          // reload. The adapter doesn't expose a "reset" verb;
          // we do this directly here because it's a
          // recovery-specific concern.
          try {
            window.localStorage.removeItem('atomicx.selectedVersion');
          } catch {
            // Storage may be denied; reload anyway, the page
            // will hopefully recover by other means.
          }
          window.location.reload();
        }
        // For the dev path, the adapter schedules a server
        // restart out-of-band; reload defensively after a beat
        // in case the WS event we usually rely on doesn't fire.
        setTimeout(() => window.location.reload(), 600);
      } catch (err) {
        if (errEl) {
          errEl.style.display = 'block';
          errEl.textContent = `自动切换失败：${(err as Error).message}。请手动修复后刷新。`;
        }
        recoverBtn.disabled = false;
        recoverBtn.textContent = originalLabel || recoverLabel;
      }
    });
  }
  if (reloadBtn) {
    reloadBtn.addEventListener('click', () => window.location.reload());
  }
}

function isFatalMessage(msg: string): boolean {
  return FATAL_MESSAGE_PATTERNS.some(re => re.test(msg));
}

function capture(snapshot: FatalSnapshot): void {
  if (captured) return; // first error wins
  captured = snapshot;
  // Render synchronously so the user never sees a blank page even
  // for a split second.
  try {
    renderOverlay(snapshot);
  } catch (err) {
    // If even the overlay fails, fall back to a hard alert — better
    // than a silent blank page.
    // eslint-disable-next-line no-alert
    alert(`SDK load failed:\n${snapshot.message}\n\n(${(err as Error).message})`);
  }
}

function onWindowError(event: ErrorEvent): void {
  if (captured) return;
  const msg = event.message || String(event.error?.message || '');
  // Pre-mount: catch everything (the operator wants to see WHY the
  // bundle didn't render). Post-mount: only escalate clear
  // module-resolution failures so a transient runtime exception
  // doesn't wipe the working UI.
  if (!appMounted || isFatalMessage(msg)) {
    capture({
      message: msg || 'Unknown error',
      stack: event.error?.stack,
    });
  }
}

function onUnhandledRejection(event: PromiseRejectionEvent): void {
  if (captured) return;
  const reason = event.reason;
  const msg = reason instanceof Error ? reason.message : String(reason ?? '');
  if (!appMounted || isFatalMessage(msg)) {
    capture({
      message: msg || 'Unhandled rejection',
      stack: reason instanceof Error ? reason.stack : undefined,
    });
  }
}

/**
 * Install the global listeners. Call this as the FIRST thing in
 * `main.ts` — before any SDK import — so we catch failures during
 * the very first module evaluation.
 */
function installSdkFatalOverlay(options: InstallOptions): void {
  opts = options;
  window.addEventListener('error', onWindowError);
  window.addEventListener('unhandledrejection', onUnhandledRejection);
  // Best-effort hook into vite's HMR error channel. Wrapped so a
  // missing `import.meta.hot` (production build) doesn't blow up.
  try {
    if (import.meta.hot) {
      import.meta.hot.on(
        'vite:error',
        (data: { err?: { message?: string; stack?: string } }) => {
          if (captured) return;
          capture({
            message: data?.err?.message || 'Vite reported an error.',
            stack: data?.err?.stack,
          });
        },
      );
    }
  } catch {
    /* ignore */
  }
}

/**
 * Tell the overlay the Vue app finished mounting successfully. After
 * this, we stop escalating arbitrary uncaught exceptions and only
 * react to module-resolution-style failures (which still warrant a
 * full-page recovery prompt).
 */
function markAppReady(): void {
  appMounted = true;
}

/**
 * External entrypoint for the bootstrap probe (see
 * `sdkFatalOverlay.bootstrap.ts`). Lets us surface a synthesised
 * failure that didn't come through `window.error` /
 * `unhandledrejection` — namely, ESM link-time SyntaxErrors caught
 * by the dynamic-import probe.
 *
 * Same first-error-wins rules as the listener path.
 */
function captureFromString(message: string, stack?: string): void {
  if (captured) return;
  if (!isFatalMessage(message)) {
    // Only escalate the kinds of failures we know how to recover
    // from. Anything else is bubbled to the console untouched so the
    // developer can diagnose it normally.
    return;
  }
  capture({ message, stack });
}

export { installSdkFatalOverlay, markAppReady, captureFromString };
