<template>
  <!--
    In-page SDK source picker. Lives in the topbar, replaces the old
    static badge. Talks to the dev-only `/__sdk/*` middleware
    (`scripts/sdkSwitcherPlugin.mjs`) to read which copy of
    `tuikit-atomicx-vue3` vite is currently resolving, install new
    versions on demand, and switch between `workspace` (in-repo source)
    and `online` (real published version pinned under
    `vendor/tuikit-atomicx-online/node_modules`).

    Switching writes a state file and asks vite to restart; the browser
    auto-reloads when the websocket reconnects, so the runtime flow is:
      click switch → POST /__sdk/switch → vite restart → ws reconnect →
      `vite:beforeFullReload` → full reload with the new SDK bundle.
  -->
  <div class="sdk-picker" :class="{ 'sdk-picker--open': open }">
    <button
      ref="trigger"
      type="button"
      class="sdk-picker__trigger"
      :class="`sdk-picker__trigger--${currentSource}`"
      :title="triggerTitle"
      :disabled="restarting"
      @click="toggle"
    >
      <!--
        While the dev server is restarting we replace the coloured
        status dot with a small spinner. It's a tiny detail but it's
        the only persistent visual indication of "switch in progress"
        once the dropdown closes — without it the topbar still says
        "restarting…" but feels frozen for the ~1s the dev server
        takes to come back.
      -->
      <span v-if="restarting" class="sdk-picker__spinner" aria-hidden="true" />
      <span v-else class="sdk-picker__dot" />
      <span class="sdk-picker__label">
        tuikit-atomicx-vue3 ·
        <template v-if="restarting">{{ t('Sdk.Switching', '切换中…') }}</template>
        <template v-else-if="currentSource === 'online'">npm@{{ currentVersion }}</template>
        <template v-else>{{ t('Sdk.LocalSource', '本地源码') }}</template>
      </span>
      <svg
        class="sdk-picker__caret"
        width="10"
        height="10"
        viewBox="0 0 10 10"
        aria-hidden="true"
      >
        <path d="M2 4l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.4" />
      </svg>
    </button>

    <!--
      Full-page loading overlay shown during install + switch + restart.
      Teleported to <body> so it sits above the topbar and example
      content regardless of where the picker is mounted. We render
      this for ANY long-running phase (`busy`), not just `restarting`,
      so a slow `npm install` also gets covered.

      The overlay is dismiss-blocking on purpose: clicking through
      while vite is restarting would just produce errors anyway.
    -->
    <teleport to="body">
      <div v-if="busy" class="sdk-picker-overlay" role="status" aria-live="polite">
        <div class="sdk-picker-overlay__card">
          <div class="sdk-picker-overlay__spinner" aria-hidden="true" />
          <div class="sdk-picker-overlay__text">
            <div class="sdk-picker-overlay__title">{{ overlayTitle }}</div>
            <div v-if="overlaySubtitle" class="sdk-picker-overlay__subtitle">
              {{ overlaySubtitle }}
            </div>
          </div>
        </div>
      </div>
    </teleport>

    <div v-if="open" class="sdk-picker__panel" @click.stop>
      <div class="sdk-picker__panel-head">{{ t('Sdk.PanelTitle', '切换 SDK 版本 · tuikit-atomicx-vue3') }}</div>

      <!--
        Workspace option. Only meaningful when the adapter can
        actually route an import to the monorepo's source package
        (i.e. the dev-server adapter). In production builds the
        adapter advertises `canChooseWorkspace: false` and this
        row disappears entirely — there's nothing the user could
        do with it on a static-hosted site.
      -->
      <button
        v-if="capabilities.canChooseWorkspace"
        type="button"
        class="sdk-picker__option"
        :class="{ 'is-current': currentSource === 'workspace' }"
        :disabled="busy"
        @click="onSwitch('workspace')"
      >
        <div class="sdk-picker__option-main">
          <span class="sdk-picker__option-title">{{ t('Sdk.WorkspaceTitle', '本地源码') }}</span>
          <span class="sdk-picker__option-sub">{{ t('Sdk.WorkspaceSub', '使用仓库内 ui-component/packages 的源码（默认）') }}</span>
        </div>
        <span v-if="currentSource === 'workspace'" class="sdk-picker__check">●</span>
      </button>

      <div class="sdk-picker__divider">
        <span>{{ t('Sdk.OnlineTitle', 'npm 已发布版本') }}</span>
        <button
          type="button"
          class="sdk-picker__refresh"
          :disabled="busy || registryLoading"
          :title="registryLoading ? t('Sdk.Loading', '加载中…') : t('Sdk.Refresh', '从 npm 刷新版本列表')"
          @click="loadRegistry({ force: true })"
        >
          <span v-if="registryLoading">⟳</span>
          <span v-else>⟲</span>
        </button>
      </div>

      <!--
        Stable versions are listed first; prereleases (beta / rc /
        alpha / etc.) are folded into a collapsed `<details>` so the
        common case (operator wants to try a released version) stays
        uncluttered. Both lists are sorted newest-first.

        Each row carries up to two badges:
          - dist-tag badge ("latest", "beta", …) from the registry's
            `dist-tags`, when the version is the tag's current target.
          - channel badge ("stable" / "prerelease") inferred from
            semver — only shown for rows that don't already have a
            dist-tag badge to avoid double-labelling.

        Click semantics (see `onPickVersion`):
          - on disk + current      → no-op (close panel).
          - on disk + not current  → switch.
          - not on disk            → reinstall, then switch.
      -->
      <!--
        Scrollable wrapper for the stable-version list. We cap the
        height so the picker stays compact even when the registry
        returns 70+ versions; rows beyond that are reachable via
        normal vertical scroll. The wrapper is omitted when the list
        is empty so the empty-state div below sits flush against the
        divider.
      -->
      <div v-if="stableVersions.length" class="sdk-picker__version-scroll">
        <button
          v-for="entry in stableVersions"
          :key="entry.version"
          type="button"
          class="sdk-picker__option"
          :class="versionRowClass(entry)"
          :disabled="busy"
          :title="versionTitle(entry)"
          @click="onPickVersion(entry)"
        >
          <div class="sdk-picker__option-main">
            <span class="sdk-picker__option-row">
              <span class="sdk-picker__option-title">{{ entry.version }}</span>
              <span
                v-for="b in entry.badges"
                :key="b.kind"
                class="sdk-picker__badge"
                :class="`sdk-picker__badge--${b.kind}`"
              >{{ b.label }}</span>
            </span>
            <span class="sdk-picker__option-sub">{{ versionSubLabel(entry) }}</span>
          </div>
          <span
            v-if="currentSource === 'online' && currentVersion === entry.version"
            class="sdk-picker__check"
          >●</span>
        </button>
      </div>
      <div
        v-else-if="!registryLoading && !installed.length"
        class="sdk-picker__empty"
      >
        {{ t('Sdk.NoVersions', '暂无已发布版本') }}
      </div>
      <div v-if="registryLoading && !stableVersions.length" class="sdk-picker__empty">
        {{ t('Sdk.LoadingVersions', '正在从 npm 加载版本列表…') }}
      </div>
      <p v-if="registryError" class="sdk-picker__hint sdk-picker__hint--warn">
        {{ t('Sdk.NpmError', '无法访问 npm') }}（{{ registryError }}），{{ t('Sdk.NpmErrorSuffix', '仅显示本地已安装的版本') }}
      </p>

      <details v-if="prereleaseVersions.length" class="sdk-picker__prerelease">
        <summary>
          {{ t('Sdk.Prereleases', '预发布版本') }}（{{ prereleaseVersions.length }}）
        </summary>
        <div class="sdk-picker__version-scroll sdk-picker__version-scroll--prerelease">
          <button
            v-for="entry in prereleaseVersions"
            :key="entry.version"
            type="button"
            class="sdk-picker__option"
            :class="versionRowClass(entry)"
            :disabled="busy"
            :title="versionTitle(entry)"
            @click="onPickVersion(entry)"
          >
            <div class="sdk-picker__option-main">
              <span class="sdk-picker__option-row">
                <span class="sdk-picker__option-title">{{ entry.version }}</span>
                <span
                  v-for="b in entry.badges"
                  :key="b.kind"
                  class="sdk-picker__badge"
                  :class="`sdk-picker__badge--${b.kind}`"
                >{{ b.label }}</span>
              </span>
              <span class="sdk-picker__option-sub">{{ versionSubLabel(entry) }}</span>
            </div>
            <span
              v-if="currentSource === 'online' && currentVersion === entry.version"
              class="sdk-picker__check"
            >●</span>
          </button>
        </div>
      </details>

      <!--
        Missing-export details for the currently-resolved online
        version. Purely informational — we no longer block the
        switch on these. Shown when the operator opens the picker
        AFTER having already switched to an incompatible version,
        so they can see at a glance which cards will be greyed out.
      -->
      <details
        v-if="capabilities.canShowCompatibility && depsMissing.length"
        class="sdk-picker__missing"
      >
        <summary>
          ⚠ {{ t('Sdk.MissingExports', '当前 SDK 缺少') }} {{ depsMissing.length }} {{ t('Sdk.MissingExportsSuffix', '个 demo 依赖的导出') }}
        </summary>
        <ul class="sdk-picker__missing-list">
          <li v-for="m in depsMissing.slice(0, 20)" :key="`${m.entry}::${m.name}`">
            <code>{{ m.name }}</code>
            <span class="sdk-picker__missing-from">from <code>{{ m.entry }}</code></span>
          </li>
          <li v-if="depsMissing.length > 20" class="sdk-picker__missing-more">
            …{{ t('Sdk.MissingMore', '还有') }} {{ depsMissing.length - 20 }} {{ t('Sdk.MissingMoreSuffix', '个') }}
          </li>
        </ul>
      </details>

      <!--
        Peer dependency summary for the currently materialised online
        version. Surfaces the full dep graph that `install-online-sdk.mjs`
        pinned so reviewers can confirm at a glance which versions of
        `@tencentcloud/lite-chat`, `@tencentcloud/tui-core-lite`, etc.
        the session is actually loading.
      -->
      <details
        v-if="capabilities.canShowPeers && depsSummary.length"
        class="sdk-picker__deps"
      >
        <summary>
          {{ t('Sdk.Peers', '关联依赖') }}（{{ depsSummary.length }}）
        </summary>
        <ul class="sdk-picker__deps-list">
          <li v-for="d in depsSummary" :key="d.name">
            <code class="sdk-picker__deps-name">{{ d.name }}</code>
            <span class="sdk-picker__deps-resolved">{{ d.resolved || '—' }}</span>
            <span class="sdk-picker__deps-range">{{ d.range }}</span>
          </li>
        </ul>
      </details>

      <!--
        Install new version. Dev-only — production builds load any
        registry version on the fly via esm.sh, so there's nothing
        to install up-front; the adapter advertises
        `canInstall: false` and we hide the input.
      -->
      <div v-if="capabilities.canInstall" class="sdk-picker__install">
        <input
          v-model="installVersionInput"
          type="text"
          :placeholder="t('Sdk.InstallPlaceholder', '如 6.2.5 / latest / next')"
          :disabled="busy"
          @keydown.enter="onInstall()"
        />
        <button
          type="button"
          :disabled="busy || !installVersionInput.trim()"
          @click="onInstall()"
        >
          {{ installing ? t('Sdk.Installing', '安装中…') : t('Sdk.Install', '安装') }}
        </button>
      </div>

      <p v-if="errorMessage" class="sdk-picker__error">{{ errorMessage }}</p>
      <p v-else-if="hint" class="sdk-picker__hint">{{ hint }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import type {
  DepsManifest,
  InstalledEntry,
  MissingExport,
  SdkSource,
} from './adapter/index';
import { createSdkSourceAdapter } from './adapter/select';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';

const { t } = useUIKit();

// The adapter is selected once per page lifecycle. `createSdkSourceAdapter`
// internally branches on `import.meta.env.PROD` and tree-shakes the
// unused implementation, so the dev bundle never imports the
// importmap path and vice versa.
const adapter = createSdkSourceAdapter();
const capabilities = adapter.capabilities;

// Build-time defaults injected by `vite.config.ts` via `define`. Once
// the picker has fetched the live state from the adapter they become
// a fallback only — the real source of truth is the adapter.
const initialSource = (import.meta.env.VITE_ATOMICX_SOURCE as SdkSource) || 'workspace';
const initialVersion = (import.meta.env.VITE_ATOMICX_VERSION as string) || 'workspace';

const open = ref(false);
const installing = ref(false);
const switching = ref(false);
const restarting = ref(false);
const installVersionInput = ref('');
const errorMessage = ref('');
const hint = ref('');
const installed = ref<InstalledEntry[]>([]);
const deps = ref<DepsManifest | null>(null);
const currentSource = ref<SdkSource>(initialSource);
const currentVersion = ref<string>(initialVersion);
const trigger = ref<HTMLButtonElement | null>(null);
// The target the operator is moving TO during a switch/install. We
// surface it on the overlay so they can confirm what's loading.
// Cleared when the operation finishes (or fails).
const pendingTarget = ref<{ source: SdkSource; version?: string } | null>(null);

// Registry data — populated by `loadRegistry`. We fetch it the first
// time the picker is opened and on explicit refresh; the dev server
// caches it for 5 minutes so re-opens are basically free.
const registryVersions = ref<string[]>([]);
const registryDistTags = ref<Record<string, string>>({});
const registryTime = ref<Record<string, string>>({});
const registryLoading = ref(false);
const registryError = ref('');
let registryLoaded = false;

const busy = computed(() => installing.value || switching.value || restarting.value);

/**
 * Identify a version as a semver prerelease ("X.Y.Z-foo.N") vs. a
 * regular release ("X.Y.Z"). We use a simple regex rather than a
 * semver lib to keep the dep surface zero — the format is
 * standardised and any real registry would reject non-conforming
 * versions before publish.
 */
function isPrerelease(version: string): boolean {
  return /-/u.test(version);
}

/**
 * Extract the prerelease channel label ("beta", "rc", "alpha", …)
 * from a version string. Returns null for stable releases.
 *   "6.2.6-beta.2"   → "beta"
 *   "5.10.0-rc.1"    → "rc"
 *   "6.2.6"          → null
 */
function prereleaseChannel(version: string): string | null {
  const m = version.match(/^[^-]+-([a-z]+)/iu);
  return m ? m[1].toLowerCase() : null;
}

/**
 * Compare two semver strings, newest-first. We split on `-` to
 * separate the core triple from the prerelease tag, compare cores
 * numerically, then break ties using prerelease ordering (no
 * prerelease > any prerelease — that's how npm's "latest" beats
 * "latest-beta").
 *
 * This is good enough for our use case (displaying a sorted list);
 * we don't need exact `compare-versions` correctness for build
 * metadata, intersecting ranges, etc.
 */
function compareVersionsDesc(a: string, b: string): number {
  const [ac, ap = ''] = a.split('-');
  const [bc, bp = ''] = b.split('-');
  const an = ac.split('.').map(n => Number.parseInt(n, 10) || 0);
  const bn = bc.split('.').map(n => Number.parseInt(n, 10) || 0);
  const len = Math.max(an.length, bn.length);
  for (let i = 0; i < len; i++) {
    const av = an[i] || 0;
    const bv = bn[i] || 0;
    if (av !== bv) return bv - av;
  }
  // Cores equal → stable wins over prerelease.
  if (!ap && bp) return -1;
  if (ap && !bp) return 1;
  if (ap === bp) return 0;
  // Both prereleases: lexicographic descending.
  return ap < bp ? 1 : -1;
}

/**
 * Format a version's publish timestamp ("Apr 12, 2025") from the
 * registry's `time` map. Returns an empty string when unavailable.
 */
function formatPublishDate(version: string): string {
  const iso = registryTime.value?.[version];
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface VersionEntry {
  version: string;
  installed: boolean; // currently materialised on disk?
  inHistory: boolean; // ever installed locally?
  inRegistry: boolean; // present in the npm registry?
  distTags: string[]; // dist-tags pointing at this version
  badges: { kind: string; label: string }[];
}

/**
 * Build the merged "what to show in the dropdown" list.
 *
 * Sources, in priority order for each version row:
 *   1. `installed` (from `/__sdk/state`) — knows on-disk + history.
 *   2. `registryVersions` (from `/__sdk/registry`) — knows what
 *      exists upstream.
 *
 * A version present in either source becomes a row; both sources
 * contribute flags (`installed`, `inHistory`, `inRegistry`,
 * `distTags`) used to render badges + sub-labels.
 */
const allVersions = computed<VersionEntry[]>(() => {
  const map = new Map<string, VersionEntry>();
  // Reverse the dist-tags map: version → [tag, tag, …].
  const tagsByVersion = new Map<string, string[]>();
  for (const [tag, v] of Object.entries(registryDistTags.value)) {
    if (typeof v !== 'string') continue;
    const list = tagsByVersion.get(v) || [];
    list.push(tag);
    tagsByVersion.set(v, list);
  }
  function ensure(version: string): VersionEntry {
    let e = map.get(version);
    if (!e) {
      e = {
        version,
        installed: false,
        inHistory: false,
        inRegistry: false,
        distTags: tagsByVersion.get(version) || [],
        badges: [],
      };
      map.set(version, e);
    }
    return e;
  }
  // Local entries first: they tell us about disk state.
  for (const v of installed.value) {
    const e = ensure(v.version);
    e.installed = v.installed;
    e.inHistory = true;
  }
  // Then registry — fills in versions we've never installed locally
  // and marks the ones we have as also-upstream.
  for (const v of registryVersions.value) {
    const e = ensure(v);
    e.inRegistry = true;
  }
  // Compute badges. Priority: dist-tags > stable/prerelease.
  for (const e of map.values()) {
    for (const tag of e.distTags) {
      // Tag names like `latest` get a dedicated colour; everything
      // else (beta, next, rc, legacy-*) shares a neutral style.
      const kind = tag === 'latest' ? 'latest' : 'tag';
      e.badges.push({ kind, label: tag });
    }
    if (!e.badges.length) {
      const channel = prereleaseChannel(e.version);
      if (channel) {
        e.badges.push({ kind: 'prerelease', label: channel });
      }
      // We deliberately DO NOT add a "stable" badge for plain releases
      // — every non-prerelease without a dist-tag would otherwise be
      // visually noisy. Stable is the implicit default.
    }
  }
  const list = Array.from(map.values());
  list.sort((a, b) => compareVersionsDesc(a.version, b.version));
  return list;
});

const stableVersions = computed(() => allVersions.value.filter(v => !isPrerelease(v.version)));
const prereleaseVersions = computed(() => allVersions.value.filter(v => isPrerelease(v.version)));

/**
 * Phase-specific copy for the full-page loading overlay. The three
 * phases (install → switch → restart) cascade one after the other
 * for a "reinstall & switch" click, so we let the most-progressed
 * one win — `restarting` is last so it takes precedence over the
 * earlier two.
 */
const overlayTitle = computed(() => {
  const target = pendingTarget.value;
  const targetLabel = target
    ? target.source === 'online'
      ? `tuikit-atomicx-vue3@${target.version}`
      : t('Sdk.LocalSource', '本地源码')
    : '';
  if (restarting.value) {
    return targetLabel
      ? `${t('Sdk.OverlayRestarting', '正在切换到')} ${targetLabel}…`
      : t('Sdk.OverlayRestartingGeneric', '正在切换 SDK 版本…');
  }
  if (switching.value) {
    return targetLabel
      ? `${t('Sdk.OverlaySwitching', '正在切换到')} ${targetLabel}…`
      : t('Sdk.OverlaySwitchingGeneric', '正在切换 SDK 源…');
  }
  if (installing.value) {
    return targetLabel
      ? `${t('Sdk.OverlayInstalling', '正在安装')} ${targetLabel}…`
      : t('Sdk.OverlayInstallingGeneric', '正在安装 SDK…');
  }
  return '';
});
const overlaySubtitle = computed(() => {
  if (restarting.value) return t('Sdk.OverlayRestartSub', 'Vite 正在重启，页面将自动刷新');
  if (switching.value) return t('Sdk.OverlaySwitchSub', 'Vite 即将重启');
  if (installing.value) return t('Sdk.OverlayInstallSub', '正在通过 npm 下载包及关联依赖，可能需要一分钟');
  return '';
});

/**
 * Flat list of `{entry, name}` pairs the demo uses but the active
 * SDK doesn't export — read from the dev plugin's
 * `.deps.compatibility.missing`. We expose it both for the
 * "compat info" details block and for the per-card greying out
 * logic upstream.
 */
const depsMissing = computed<MissingExport[]>(() => {
  if (currentSource.value !== 'online') return [];
  const m = deps.value?.compatibility?.missing;
  return Array.isArray(m) ? m : [];
});

/**
 * Compact summary of the dep graph carried by the currently materialised
 * online version. Renders into a tooltip-style block beneath the
 * "Online" section so reviewers can confirm exactly which dep versions
 * the test session is exercising.
 */
const depsSummary = computed<Array<{ name: string; range: string; resolved: string | null }>>(() => {
  if (!deps.value) return [];
  return Object.entries(deps.value.peers).map(([name, rec]) => ({
    name,
    range: rec.range,
    resolved: rec.resolved,
  }));
});

/**
 * One-line summary of the compat result baked into `.deps.json` —
 * used to label each version row in the option list.
 */
const incompatibleSummary = computed<string>(() => {
  const compat = deps.value?.compatibility;
  if (!compat || compat.ok || !compat.missing) return '';
  return `${compat.missing.length}`;
});

/**
 * Per-version compatibility lookup. We use `.deps.json` as the
 * source of truth: it reflects the LAST install, which is also the
 * version currently materialised on disk and therefore the one that
 * can be switched to right now. Older history entries can't be
 * switched to without re-install, so their compat is moot.
 */
function isIncompatibleVersion(version: string): boolean {
  const compat = deps.value?.compatibility;
  const sdkVer = deps.value?.sdk?.version;
  if (!compat || compat.ok || !sdkVer) return false;
  return sdkVer === version && Array.isArray(compat.missing) && compat.missing.length > 0;
}

function versionTitle(entry: VersionEntry): string {
  const lines: string[] = [];
  const date = formatPublishDate(entry.version);
  if (date) lines.push(`${t('Sdk.VersionPublished', '发布于')} ${date}`);
  if (entry.distTags.length) lines.push(`dist-tag: ${entry.distTags.join(', ')}`);
  if (entry.installed) {
    if (isIncompatibleVersion(entry.version)) {
      const compat = deps.value?.compatibility;
      const sample = compat?.missing?.slice(0, 5).map(m => `${m.name} (${m.entry})`).join('\n') || '';
      lines.push('', `${t('Sdk.VersionTitleIncompatiblePrefix', '缺少 demo 依赖的导出')}:`, sample);
      lines.push('', t('Sdk.VersionTitleIncompatibleSuffix', '点击仍可切换，受影响的 API 卡片将被禁用'));
    } else {
      lines.push(t('Sdk.VersionTitleOnDisk', '已下载到本地，点击切换'));
    }
  } else if (entry.inHistory) {
    lines.push(t('Sdk.VersionTitleReinstall', '之前安装过，点击重新安装并切换'));
  } else if (entry.inRegistry) {
    lines.push(t('Sdk.VersionTitleInstall', '点击安装并切换'));
  }
  return lines.filter(Boolean).join('\n');
}

/**
 * Row CSS class set. Combines current-selection state with
 * installation status:
 *   - `is-current`        : the version vite is currently resolving.
 *   - `is-on-disk`        : materialised under vendor/node_modules.
 *   - `is-unmaterialised` : known (history or registry) but needs
 *                           install before it can be activated.
 *   - `is-incompatible`   : currently active AND missing exports
 *                           the demo uses (so the user sees the
 *                           ⚠ on the row that's actually loaded).
 */
function versionRowClass(entry: VersionEntry) {
  return {
    'is-current': currentSource.value === 'online' && currentVersion.value === entry.version,
    'is-on-disk': entry.installed,
    'is-unmaterialised': !entry.installed,
    'is-incompatible': entry.installed && isIncompatibleVersion(entry.version),
  };
}

/**
 * Sub-label text shown under each version. Phase-aware: surfaces
 * "reinstalling…" on the specific row being reinstalled so the user
 * doesn't wonder which row triggered the overlay.
 */
function versionSubLabel(entry: VersionEntry): string {
  if (installing.value && pendingTarget.value?.version === entry.version) {
    return t('Sdk.VersionInstalling', '安装中…');
  }
  if (entry.installed) {
    if (isIncompatibleVersion(entry.version)) {
      return `⚠ ${t('Sdk.VersionIncompatible', '缺少')} ${incompatibleSummary.value} ${t('Sdk.VersionIncompatibleSuffix', '个导出 — 受影响的 API 卡片将被禁用')}`;
    }
    return t('Sdk.VersionOnDisk', '已下载 · 兼容');
  }
  const date = formatPublishDate(entry.version);
  if (entry.inHistory) {
    return date
      ? `${t('Sdk.VersionPreviously', '曾安装')} · ${date}`
      : `${t('Sdk.VersionPreviously', '曾安装')} · ${t('Sdk.VersionReinstallSwitch', '重新安装并切换')}`;
  }
  if (entry.inRegistry) {
    return date
      ? `${t('Sdk.VersionPublished', '发布于')} ${date} · ${t('Sdk.VersionInstallSwitch', '安装并切换')}`
      : t('Sdk.VersionInstallSwitch', '安装并切换');
  }
  return '';
}

/**
 * Unified click handler for version rows.
 *
 * Two operating regimes, gated on `capabilities.canInstall`:
 *
 * 1) Dev (`canInstall === true`) — version on disk = "installed":
 *      - on disk + current version    → no-op
 *      - on disk + other version      → switch (vite restart + reload)
 *      - not on disk                  → install (`npm i ...`), then switch
 *    The `installed` flag drives the install-first branch.
 *
 * 2) Prod (`canInstall === false`) — backed by esm.sh, no concept of
 *    "on disk" applies:
 *      - any version row click        → switch
 *    The adapter's switchTo() just writes `localStorage.atomicx.selectedVersion`
 *    and reloads; on the next page load `main.ts` composes a fresh
 *    `https://esm.sh/...@<version>?...` URL. esm.sh transparently
 *    builds any not-yet-cached version on first request (5-30s
 *    first time, then CDN-cached). We MUST NOT route through
 *    `onInstall` here — there is no install backend, and `onInstall`
 *    would refuse with "Install is not available in this build".
 */
async function onPickVersion(entry: VersionEntry) {
  if (busy.value) return;

  // Prod path: every version row is "selectable" — esm.sh handles
  // the underlying fetch on the next reload.
  if (!capabilities.canInstall) {
    await onSwitch('online', entry.version);
    return;
  }

  // Dev path: distinguish on-disk vs. history-only.
  if (entry.installed) {
    // Already on disk — straight switch. No-op when it's also the
    // current version (onSwitch detects this).
    await onSwitch('online', entry.version);
    return;
  }
  // Not on disk yet — install first, then switch. Piggy-back on the
  // existing `onInstall` so we share its error handling, overlay
  // wiring, and state refresh. We stash the version into the input
  // so `onInstall` finds it (and so the input visually reflects
  // what's being installed during the briefly-visible busy state).
  installVersionInput.value = entry.version;
  await onInstall({ andSwitch: true });
}

const triggerTitle = computed(() =>
  currentSource.value === 'online'
    ? `tuikit-atomicx-vue3@${currentVersion.value}\n${t('Sdk.TooltipOnline', '来自 npm 已发布版本，点击切换')}`
    : t('Sdk.TooltipWorkspace', 'tuikit-atomicx-vue3（本地源码）\n来自仓库内 ui-component/packages/uikit-component-vue3，点击切换'),
);

function toggle() {
  if (busy.value) return;
  open.value = !open.value;
  if (open.value) {
    errorMessage.value = '';
    hint.value = '';
    void refreshState();
    // Lazy-load the registry list the first time the panel opens.
    // Subsequent opens hit the server's 5-min cache so they're snappy.
    void loadRegistry();
  }
}

/**
 * Re-read the adapter's current state. Fast in both modes:
 *   - Dev: hits the in-memory `/__sdk/state` middleware.
 *   - Prod: synthesises from `__ATOMICX_BOOTSTRAP__` + localStorage.
 */
async function refreshState() {
  try {
    const data = await adapter.getState();
    installed.value = data.installed || [];
    deps.value = data.deps || null;
    currentSource.value = data.current.source;
    currentVersion.value = data.current.version || 'workspace';
  } catch (err) {
    errorMessage.value = `${t('Sdk.LoadStateFailed', '加载 SDK 状态失败')}: ${(err as Error).message}`;
  }
}

/**
 * Pull the published-version list.
 *
 *   - Dev: the dev plugin's `/__sdk/registry` (5-min server cache).
 *   - Prod: `registry.npmjs.org/<pkg>` directly from the browser
 *     (CORS-friendly; cached for the session inside the adapter).
 *
 * The first call from a fresh dev server boot can take 1-3s because
 * the dev plugin spawns `npm view`; in prod the registry packument
 * is a single HTTPS round-trip. We don't block the picker on either:
 * the panel renders immediately with whatever local data we have
 * and the version list fills in when it arrives.
 *
 * @param options.force Bypass the "already loaded once this session"
 *   guard — used by the refresh button.
 */
async function loadRegistry(options: { force?: boolean } = {}) {
  if (registryLoading.value) return;
  if (registryLoaded && !options.force) return;
  registryLoading.value = true;
  registryError.value = '';
  try {
    const data = await adapter.listRegistry({ force: options.force });
    registryError.value = '';
    registryVersions.value = data.versions || [];
    registryDistTags.value = data.distTags || {};
    registryTime.value = data.time || {};
    registryLoaded = true;
  } catch (err) {
    // Soft failure (network / registry down). We surface the error
    // but STILL mark the registry as loaded so we don't keep
    // retrying on every panel open. The user can hit refresh
    // manually.
    registryError.value = (err as Error).message;
    registryLoaded = true;
  } finally {
    registryLoading.value = false;
  }
}

/**
 * Install (or re-install) the version currently in the input field.
 *
 * @param options.andSwitch When true, automatically switch to the
 *   freshly-installed version after a successful install. This is
 *   what `onPickVersion` uses for "reinstall & switch" — without it,
 *   the user would have to click the row a second time after the
 *   install finishes.
 */
async function onInstall(options: { andSwitch?: boolean } = {}) {
  const version = installVersionInput.value.trim();
  if (!version) return;
  // Adapters that don't support install (prod) shouldn't reach
  // here in practice — the install input is hidden — but guard
  // defensively in case some other code path calls us.
  if (!capabilities.canInstall) {
    errorMessage.value = t('Sdk.NotAvailable', '当前构建不支持安装功能');
    return;
  }
  errorMessage.value = '';
  hint.value = '';
  // Surface the target on the overlay BEFORE flipping the busy flag
  // so the loading card materialises with the correct label on its
  // first frame.
  pendingTarget.value = { source: 'online', version };
  installing.value = true;
  try {
    const result = await adapter.install(version);
    installed.value = result.installed || installed.value;
    deps.value = result.deps ?? deps.value;
    const resolved = result.resolved || version;
    installVersionInput.value = '';
    if (options.andSwitch) {
      // The install is done — clear `installing` BEFORE calling
      // `onSwitch`. Otherwise `onSwitch`'s `if (busy.value) return`
      // guard would early-out (busy stays truthy until this
      // function's `finally`), and the requested switch would
      // silently never fire.
      installing.value = false;
      // Keep `pendingTarget` populated so the overlay text smoothly
      // transitions from "Installing…" to "Switching…" / "Reloading…"
      // for the same target without a flicker through an empty
      // label.
      pendingTarget.value = { source: 'online', version: resolved };
      // Switch immediately — `onSwitch` itself flips `restarting`
      // and dismisses the panel, so we don't even need to surface a
      // success hint here.
      await onSwitch('online', resolved);
      // Bail before the `finally` so we don't redundantly clear
      // `installing` again (already done above).
      return;
    }
    hint.value = `${t('Sdk.Installed', '已安装')} ${resolved}${t('Sdk.InstalledClickToSwitch', '，点击上方对应版本切换')}`;
  } catch (err) {
    errorMessage.value = `${t('Sdk.InstallFailed', '安装失败')}: ${(err as Error).message}`;
  } finally {
    installing.value = false;
    // Only clear the target if we're not handing off to onSwitch
    // (which keeps owning it through restart). On a normal install-
    // only path, the install is done and the target is no longer
    // relevant.
    if (!options.andSwitch) {
      pendingTarget.value = null;
    }
  }
}

/**
 * Issue a switch to the given source/version. Always succeeds at
 * the protocol level: the dev plugin no longer rejects on compat
 * grounds — instead, the missing-export shim plugin keeps the app
 * running and only the affected example groups become disabled.
 * That's why this is a single straight-line happy path; there's
 * no "compat blocker" branch anymore.
 */
async function onSwitch(source: SdkSource, version?: string) {
  if (busy.value) return;
  // No-op when already on this target.
  if (
    source === currentSource.value
    && (source === 'workspace' || version === currentVersion.value)
  ) {
    open.value = false;
    return;
  }
  errorMessage.value = '';
  hint.value = '';
  pendingTarget.value = { source, version };
  switching.value = true;
  try {
    await adapter.switchTo({ source, version });
    // Vite (dev) will restart momentarily; the WS reconnect
    // triggers a full reload, after which the new SDK bundle is
    // live. Production adapter does `localStorage` + `reload()`
    // synchronously. Either way we INTENTIONALLY leave `restarting`
    // and `pendingTarget` set — the overlay must stay up until the
    // browser actually reloads. They'll be discarded along with
    // the page.
    restarting.value = true;
    open.value = false;
  } catch (err) {
    errorMessage.value = `${t('Sdk.SwitchFailed', '切换失败')}: ${(err as Error).message}`;
    // Failure means no restart is coming — drop the overlay so the
    // UI is interactive again.
    pendingTarget.value = null;
  } finally {
    switching.value = false;
  }
}

/**
 * Click-outside listener. We don't use `v-click-outside`-style
 * directives to keep the dep surface minimal; a single document
 * listener is plenty for this one component.
 */
function onDocClick(e: MouseEvent) {
  if (!open.value) return;
  const root = trigger.value?.parentElement;
  if (root && !root.contains(e.target as Node)) {
    open.value = false;
  }
}

onMounted(() => {
  document.addEventListener('mousedown', onDocClick);
  // Best-effort initial load so the badge label matches whatever the
  // user picked in a previous session. The `define`-injected values are
  // correct for THIS process, but a server restart may have happened in
  // a stale tab — refreshing here closes that loop.
  void refreshState();
  // Subscribe to the plugin's custom HMR event so the picker can show
  // "restarting…" immediately, without waiting for the websocket to
  // actually reconnect.
  if (import.meta.hot) {
    import.meta.hot.on('sdk-switcher:will-restart', () => {
      restarting.value = true;
      // Hard-reload fallback. Vite's `server.restart()` makes the WS
      // server drop and reconnect, but in vite 5.x it does NOT
      // automatically issue a `window.location.reload()` on
      // reconnect — the page can end up holding on to stale ESM
      // module imports (the very `.vite/deps/<pkg>.js?v=<oldhash>`
      // URLs that triggered today's bug). We schedule our own
      // reload a beat after the server has had time to come back
      // up. 800ms is empirically enough for a typical vite restart
      // on a warm machine; if the server still isn't ready, the
      // browser will fail-and-retry on its own.
      setTimeout(() => {
        window.location.reload();
      }, 800);
    });
    // When vite finishes restarting and triggers a full reload, the
    // page is replaced wholesale — no cleanup needed; this handler is
    // just a hint.
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocClick);
});
</script>

<style scoped lang="scss">
.sdk-picker {
  position: relative;
  display: inline-block;

  &__trigger {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    font-size: 11px;
    font-weight: 500;
    color: inherit;
    cursor: pointer;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 12px;
    transition: filter 0.15s ease, background 0.15s ease, border-color 0.15s ease;

    &:hover:not(:disabled) {
      filter: brightness(0.97);
    }

    &:disabled {
      cursor: progress;
      opacity: 0.7;
    }

    &--workspace {
      color: #1e3a8a;
      background: #dbeafe;

      .sdk-picker__dot { background: #1c66e5; }
    }

    &--online {
      color: #b45309;
      background: #fef3c7;

      .sdk-picker__dot { background: #d97706; }
    }
  }

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  // Tiny spinner that replaces the status dot in the trigger button
  // while the dev server is restarting. Same physical size as the
  // dot so the trigger doesn't visually jump on phase change.
  &__spinner {
    width: 10px;
    height: 10px;
    border: 1.5px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    opacity: 0.7;
    animation: sdk-picker-spin 0.8s linear infinite;
  }

  &__label { white-space: nowrap; }
  &__caret { opacity: 0.7; }

  &__panel {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    z-index: 50;
    width: 280px;
    padding: 8px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
  }

  &__panel-head {
    padding: 4px 8px 6px;
    font-size: 11px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__divider {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 6px 8px 4px;
    padding-top: 6px;
    font-size: 11px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-top: 1px solid #f1f3f6;
  }

  &__refresh {
    padding: 2px 6px;
    font-size: 12px;
    color: #6b7280;
    cursor: pointer;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 4px;
    transition: color 0.12s ease, background 0.12s ease;

    &:hover:not(:disabled) {
      color: #1c66e5;
      background: #eef4ff;
    }
    &:disabled {
      cursor: progress;
      opacity: 0.5;
    }
  }

  // Scroll container for the version list. Caps the panel height
  // even when the registry returns dozens of releases (today's
  // package is ~75 versions). Without a cap the dropdown would
  // exceed the viewport and the install/peers blocks below would
  // require scrolling the whole window.
  //
  // The padding-right reserves space for the native scrollbar on
  // platforms that overlay it (macOS / iOS) so option rows don't
  // shift horizontally when scroll appears.
  &__version-scroll {
    max-height: 260px;
    margin: 0 -2px; // pull rows flush with the panel edges
    padding: 0 2px;
    overflow-y: auto;
    overscroll-behavior: contain;

    // Thin, neutral scrollbar that fits the panel aesthetic.
    scrollbar-width: thin;
    scrollbar-color: #d1d5db transparent;

    &::-webkit-scrollbar { width: 6px; }
    &::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 3px;
    }
    &::-webkit-scrollbar-thumb:hover {
      background: #9ca3af;
    }
    &::-webkit-scrollbar-track { background: transparent; }

    // Prerelease list is folded inside a <details>; it gets a
    // tighter cap so opening it doesn't dwarf the stable list above.
    &--prerelease {
      max-height: 200px;
      margin-top: 4px;
    }
  }

  &__option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 7px 10px;
    font-size: 12px;
    text-align: left;
    color: #1f2937;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.12s ease;

    &:hover:not(:disabled) { background: #f3f4f6; }

    &.is-current {
      background: #e1ecff;
      color: #1c66e5;
      font-weight: 600;
    }

    // History entry not currently materialised on disk. Still
    // clickable (we re-install on the fly) but visually toned down
    // so the operator can tell at a glance which version is "live"
    // and which is "would need a reinstall".
    &.is-unmaterialised {
      .sdk-picker__option-title { color: #6b7280; }
      .sdk-picker__option-sub { color: #9ca3af; font-style: italic; }
    }

    &:disabled { cursor: not-allowed; opacity: 0.5; }
  }

  &__option-main {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  // Row holding the version number and any badges; flex layout so
  // badges sit to the right of the version, vertically centred.
  &__option-row {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  &__option-title {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__option-sub {
    font-size: 10px;
    color: #9ca3af;
  }

  // Version badges. We use small pill shapes; colour encodes meaning.
  //   - latest      : the primary "go use this" tag — blue.
  //   - tag         : every other dist-tag (beta / next / legacy-*) — grey.
  //   - prerelease  : inferred from semver when there's no dist-tag — amber.
  &__badge {
    display: inline-flex;
    align-items: center;
    flex: 0 0 auto;
    padding: 1px 6px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 9px;
    font-weight: 600;
    line-height: 1.4;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-radius: 999px;

    &--latest {
      color: #1c66e5;
      background: #e1ecff;
      border: 1px solid #c7dafe;
    }
    &--tag {
      color: #4b5563;
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
    }
    &--prerelease {
      color: #b45309;
      background: #fef3c7;
      border: 1px solid #fcd34d;
    }
  }

  &__check {
    font-size: 8px;
    color: #1c66e5;
  }

  &__empty {
    padding: 8px 10px;
    font-size: 12px;
    color: #9ca3af;
  }

  &__option {
    &.is-incompatible {
      .sdk-picker__option-title { color: #b45309; }
      .sdk-picker__option-sub { color: #b45309; }
    }
  }

  &__missing {
    margin: 8px 8px 4px;
    padding: 6px 10px;
    background: #fef3c7;
    border: 1px solid #fcd34d;
    border-radius: 8px;
    font-size: 11px;
    color: #92400e;

    summary {
      font-weight: 600;
      cursor: pointer;
      user-select: none;
    }
  }

  &__missing-list {
    max-height: 140px;
    margin: 6px 0 0;
    padding: 0;
    overflow: auto;
    list-style: none;

    li {
      padding: 3px 0;
      font-size: 11px;
      color: #78350f;

      code {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-weight: 600;
      }
    }
  }

  &__missing-from {
    margin-left: 6px;
    font-size: 10px;
    color: #a16207;

    code {
      font-weight: 400;
    }
  }

  &__missing-more {
    color: #a16207;
    font-style: italic;
  }

  &__deps {
    padding: 6px 10px 0;
    margin: 6px 0 0;
    font-size: 11px;
    color: #4b5563;

    summary {
      font-weight: 600;
      color: #6b7280;
      cursor: pointer;
      user-select: none;
    }
  }

  &__deps-list {
    max-height: 160px;
    margin: 6px 0 0;
    padding: 0;
    overflow: auto;
    list-style: none;

    li {
      display: grid;
      grid-template-columns: 1fr auto;
      grid-template-rows: auto auto;
      gap: 0 8px;
      padding: 4px 0;
      border-bottom: 1px dashed #f1f3f6;

      &:last-child { border-bottom: none; }
    }
  }

  &__deps-name {
    grid-column: 1 / 2;
    grid-row: 1 / 2;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__deps-resolved {
    grid-column: 2 / 3;
    grid-row: 1 / 2;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-weight: 600;
    color: #16a34a;
  }

  &__deps-range {
    grid-column: 1 / 3;
    grid-row: 2 / 3;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10px;
    color: #9ca3af;
  }

  &__install {
    display: flex;
    gap: 6px;
    padding: 8px 8px 4px;
    border-top: 1px solid #f1f3f6;
    margin-top: 6px;

    input {
      flex: 1;
      min-width: 0;
      padding: 5px 8px;
      font-size: 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
    }

    button {
      padding: 5px 10px;
      font-size: 12px;
      font-weight: 500;
      color: #fff;
      cursor: pointer;
      background: #1c66e5;
      border: none;
      border-radius: 6px;

      &:disabled { background: #9db8ec; cursor: not-allowed; }
    }
  }

  &__error {
    padding: 6px 10px 0;
    margin: 4px 0 0;
    font-size: 11px;
    color: #b91c1c;
  }

  &__hint {
    padding: 6px 10px 0;
    margin: 4px 0 0;
    font-size: 11px;
    color: #16a34a;

    // Same component, different colour, used to surface non-fatal
    // problems (e.g. "couldn't reach npm").
    &--warn { color: #b45309; }
  }

  // Collapsible prereleases section. We style the summary to match
  // the divider (uppercase, dim) and rein in the default `<details>`
  // marker so it fits with the rest of the panel.
  &__prerelease {
    margin: 4px 8px 0;
    padding-top: 6px;
    border-top: 1px solid #f1f3f6;
    font-size: 11px;

    > summary {
      padding: 2px 0 4px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      cursor: pointer;
      user-select: none;
    }

    > summary::-webkit-details-marker { display: none; }
    > summary::marker { content: ''; }
    > summary::before {
      content: '▸ ';
      display: inline-block;
      margin-right: 2px;
      transition: transform 0.15s ease;
    }
    &[open] > summary::before {
      transform: rotate(90deg);
    }
  }
}

// Full-page loading overlay. NOT nested under `.sdk-picker` because
// it lives in `<teleport to="body">` — Vue 3 scoped styles still
// reach teleported nodes (they inherit the scope attribute), but
// the selector must be a sibling of the picker root, not a child.
.sdk-picker-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(2px);
  // Fade-in keeps a flash of "click → nothing → overlay" from
  // looking abrupt. 120ms is just long enough to feel intentional
  // without lagging the actual loading work.
  animation: sdk-picker-overlay-in 0.12s ease-out;

  &__card {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 260px;
    max-width: 420px;
    padding: 16px 20px;
    background: #ffffff;
    border-radius: 10px;
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.25);
  }

  &__spinner {
    flex: 0 0 auto;
    width: 22px;
    height: 22px;
    border: 2.5px solid #c7d2fe;
    border-top-color: #1c66e5;
    border-radius: 50%;
    animation: sdk-picker-spin 0.8s linear infinite;
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__title {
    font-size: 13px;
    font-weight: 600;
    color: #1f2937;
    line-height: 1.3;
    overflow-wrap: anywhere;
  }

  &__subtitle {
    font-size: 11px;
    color: #6b7280;
    line-height: 1.4;
  }
}

@keyframes sdk-picker-spin {
  to { transform: rotate(360deg); }
}

@keyframes sdk-picker-overlay-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
