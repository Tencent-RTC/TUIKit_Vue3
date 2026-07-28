<template>
  <section class="card">
    <header class="card__head">
      <div class="card__title-row">
        <h2 class="card__title">{{ example.api }}</h2>
        <span v-if="example.deprecated" class="card__badge deprecated">deprecated</span>
        <!--
          Role tags — only rendered for cards that target a strict
          subset of roles. See `visibleRoles` computed for the "hide
          when for-everyone" rationale.
        -->
        <span
          v-for="role in visibleRoles"
          :key="role"
          :class="['card__badge', 'role', `role-${role}`]"
        >{{ roleLabelT(role) }}</span>
      </div>
      <p v-if="example.description" class="card__desc">
        <RichText :text="t(cardKey(example.id, 'Desc'), example.description)" />
      </p>
    </header>

    <div class="card__section">
      <div class="card__section-title">{{ t('Card.ApiSignature', 'API 签名') }}</div>
      <pre class="card__signature">{{ example.signature }}</pre>
    </div>

    <div v-if="example.fields && example.fields.length" class="card__section">
      <div class="card__section-title">{{ t('Card.Inputs', 'Inputs') }}</div>
      <div class="card__fields">
        <label
          v-for="field in example.fields"
          :key="field.key"
          :class="[
            'field',
            { 'field--flash': autoFillFlash[field.key] },
            // Multi-line JSON payloads (rows > 1) get a full-row grid
            // cell so a pre-populated field checklist gets the entire
            // card's inner width, not just the narrow 260px auto-fill
            // track. Single-row JSON fields keep the shared column
            // grid so they line up next to text/number siblings.
            { 'field--wide': field.type === 'json' && (field.rows ?? 1) > 1 },
          ]"
        >
          <span class="field__label">
            <span class="field__name">{{ t(cardKey(example.id, `Field${toPascal(field.key)}`), field.label) }}</span>
            <em v-if="field.autoFillFromEvent" class="field__auto" :title="t('Card.AutoFillTitle', '将随事件自动填充')">{{ t('Card.AutoFill', '自动填充') }}</em>
          </span>
          <!--
            Help text used to be an inline `<em>` inside the label. That
            works for 3-word hints ("留空用顶部 liveId"), but breaks
            visually when the hint runs to a full sentence — the text
            wraps under the input row, sits mid-height with the label,
            and blurs the "name vs description" hierarchy. Promoting
            it to a block sibling below the label gives it its own
            line(s) and a clear visual step below the name.

            Fields without help still render an empty placeholder so
            the DOM shape stays "label / help / control" for every
            field. Combined with `.card__fields { align-items:
            stretch }` and `.field > .control { margin-top: auto }`,
            this pins every field's control to a shared bottom edge
            regardless of how tall the tallest sibling's help is.
          -->
          <span v-if="field.help" class="field__help"><RichText :text="t(cardKey(example.id, `Field${toPascal(field.key)}Help`), field.help)" /></span>
          <span v-else class="field__help field__help--placeholder" aria-hidden="true"></span>
          <input
            v-if="field.type === 'text'"
            v-model="inputs[field.key]"
            type="text"
            :class="{ 'field__input--error': field.noChinese && hasChinese(inputs[field.key]) }"
            :placeholder="field.placeholder != null ? t(cardKey(example.id, `Field${toPascal(field.key)}Placeholder`), field.placeholder) : undefined"
          />
          <input
            v-else-if="field.type === 'number'"
            v-model.number="inputs[field.key]"
            type="number"
            :placeholder="field.placeholder != null ? t(cardKey(example.id, `Field${toPascal(field.key)}Placeholder`), field.placeholder) : undefined"
          />
          <input
            v-else-if="field.type === 'boolean'"
            v-model="inputs[field.key]"
            type="checkbox"
          />
          <select v-else-if="field.type === 'select'" v-model="inputs[field.key]">
            <option
              v-for="opt in resolveOptions(field)"
              :key="String(opt.value)"
              :value="opt.value"
            >
              {{ t(cardKey(example.id, `Field${toPascal(field.key)}Opt${String(opt.value)}`), opt.label) }}
            </option>
          </select>
          <!--
            `pretty-select`: custom dropdown for enums where the
            native <select> UX is inadequate. Two motivating flaws:
            (1) macOS Chrome/Safari flips the native popup upward
                when downward space is tight and overlays the anchor
                with the current option — see the "dropdown covers
                itself" screenshot.
            (2) Native <option> can't carry a subtitle line, forcing
                us to smash "enum name + description" onto one row.
            Component is self-contained (see PrettySelect.vue) —
            positioning, keyboard nav, click-outside, ESC all live
            there so this card template stays declarative.
          -->
          <PrettySelect
            v-else-if="field.type === 'pretty-select'"
            :model-value="inputs[field.key]"
            :options="resolveOptions(field)"
            :aria-label="t(cardKey(example.id, `Field${toPascal(field.key)}`), field.label)"
            :key-prefix="field.options ? cardKey(example.id, `Field${toPascal(field.key)}`) : undefined"
            :placeholder="field.placeholder != null ? t(cardKey(example.id, `Field${toPascal(field.key)}Placeholder`), field.placeholder) : undefined"
            @update:model-value="inputs[field.key] = $event"
          />
          <!--
            `rich-select`: an icon-grid alternative to native <select> so cards
            like `live-gift.sendGift` can render each option's `iconUrl` +
            `meta`. The hidden input keeps `<label>` accessibility (clicking
            the label still focuses something) and gives us a single
            source-of-truth value via v-model.
          -->
          <div
            v-else-if="field.type === 'rich-select'"
            class="rich-select"
            role="radiogroup"
            :aria-label="t(cardKey(example.id, `Field${toPascal(field.key)}`), field.label)"
          >
            <button
              v-for="opt in resolveOptions(field)"
              :key="String(opt.value)"
              type="button"
              :class="['rich-select__item', { 'is-active': inputs[field.key] === opt.value, 'rich-select__item--no-icon': !opt.iconUrl }]"
              role="radio"
              :aria-checked="inputs[field.key] === opt.value"
              :title="t(cardKey(example.id, `Field${toPascal(field.key)}Opt${String(opt.value)}`), opt.label)"
              @click="inputs[field.key] = opt.value"
            >
              <span v-if="opt.iconUrl" class="rich-select__thumb">
                <img :src="opt.iconUrl" :alt="t(cardKey(example.id, `Field${toPascal(field.key)}Opt${String(opt.value)}`), opt.label)" loading="lazy" />
              </span>
              <span class="rich-select__text">
                <span class="rich-select__label">{{ t(cardKey(example.id, `Field${toPascal(field.key)}Opt${String(opt.value)}`), opt.label) }}</span>
                <span v-if="opt.meta" class="rich-select__meta">{{ t(cardKey(example.id, `Field${toPascal(field.key)}Opt${String(opt.value)}Meta`), opt.meta) }}</span>
              </span>
            </button>
          </div>
          <!--
            JSON field: rendered via CodeMirror 6 (see JsonEditor.vue).
            CM owns cursor / selection / IME / undo / scroll, so we
            get real syntax highlighting for JSON + `//` comments
            without the overlay-alignment / reactive-loop bugs the
            hand-rolled version produced.

            `rows` and `placeholder` map onto CM's min-height / place-
            holder extension respectively; `field.type === 'json'`
            gates this path so text/number/select fields are
            unaffected.
          -->
          <JsonEditor
            v-else-if="field.type === 'json'"
            :model-value="asString(inputs[field.key])"
            :rows="field.rows ?? 1"
            :placeholder="field.placeholder != null ? t(cardKey(example.id, `Field${toPascal(field.key)}Placeholder`), field.placeholder) : undefined"
            @update:model-value="inputs[field.key] = $event"
          />
        </label>
      </div>
    </div>

    <!--
      Generic "使用须知" panel driven by `example.notes`. Sits above the
      mount section (which has its own hard-coded LiveView / camera-test
      notes) so a card without a mount carrier — like `fetchLiveList` —
      can still surface mental-model / gotcha content in the same folded
      pattern integrators already learned from the joinLive card.
    -->
    <details v-if="example.notes" class="card__notes card__notes--standalone">
      <summary>{{ t('Card.UsageNotes', '使用须知') }} · {{ t(cardKey(example.id, 'NoteSummary'), example.notes.summary || example.api) }}</summary>
      <div
        v-for="(group, gi) in example.notes.groups"
        :key="gi"
        :class="['card__notes-group', `card__notes-group--${group.tone}`]"
      >
        <!--
          The group heading is redundant when there's only one group:
          the `<summary>` above already labels the whole panel, and a
          single tone-colored block doesn't need a section title to be
          understood. Keep the heading when there are 2+ groups so the
          tone colors alone don't have to carry the entire semantic
          load (e.g. fetchLiveList's must/env pair). `group.head` is
          optional in the type — authors of single-group notes can
          omit it entirely.
        -->
        <div
          v-if="example.notes.groups.length > 1 && group.head"
          class="card__notes-head"
        >{{ t(cardKey(example.id, `Note${gi}Head`), group.head) }}</div>
        <ul class="card__notes-list">
          <li v-for="(item, ii) in group.items" :key="ii"><RichText :text="t(cardKey(example.id, `Note${gi}Item${ii}`), item)" :card-id="example.id" :api-links="true" :seen="notesSeen" /></li>
        </ul>
      </div>
    </details>

    <div v-if="example.mount" class="card__section">
      <div class="card__section-title">
        {{ t('Card.RenderCarrier', '渲染载体') }} · {{ example.mount.kind === 'live-view' ? t('Card.LiveViewCarrier', 'LiveView 拉流（全局）') : t('Card.CameraCarrier', '本地摄像头预览（全局）') }}
      </div>
      <!--
        The stage-note is optional. Both live-view and camera-preview cards
        now use a global floating stage, so the stage-pill below tells the
        operator where the picture appears. The note is kept only when the
        example author provides a custom one.
      -->
      <p v-if="stageNote" class="card__stage-note">{{ t(cardKey(example.id, 'MountNote'), stageNote) }}</p>
      <!--
        Both `live-view` and `camera-preview` cards use App-level global
        stages (GlobalLiveStage / GlobalCameraStage). Show a status pill
        instead of a per-card DOM container — the stream persists across
        card switches and there is no per-card container to render.
      -->
      <div
        v-if="example.mount.kind === 'live-view'"
        :class="['card__stage-pill', { 'is-ready': hasJoinedLive }]"
      >
        <template v-if="hasJoinedLive">
          <span class="card__stage-pill__icon">●</span>
          {{ t('Card.LiveViewMountedLead', '全局 LiveView 已挂载（右下角） · 当前直播间') }}
          <code>{{ currentLiveId }}</code>
        </template>
        <template v-else>
          <span class="card__stage-pill__icon">○</span>
          {{ t('Card.LiveViewNotJoinedLead', '尚未进入直播间：观众先运行') }}
          <code>joinLive</code>
          {{ t('Card.LiveViewNotJoinedMid', '，主播先运行') }}
          <code>startLive</code>
          {{ t('Card.LiveViewNotJoinedTail', '，进房后右下角会自动出现拉流画面。') }}
        </template>
      </div>
      <div
        v-else
        :class="['card__stage-pill', { 'is-ready': isCameraTesting }]"
      >
        <template v-if="isCameraTesting">
          <span class="card__stage-pill__icon">●</span>
          {{ t('Card.CameraPreviewStartedLead', '摄像头预览已开启（右下角全局悬浮） · 运行') }}
          <code>stopCameraTest</code>
          {{ t('Card.CameraPreviewStartedTail', '或点击悬浮窗「停止」按钮关闭') }}
        </template>
        <template v-else>
          <span class="card__stage-pill__icon">○</span>
          {{ t('Card.CameraPreviewNotStartedLead', '摄像头预览未开启：运行') }}
          <code>startCameraTest</code>
          {{ t('Card.CameraPreviewNotStartedTail', '后右下角会自动出现本地画面。') }}
        </template>
      </div>

      <details class="card__notes">
        <summary>{{ t('Card.UsageNotes', '使用须知') }} · {{ example.mount.kind === 'live-view' ? t('Card.MountNotesSummaryLiveView') : t('Card.MountNotesSummaryCameraTest') }}</summary>

        <template v-if="example.mount.kind === 'live-view'">
          <div class="card__notes-group card__notes-group--must">
            <div class="card__notes-head">{{ t('Card.NoteHeadMust', '接入须知') }}</div>
            <ul class="card__notes-list">
              <li v-html="t('Card.LiveViewMustItem0')" />
              <li v-html="t('Card.LiveViewMustItem1')" />
              <li v-html="t('Card.LiveViewMustItem2')" />
            </ul>
          </div>

          <!--
            The "组件已托管" group used to sit here. Removed after
            user feedback: information about what the component does
            for you internally isn't actionable for the integrator.
            If a piece of that content DOES turn out to be relevant
            (e.g. "don't also call startPlayStream" belongs on the
            startPlayStream card, not here), surface it on the API
            it constrains, not on the mount carrier.
          -->

          <div class="card__notes-group card__notes-group--env">
            <div class="card__notes-head">{{ t('Card.NoteHeadEnv', '业务/环境前提') }}</div>
            <ul class="card__notes-list">
              <li v-html="t('Card.LiveViewEnvItem0')" />
              <li v-html="t('Card.LiveViewEnvItem1')" />
            </ul>
          </div>
        </template>

        <template v-else>
          <div class="card__notes-group card__notes-group--must">
            <div class="card__notes-head">{{ t('Card.NoteHeadMust', '接入须知') }}</div>
            <ul class="card__notes-list">
              <li v-html="t('Card.CameraTestMustItem0')" />
              <li v-html="t('Card.CameraTestMustItem1')" />
              <li v-html="t('Card.CameraTestMustItem2')" />
            </ul>
          </div>

          <div class="card__notes-group card__notes-group--env">
            <div class="card__notes-head">{{ t('Card.NoteHeadEnvCamera', '设备/环境前提') }}</div>
            <ul class="card__notes-list">
              <li v-html="t('Card.CameraTestEnvItem0')" />
              <li v-html="t('Card.CameraTestEnvItem1')" />
            </ul>
          </div>
        </template>
      </details>
    </div>

    <div v-if="!isStateCard" class="card__run-row">
      <button
        type="button"
        class="card__run"
        :disabled="!canRun || running"
        @click="onRun"
      >
        {{ running ? t('Card.Running', '运行中…') : t('Card.Run', 'Run') }}
      </button>
      <span v-if="disabledReason" class="card__hint">{{ disabledReason }}</span>
    </div>

    <div v-if="isStateCard && example.stateView && stateModel" class="card__section">
      <div class="card__section-title">{{ t('Card.StateInspector', '响应式状态') }}</div>
      <StateInspector :model="stateModel" :view="example.stateView" />
    </div>

    <div v-if="output !== null && !(isStateCard && example.stateView)" class="card__section">
      <div class="card__section-title" :class="{ 'is-error': outputIsError }">
        <template v-if="outputIsError">{{ t('Card.Error', 'Error') }}</template>
        <template v-else>{{ t('Card.Output', 'Output') }}</template>
        <!--
          Copy the raw Output payload. Symmetric with the Code Snippet
          copy button — Output frequently carries JSON that integrators
          want to paste into a bug report, a debugger watch expression,
          or their own fixture files. Manually selecting text inside a
          `<pre>` picks up trailing whitespace and requires precise
          drag-select; a one-click button removes both papercuts.
          Only shown for non-error runs (copying a stack-trace-y "Error"
          line is rarely what people want, and the red styling already
          signals "read me, don't reuse me").
        -->
        <button
          v-if="!outputIsError"
          type="button"
          class="card__copy"
          @click="onCopyOutput"
        >{{ outputCopied ? t('Common.Copied') : t('Common.Copy') }}</button>
      </div>
      <pre class="card__output" :class="{ 'is-error': outputIsError }">{{ output }}</pre>
    </div>

    <!--
      Event log used to live here, one instance per card filtered to
      the current group's `source` slug. It moved to a single global
      dock at the bottom of the App shell — see `GlobalEventLogDock`.

      Each card still declares its `events` whitelist in the example
      definition; that data is preserved for documentation and for
      future per-card filter integrations, but no longer drives a
      card-local log panel. Cross-group flows (host → guest, etc.)
      are now visible in one place without scrolling between cards.
    -->

    <div class="card__section">
      <div class="card__section-title">
        {{ t('Card.CodeSnippet', 'Code Snippet') }}
        <button type="button" class="card__copy" @click="onCopy">{{ copied ? t('Common.Copied') : t('Common.Copy') }}</button>
      </div>
      <!--
        Snippet renders through a read-only CM6 view so its highlight
        palette matches the editable JsonEditor. Language defaults to
        `typescript` — every snippet in the demo is TS-flavoured (uses
        imports, generic angle brackets, etc.). Copy still targets
        the raw `example.snippet` string via `onCopy`, unchanged.
      -->
      <CodeBlock class="card__snippet" :code="example.snippet" lang="typescript" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch, watchEffect } from 'vue';
import { useLiveListState } from 'tuikit-atomicx-vue3';
import { useDeviceState } from 'tuikit-atomicx-vue3';
import PrettySelect from './PrettySelect.vue';
import JsonEditor from './JsonEditor.vue';
import CodeBlock from './CodeBlock.vue';
import RichText from './RichText.vue';
import StateInspector from './StateInspector.vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import {
  ALL_ROLES,
  ROLE_LABEL,
  Role,
  roleI18nKey,
  type AutoFillFromEvent,
  type ExampleDef,
  type FieldDef,
  type FieldOption,
} from '../types';
import { session } from '../../services/session/session';
import { pushLog } from '../../services/event-log/store';
import { pushToast } from '../../services/toast/store';
import { extractError, reportApiRun, reportApiRunError, reportApiRunSuccess } from '../../services/analytics/store';
import { getLatestEvent, onBridgeEvent, readPath, type BridgeEvent } from '../../services/event-log/bridge';

const props = defineProps<{
  example: ExampleDef;
  groupSlug: string;
}>();

// Shared across every `RichText` in this card's "使用须知" block so a
// repeated link renders only once. Recreated with the component instance
// (keyed by `selectedExample.id` in App.vue), so it resets on card switch.
const notesSeen = new Set<string>();

// The card survives a locale switch (its `:key` is the example id, not the
// language), so `notesSeen` would otherwise keep link keys from the previous
// language and, on the next render, downgrade every repeated link to plain
// text. Clear it before the child `RichText`s recompute their segments.
// Declared early (alongside `language`) because the `state`-card
// auto-run `watchEffect` runs synchronously during setup (via the
// immediate `watch` on `example.id`) and calls `run({ ..., t })`
// before a later-declared `t` would be initialized — which would
// throw a TDZ ReferenceError and silently skip panel population.
const { language, t } = useUIKit();
watch(language, () => notesSeen.clear());

const inputs = reactive<Record<string, unknown>>({});
const output = ref<string | null>(null);
const outputIsError = ref(false);
const running = ref(false);
// Two independent copy-flash flags so pressing one button doesn't
// visually toggle the other's "已复制" label. Cheap in memory and keeps
// the UI honest about which action the user actually just performed.
const copied = ref(false);
const outputCopied = ref(false);
/**
 * Live snapshot object for `state` cards that declare a `stateView` schema.
 * Fed by the `watchEffect` below (which re-runs `run()` on every reactive
 * ref change); the inspector component renders it, so re-assigning this ref
 * each tick is what makes the panel track the live state.
 */
const stateModel = ref<Record<string, unknown> | null>(null);

/**
 * Field flash map for declarative auto-fill (see bridge handler below).
 *
 * Declared BEFORE the form-reset watch because that watch runs immediately
 * during setup and clears this map — referencing it after would TDZ-crash.
 */
const autoFillFlash = ref<Record<string, number>>({});
let unsubBridge: (() => void) | null = null;

/**
 * Reset the form whenever the active example changes, then back-fill any
 * auto-fill fields from the bridge cache so an event that fired BEFORE this
 * card was mounted (e.g. host received an application while on another card)
 * still pre-populates the input.
 */
watch(
  () => props.example.id,
  () => {
    Object.keys(inputs).forEach(k => delete inputs[k]);
    (props.example.fields || []).forEach((f) => {
      inputs[f.key] = f.default;
    });
    output.value = null;
    outputIsError.value = false;
    autoFillFlash.value = {};
    stateModel.value = null;
    backfillFromCache();

    // One-shot side-effects for this card (e.g. device enumeration).
    // Runs once per activation — distinct from `run()`/`watchEffect`,
    // which re-fire on every reactive tick. Guarded so cards without
    // an `onActivate` are unaffected.
    props.example.onActivate?.();

    // A topbar login failure may have routed us here with a userId to
    // auto-run (see `autoRunLoginFromPending`). Idempotent: it clears
    // the flag, so only one run happens.
    autoRunLoginFromPending();
  },
  { immediate: true },
);

/**
 * Auto-run the LoginState login example when a topbar login fails.
 *
 * The topbar and this card call the same login interface. Instead of
 * shuttling the raw error string across components (fragile w.r.t.
 * timing), we only hand over the attempted userId and let the card run
 * its own example. `onRun` already catches API errors and renders them
 * in this card's output area — the single source of truth for error
 * display.
 *
 * Idempotent: clearing `session.pendingLoginUserId` first means only
 * one of the two watchers below (example-id change vs. flag change)
 * actually triggers the run, regardless of which fires first.
 */
function autoRunLoginFromPending(): void {
  if (props.example.id !== 'login.login') {
    return;
  }
  const userId = session.pendingLoginUserId;
  if (!userId) {
    return;
  }
  session.pendingLoginUserId = '';
  inputs.userId = userId;
  // Defer so the userId assignment flushes and `onRun` clears any prior
  // output before the example runs.
  void nextTick(onRun);
}

// Fire when this card becomes the login card (e.g. after the topbar's
// `select('login', 'login')` navigates here), covering the case where
// the operator was NOT already on the login page.
watch(() => props.example.id, autoRunLoginFromPending);

// Fire when the topbar sets the pending userId while we are ALREADY on
// the login card, so `props.example.id` doesn't change and the watcher
// above would never run.
watch(() => session.pendingLoginUserId, autoRunLoginFromPending);

function ruleMatches(rule: AutoFillFromEvent, e: BridgeEvent, slug: string): boolean {
  if (rule.source && rule.source !== e.source) {
    return false;
  }
  if (rule.fromRole && rule.fromRole !== e.role) {
    return false;
  }
  if (!rule.events.includes(e.event)) {
    return false;
  }
  // Default to same-group events when source isn't specified.
  if (!rule.source && e.source !== slug) {
    return false;
  }
  return true;
}

/**
 * Try to apply one bridge event to one field. Returns true if the field was
 * filled. Shared by live-bridge and mount-time backfill so the two paths
 * cannot drift.
 */
function applyEventToField(field: FieldDef, e: BridgeEvent, flash: boolean): boolean {
  const raw = field.autoFillFromEvent;
  if (!raw) {
    return false;
  }
  const rules = Array.isArray(raw) ? raw : [raw];
  for (const rule of rules) {
    if (!ruleMatches(rule, e, props.groupSlug)) {
      continue;
    }
    const value = readPath(e.payload, rule.path);
    if (value === undefined || value === null || value === '') {
      continue;
    }
    inputs[field.key] = value;
    if (flash) {
      autoFillFlash.value = { ...autoFillFlash.value, [field.key]: Date.now() };
    }
    return true;
  }
  return false;
}

function handleBridge(e: BridgeEvent): void {
  (props.example.fields || []).forEach((field: FieldDef) => {
    applyEventToField(field, e, /* flash */ true);
  });
}

/**
 * Pull the latest matching event from the global bridge cache so a card that
 * mounts AFTER an event fired (e.g. host switches to `acceptApplication`
 * only after the application arrives) still sees the value.
 *
 * No flash here — the value is "historical" from the operator's POV, so
 * flashing would be misleading.
 */
function backfillFromCache(): void {
  (props.example.fields || []).forEach((field: FieldDef) => {
    const raw = field.autoFillFromEvent;
    if (!raw) {
      return;
    }
    const rules = Array.isArray(raw) ? raw : [raw];
    const eventNames = rules.flatMap(r => r.events);
    const latest = getLatestEvent(eventNames);
    if (!latest) {
      return;
    }
    applyEventToField(field, latest, /* flash */ false);
  });
}

// LiveView is now a single global instance (see GlobalLiveStage.vue). Cards
// only reflect its readiness state, not own its lifecycle.
const { currentLive } = useLiveListState();
const currentLiveId = computed(() => currentLive.value?.liveId || '');
const hasJoinedLive = computed(() => !!currentLiveId.value);

// Camera preview is also a single global instance (see GlobalCameraStage.vue).
// Cards reflect whether the camera test is active; the container persists at
// App level so switching cards never interrupts the stream.
const device = useDeviceState();
const isCameraTesting = device.isCameraTesting;

/**
 * "state" cards (e.g. `live-seat.state`, `live-player.state`) expose a
 * read-only reactive snapshot — making the operator click Run for them is
 * pointless. Detected by convention: `api === 'state'`.
 */
const isStateCard = computed(() => props.example.api === 'state');

/**
 * For state cards, evaluate `run` inside a `watchEffect` so Vue auto-tracks
 * every reactive ref the closure touched (seatList, isPlaying, ...) and
 * re-runs it whenever any of them changes. The Output panel therefore stays
 * live without manual interaction.
 *
 * Re-installed whenever the active example changes, otherwise switching from
 * one state card to another would keep tracking the wrong closure.
 */
let stopAutoRun: (() => void) | null = null;
function installAutoRun(): void {
  if (stopAutoRun) {
    stopAutoRun();
    stopAutoRun = null;
  }
  if (!isStateCard.value || !props.example.run) {
    return;
  }
  const run = props.example.run;
  const stateView = props.example.stateView;
  stopAutoRun = watchEffect(() => {
    try {
      const result = run({
        // Forward the current input snapshot so future state cards can filter
        // (e.g. "show only seat N"). The spread also lets `watchEffect`
        // track inputs as a dependency, which matches the live-snapshot
        // contract of state cards.
        inputs: { ...inputs },
        log: (event, payload) => pushLog(props.groupSlug, event, payload, session.role, 'event'),
        t,
      });
      // State cards that declare a `stateView` schema render a humanized
      // inspector instead of a raw JSON dump: hand the live snapshot object
      // to the inspector (which re-renders whenever this effect re-runs on
      // a ref change) and suppress the plain-output panel.
      if (stateView) {
        if (result && typeof (result as PromiseLike<unknown>).then === 'function') {
          (result as Promise<unknown>).then((v) => { stateModel.value = v as Record<string, unknown>; });
        } else {
          stateModel.value = result as Record<string, unknown>;
        }
        output.value = null;
      } else {
        // State cards must be synchronous to participate in dependency tracking.
        // Anything async would resolve after the effect tracking phase ends.
        if (result && typeof (result as PromiseLike<unknown>).then === 'function') {
          (result as Promise<unknown>).then((v) => { output.value = serialize(v); });
        } else {
          output.value = serialize(result);
        }
      }
      outputIsError.value = false;
    } catch (e) {
      outputIsError.value = true;
      output.value = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    }
  });
}

watch(
  () => props.example.id,
  () => installAutoRun(),
  { immediate: true },
);

onMounted(() => {
  unsubBridge = onBridgeEvent(handleBridge);
});
onUnmounted(() => {
  if (unsubBridge) {
    unsubBridge();
    unsubBridge = null;
  }
  if (stopAutoRun) {
    stopAutoRun();
    stopAutoRun = null;
  }
});

const stageNote = computed(() => {
  const mount = props.example.mount;
  if (!mount) {
    return '';
  }
  // Author-provided note wins for every mount kind.
  if (mount.note) {
    return mount.note;
  }
  // Both live-view and camera-preview cards now use a global floating
  // stage with a status pill. The pill already tells the operator where
  // the picture appears and what to run, so no default prose is needed.
  return '';
});

const requireLogin = computed(() => props.example.requireLogin !== false);

// Bilingual role badge: resolve via i18n, fall back to the Chinese literal.
function roleLabelT(role: Role): string {
  return t(roleI18nKey(role), ROLE_LABEL[role]);
}

// Map an example `id` slug + a suffix to the `Card.<PascalCase><Suffix>`
// i18n key (e.g. `login.state` + `Desc` → `Card.LoginStateDesc`). The
// Chinese literal from the example definition is passed as the fallback so
// the card still renders Chinese when an English key is missing.
const toPascal = (seg: string): string =>
  seg.split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
function cardKey(id: string, suffix: string): string {
  return `Card.${id.split('.').map(toPascal).join('')}${suffix}`;
}

// CJK detection for `FieldDef.noChinese` fields (e.g. login.userId) — TRTC
// identifiers don't support Chinese characters.
const CJK_PATTERN = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;
function hasChinese(value: unknown): boolean {
  return typeof value === 'string' && CJK_PATTERN.test(value);
}

/**
 * Header role badges to render.
 *
 * Suppressed when `example.roles` covers every `RunnableRole` — a
 * "for-everyone" API (like startLive / joinLive / leaveLive) tagging
 * all three roles is visual noise: the tags exist to communicate
 * "who this is for", and "everyone" is the absence of restriction,
 * not a restriction worth broadcasting. In that case the card
 * header stays clean and the description prose carries the semantic
 * ("任一已登录用户都可调用；...").
 *
 * Any strict subset still renders its tags — that's precisely the
 * case where a caller needs the visual reminder.
 */
const visibleRoles = computed<Role[]>(() => {
  if (props.example.roles.length === ALL_ROLES.length) {
    return [];
  }
  return props.example.roles;
});

/**
 * Role gate. Two carve-outs on top of a straight list-includes check:
 *   1. `unassigned` (no live room joined yet) is treated as "allow".
 *      Pre-room APIs like `startLive` / `joinLive` are exactly how you
 *      leave the unassigned state; gating them behind a specific role
 *      would deadlock the demo (you couldn't become host without
 *      already being host).
 *   2. Everything else falls back to `example.roles.includes(...)`.
 */
const roleOk = computed(() => {
  if (session.role === Role.Unassigned) {
    return true;
  }
  return props.example.roles.includes(session.role as Role);
});

// True when any `noChinese` field currently holds a CJK character —
// blocks Run the same way an invalid role/login state would.
const hasChineseFieldError = computed(() => {
  return (props.example.fields ?? []).some(f => f.noChinese && hasChinese(inputs[f.key]));
});

// The first required field whose current value is empty, or `undefined`
// when all required fields are filled. `required` may be a function so
// "required" can depend on runtime state (e.g. live-list.liveId is only
// required when there is no session liveId fallback). Select-family and
// boolean fields are skipped: they always carry a value.
const emptyRequiredField = computed<FieldDef | undefined>(() => {
  return (props.example.fields ?? []).find((f) => {
    if (f.type === 'boolean' || f.type === 'select' || f.type === 'pretty-select' || f.type === 'rich-select') {
      return false;
    }
    const isRequired = typeof f.required === 'function' ? f.required() : f.required;
    if (!isRequired) {
      return false;
    }
    const v = inputs[f.key];
    if (v == null) {
      return true;
    }
    if (typeof v === 'number') {
      return Number.isNaN(v);
    }
    return String(v).trim() === '';
  });
});

const canRun = computed(() => {
  if (!props.example.run) {
    return false;
  }
  if (requireLogin.value && !session.loggedIn) {
    return false;
  }
  if (!roleOk.value) {
    return false;
  }
  // Card-level explicit gate takes priority over field-level validation:
  // a non-empty `disabled()` reason is a hard block regardless of field
  // values (e.g. login.login is blocked once already logged in).
  if (props.example.disabled && props.example.disabled()) {
    return false;
  }
  if (hasChineseFieldError.value) {
    return false;
  }
  if (emptyRequiredField.value) {
    return false;
  }
  return true;
});

const disabledReason = computed(() => {
  if (!props.example.run) {
    return t('Card.NotImplemented');
  }
  if (requireLogin.value && !session.loggedIn) {
    return t('Card.LoginRequired');
  }
  if (!roleOk.value) {
    return `${t('Card.RoleRestricted')}${props.example.roles.map(r => roleLabelT(r)).join(' / ')}`;
  }
  if (props.example.disabled) {
    const reason = props.example.disabled();
    if (reason) {
      return t(reason, reason);
    }
  }
  if (hasChineseFieldError.value) {
    return t('Card.NoChineseInline', 'Chinese characters are not supported');
  }
  if (emptyRequiredField.value) {
    const f = emptyRequiredField.value;
    const fieldLabel = t(cardKey(props.example.id, `Field${toPascal(f.key)}`), f.label);
    return t('Card.RequiredFieldEmpty', { defaultValue: '{{field}} is required', field: fieldLabel });
  }
  return '';
});

async function onRun(): Promise<void> {
  if (!props.example.run) {
    return;
  }
  running.value = true;
  output.value = null;
  outputIsError.value = false;
  const apiId = `${props.groupSlug}.${props.example.api}`;
  const startedAt = Date.now();
  pushLog(props.groupSlug, `call ${props.example.api}()`, { ...inputs }, session.role, 'call');
  reportApiRun({ apiId, group: props.groupSlug, api: props.example.api, role: session.role });
  try {
    const result = await props.example.run({
      inputs: { ...inputs },
      log: (event, payload) => pushLog(props.groupSlug, event, payload, session.role, 'event'),
      t,
    });
    output.value = serialize(result);
    reportApiRunSuccess({ apiId, group: props.groupSlug, api: props.example.api, role: session.role, durationMs: Date.now() - startedAt });
    emitSuccessToast();
  } catch (e) {
    outputIsError.value = true;
    const message = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    output.value = message;
    pushLog(props.groupSlug, `error ${props.example.api}()`, message, session.role, 'error');
    reportApiRunError({ apiId, group: props.groupSlug, api: props.example.api, role: session.role, ...extractError(e) });
  } finally {
    running.value = false;
  }
}

/**
 * Emit a "call resolved" toast based on the example's `successToast`
 * setting. See `SuccessToastSpec` in `types.ts` for the full contract.
 *
 * Why centralised here (vs. each example pushing its own toast):
 *   - Avoids ~100 call sites scattered across `examples/*.ts`, all
 *     repeating the same `pushToast({ source, role, level, title, ... })`
 *     boilerplate. Existing manual `pushToast` calls in `liveList.ts`
 *     (startLive/joinLive/leaveLive/endLive) predate this mechanism and
 *     stay as-is because they carry richer descriptions / actions;
 *     migrating them to `successToast` is a separate, mechanical task.
 *   - `successToast: false` lets state-readout cards (the `state` /
 *     `subscribeEvent` cards in every group) opt out cleanly. Their
 *     "run" is just a snapshot read and toasting on every poll/render
 *     would be noise.
 */
function emitSuccessToast(): void {
  const spec = props.example.successToast;
  if (spec === false) {
    return;
  }
  // Route the success-toast title / description through i18n so the
  // card content is fully bilingual. The Chinese literal is passed as
  // the fallback (i18next returns it when the key is missing, e.g. in
  // zh-CN), matching the `t(key, fallback)` pattern used everywhere
  // else in this card. Examples without an explicit `spec.title` keep
  // `example.title` (Chinese) as before.
  // The no-explicit-title branch reuses the same `Menu.<Id>` key the
  // sidebar already resolves `example.title` through, so the toast title
  // stays bilingual instead of showing the raw English literal.
  const title =
    spec && spec.title
      ? t(cardKey(props.example.id, 'ToastTitle'), spec.title)
      : t(`Menu.${props.example.id.split('.').map(toPascal).join('')}`, props.example.title);
  // Empty-string description means "no description line at all";
  // undefined means "use default copy". The check is `!== undefined`
  // (not truthiness) so callers can pass `description: ''` to suppress.
  const description =
    spec && spec.description !== undefined
      ? t(cardKey(props.example.id, 'ToastDesc'), spec.description)
      : t('Card.SuccessToastDefault', '调用成功');
  pushToast({
    source: props.groupSlug,
    role: session.role,
    level: 'success',
    title,
    description: description || undefined,
    action: spec ? spec.action : undefined,
  });
}

/** Stringify an input value for the JSON textarea (avoids `unknown` binding). */
function asString(value: unknown): string {
  return value == null ? '' : String(value);
}

/**
 * Resolve a `select` field's options. The thunk form is re-evaluated on every
 * render so cards like `switchResolution` reflect runtime SDK state
 * (`resolutionList` only populates after the player starts pulling stream).
 */
function resolveOptions(field: FieldDef): FieldOption[] {
  const raw = field.options;
  if (!raw) {
    return [];
  }
  return typeof raw === 'function' ? raw() : raw;
}

/**
 * Stringify Output values robustly. Each call starts with a FRESH cycle
 * tracker — using a module-scoped WeakSet caused state cards to flip into
 * "everything is [Circular]" on their second auto-run because the tracker
 * was never reset between calls, leading to a JSON.stringify failure and the
 * `String(value)` fallback returning `[object Object]`.
 *
 * Defensive handling:
 * - Unwrap Vue refs (`{ value: ... }` after toRaw) before serializing.
 * - Convert Maps / Sets to a plain shape (JSON.stringify renders them as `{}`).
 * - Surface values JSON drops by default (functions, BigInt, Symbol) as
 *   descriptive strings so the snapshot stays informative.
 * - Strip non-enumerable / class-instance internals by walking via toRaw.
 */
function serialize(value: unknown): string {
  if (value === undefined) {
    return '(void)';
  }
  const seen = new WeakSet<object>();
  const replacer = (_key: string, val: unknown): unknown => {
    if (val === undefined) {
      return '(undefined)';
    }
    if (typeof val === 'function') {
      return `[Function ${(val as { name?: string }).name || 'anonymous'}]`;
    }
    if (typeof val === 'bigint') {
      return `${val.toString()}n`;
    }
    if (typeof val === 'symbol') {
      return val.toString();
    }
    if (val instanceof Map) {
      return Object.fromEntries(val);
    }
    if (val instanceof Set) {
      return Array.from(val);
    }
    if (typeof val === 'object' && val !== null) {
      if (seen.has(val as object)) {
        return '[Circular]';
      }
      seen.add(val as object);
    }
    return val;
  };
  try {
    const json = JSON.stringify(value, replacer, 2);
    // Parens are required for readability — JS precedence (`&&` > `||`) already
    // gives the intended grouping, but a future maintainer might mis-read it.
    if (json === undefined || (json === '{}' && value && typeof value === 'object')) {
      // JSON.stringify can render class instances with non-enumerable fields
      // (or odd Proxies) as `{}`. Fall back to a key dump so at least the
      // shape is visible instead of a useless empty object.
      if (value && typeof value === 'object') {
        const keys = Object.getOwnPropertyNames(value);
        return `[Object ${(value as object).constructor?.name || ''} keys: ${keys.join(', ')}]`;
      }
      return String(value);
    }
    return json;
  } catch (e) {
    return `[Serialization Error: ${e instanceof Error ? e.message : String(e)}]`;
  }
}

/**
 * Write `text` to the clipboard and flash a "已复制" acknowledgement via
 * `flag` for 1.5s. Extracted from what used to be two copy-paste-adjacent
 * `onCopy` bodies so a future third copy target (mount note? signature?)
 * can reuse the same flash contract without drifting.
 *
 * Silently swallows clipboard errors — insecure contexts (http://
 * without user gesture, some embedded webviews) reject `writeText`, and
 * there is no useful recovery from the UI side. The button simply won't
 * flash, which is a fine "nothing happened" signal.
 */
async function copyText(text: string, flag: import('vue').Ref<boolean>): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    flag.value = true;
    setTimeout(() => (flag.value = false), 1500);
  } catch {
    /* clipboard may be unavailable in insecure contexts */
  }
}

function onCopy(): void {
  void copyText(props.example.snippet, copied);
}

function onCopyOutput(): void {
  // `output.value` is the exact serialized string shown in the <pre>,
  // so what the user copies always matches what they see. Guard against
  // a `null` state (button is v-if'd off in that case, but keeps this
  // helper safe for any future caller).
  if (output.value === null) {
    return;
  }
  void copyText(output.value, outputCopied);
}
</script>

<style scoped lang="scss">
.card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 24px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

  &__title-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__title {
    margin: 0;
    font-size: 20px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    color: #1f2937;
  }

  &__badge {
    padding: 1px 8px;
    font-size: 11px;
    border-radius: 10px;

    &.deprecated { color: #b91c1c; background: #fee2e2; }
    &.role-host { color: #fff; background: #5b3bdb; }
    &.role-audience { color: #fff; background: #2563eb; }
    &.role-admin { color: #fff; background: #d97706; }
  }

  &__desc {
    margin: 0;
    font-size: 13px;
    line-height: 1.6;
    color: #6b7280;
    // Preserve newlines in the source string so `\n\n` in
    // `example.description` renders as visible paragraph breaks
    // instead of collapsing into a single dense paragraph. Multiple
    // spaces still collapse to one (unlike `pre` / `pre-wrap`), so
    // authors don't have to worry about incidental extra whitespace.
    white-space: pre-line;
  }

  &__section-title {
    margin-bottom: 6px;
    font-size: 12px;
    font-weight: 600;
    color: #374151;
    text-transform: uppercase;

    &.is-error { color: #b91c1c; }
  }

  &__signature,
  &__output {
    margin: 0;
    padding: 10px 12px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-all;
    background: #f6f7f9;
    border-radius: 6px;
    // Cap height so a tall payload (e.g. a full liveList dump) scrolls
    // inside the panel instead of stretching the page and forcing the
    // whole layout to scroll.
    max-height: 360px;
    overflow: auto;
  }

  &__output.is-error { color: #b91c1c; background: #fef2f2; }

  // The snippet block is a CodeBlock (CM6) whose own theme already
  // provides padding / background / border. The `card__snippet`
  // class name is preserved for spacing hooks around it (via the
  // parent `.card__section` gap), but the pre-style rules above no
  // longer apply — CM6 owns the box.
  &__snippet {
    width: 100%;
  }

  &__fields {
    display: grid;
    // Wider min-track (260px, was 220px) so hints like
    // "一次决策、开播后不可切换；详见上方「使用须知」" fit on one
    // line at the typical 3-column layout instead of wrapping to a
    // narrow 2-line block. Cards that host many inputs still fall
    // back to more columns because `auto-fill` fills the row.
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 12px;
    // Stretch every field to the tallest sibling's height so that
    // combined with `.field > control { margin-top: auto }` the
    // controls line up on a shared bottom edge, even when one
    // field's help wraps to multiple lines (e.g. seatTemplate) and
    // another has none at all (e.g. liveName).
    align-items: stretch;
  }

  &__run-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__run {
    padding: 8px 28px;
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    cursor: pointer;
    background: #1c66e5;
    border: none;
    border-radius: 6px;

    &:disabled { cursor: not-allowed; background: #9db8ec; }
  }

  &__hint { font-size: 12px; color: #b45309; }

  &__stage-note {
    margin: 0 0 8px;
    font-size: 12px;
    color: #6b7280;
  }

  &__stage-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    font-size: 12px;
    line-height: 1.55;
    color: #6b7280;
    background: #f6f7f9;
    border: 1px solid #e5e7eb;
    border-radius: 6px;

    code {
      padding: 0 6px;
      margin: 0 2px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      color: #1f2937;
      background: #eceef1;
      border-radius: 3px;
    }

    &__icon {
      flex-shrink: 0;
      font-size: 10px;
      color: #9ca3af;
    }

    &.is-ready {
      color: #047857;
      background: #ecfdf5;
      border-color: #a7f3d0;

      code {
        color: #065f46;
        background: #d1fae5;
      }

      .card__stage-pill__icon { color: #10b981; }
    }
  }

  &__notes {
    margin-top: 10px;
    padding: 8px 12px;
    font-size: 12px;
    color: #4b5563;
    background: #f6f7f9;
    border: 1px solid #e5e7eb;
    border-radius: 6px;

    summary {
      font-weight: 600;
      color: #374151;
      cursor: pointer;
      user-select: none;
    }

    &[open] summary { margin-bottom: 6px; }

    // Standalone variant (driven by `example.notes`) sits as a top-level
    // card section, not nested inside the mount section. Zero its top
    // margin so the card's flex `gap: 16px` provides the only spacing —
    // the 10px margin-top from the base rule would otherwise stack on
    // top of the gap, making standalone notes look off-alignment.
    &--standalone { margin-top: 0; }
  }

  &__notes-group {
    margin-top: 8px;
    padding: 6px 10px 8px;
    border-left: 3px solid transparent;
    border-radius: 4px;

    &--must {
      background: #fff7ed;
      border-left-color: #f59e0b;
    }

    // `--handled` (green "组件已托管") deliberately dropped — the
    // "notes ONLY carry integrator-actionable info" rule removed
    // that tone from the ExampleNoteGroup type; keeping the CSS
    // class would let it silently come back via HTML-hardcoded
    // notes we haven't converted yet.

    &--env {
      background: #eef2ff;
      border-left-color: #6366f1;
    }
  }

  &__notes-head {
    margin-bottom: 4px;
    font-size: 11px;
    font-weight: 700;
    color: #374151;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__notes-list {
    padding-left: 18px;
    margin: 0;

    li { margin: 4px 0; line-height: 1.55; }
    code {
      padding: 0 4px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      color: #1f2937;
      background: #eceef1;
      border-radius: 3px;
    }
  }

  &__copy {
    margin-left: 8px;
    padding: 1px 10px;
    font-size: 11px;
    color: #1c66e5;
    cursor: pointer;
    background: #eef4ff;
    border: none;
    border-radius: 4px;
  }

}

.field {
  // Field renders as label → help (natural-wrapping, or same-height
  // placeholder when the schema omits it) → control. The row grid
  // stretches every field to the tallest sibling; `margin-top: auto`
  // on the control below then pins it to that shared bottom edge, so
  // controls line up regardless of whether one field's help wrapped
  // to 2 lines (e.g. fetchLiveList's cursor) and another's is empty.
  //
  // We used to avoid `margin-top: auto` here because native <select>
  // popups would flip upward on macOS Chrome/Safari when starved of
  // downward space and overlay the anchor. Now that constant/enum
  // fields use PrettySelect (which controls its own popup and always
  // opens downward), that constraint is gone and we can safely pin
  // the control to the field's bottom for reliable row alignment.
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px 6px;
  margin: -4px -6px;
  font-size: 13px;
  border-radius: 6px;
  transition: background-color 0.8s ease;

  // Prevent controls from overflowing narrow grid cells (esp.
  // native <select> which is intrinsically sized by its longest
  // option string). `.pretty-select` is included so its anchor
  // spans the cell like a real input would.
  // `margin-top: auto` pushes each control to the field's bottom so
  // sibling controls in a row share the same baseline.
  > input,
  > select,
  > textarea,
  > .pretty-select,
  > .json-editor {
    margin-top: auto;
    width: 100%;
    box-sizing: border-box;
  }

  &__input--error {
    border-color: #dc2626 !important;
  }

  &--flash {
    background-color: #fef9c3; // amber-100, fades back via transition
  }

  // Full-row spanning variant: multi-line JSON templates opt in via
  // the `field--wide` class so the CM6-backed JsonEditor inherits the
  // entire Inputs section width instead of one 260px auto-fill track.
  // Only affects the grid cell; the editor itself is styled by
  // `JsonEditor.vue` + shared theme in `codeMirrorSetup.ts`.
  &--wide {
    grid-column: 1 / -1;
  }

  &__label {
    // Keep name + auto-fill pill on a single row and vertically
    // centered — the pill would otherwise sit above the text baseline
    // if the row wrapped, looking detached.
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #374151;
    font-weight: 500;
  }

  &__name {
    // Named wrapper so the field name can be styled independently of
    // the surrounding row (previously it was raw text and any tweak
    // leaked to the pill / help).
    line-height: 1.4;
  }

  &__auto {
    padding: 0 6px;
    font-size: 10px;
    font-style: normal;
    color: #1c66e5;
    background: #eef4ff;
    border-radius: 8px;
  }

  // Full-width block below the label (parent .field is flex-column
  // with a 4px gap, so this naturally lands on its own row). Kept
  // one visual step "lighter" than the label so scanning still hits
  // the field NAME first and only lingers on the hint when needed.
  &__help {
    display: block;
    font-size: 11px;
    line-height: 1.45;
    color: #6b7280; // slightly darker than the old #9ca3af — the old
                    // tone read as "disabled hint" and integrators
                    // routinely missed load-bearing caveats hidden in
                    // it (e.g. the seatTemplate switch-locking note).

    // Placeholder variant — rendered for fields whose schema has no
    // help text. Reserves ONE line-height worth of vertical space
    // (font-size 11px × line-height 1.45 ≈ 16px). Using `1em` here
    // was ~5px too short and let sibling controls without help
    // float up above the shared baseline (see the "inputs not
    // aligned" screenshot). Matching the real help's rendered
    // height keeps every field's DOM height identical.
    &--placeholder {
      min-height: 1.45em;
    }
  }

  // Unify control height so text / number / select / pretty-select
  // anchors all render at the same pixel size inside the grid row,
  // eliminating the "one high, one low" misalignment visible when
  // fields with different help-text lengths share the same grid row.
  input[type='text'],
  input[type='number'],
  select,
  textarea {
    padding: 6px 8px;
    font-size: 13px;
    line-height: 1.4;
    height: 32px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
  }

  // Align single-row json textareas with sibling <input> heights.
  // Native <textarea rows="1"> still reserves ~2 extra px vs a text
  // input because its line-height defaults to `normal` (~1.2) while
  // browsers render <input> a hair tighter. Pin an explicit line-
  // height so the two sit on the same baseline inside a shared grid
  // row (see updateLiveInfo's inputs strip).
  textarea {
    line-height: 1.4;
    // Long json payloads are rare but possible (`metaData`,
    // `extensionInfo`). Vertical resize lets integrators expand
    // just this cell without letting them drag the grid sideways.
    resize: vertical;
  }

  input[type='checkbox'] {
    // Override the generic `> input { margin-top: auto; width: 100% }`
    // above — a checkbox has fixed 16×16 dimensions and belongs next
    // to the label, not pushed to the field's bottom or stretched to
    // full width.
    align-self: flex-start;
    margin-top: 0;
    width: 16px;
    height: 16px;
  }
}

// ---------------------------------------------------------------------------
// rich-select: icon-grid alternative to native <select>.
// Used by gift / theme / preset pickers that need to surface a thumbnail.
// Sized so 4 columns fit comfortably in the card's Inputs panel; the grid
// auto-flows to more rows as the option list grows.
// ---------------------------------------------------------------------------
.rich-select {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
  margin-top: 4px;
  max-height: 264px;
  overflow-y: auto;
  padding: 4px;
  background: #fafbfc;
  border: 1px solid #e5e7eb;
  border-radius: 8px;

  &__item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    text-align: left;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    cursor: pointer;
    transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;

    &:hover {
      border-color: #c7d2fe;
      background: #f5f7ff;
    }

    &.is-active {
      border-color: #4f46e5;
      background: #eef2ff;
      box-shadow: 0 0 0 1px #4f46e5 inset;
    }

    // Compact variant for options without an icon (e.g. userId / liveId
    // pickers in co-host / battle groups). No thumbnail column means
    // the text gets the full item width — denser and easier to scan.
    &--no-icon {
      padding: 8px 10px;
    }
  }

  &__thumb {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 36px;
    width: 36px;
    height: 36px;
    background: #f3f4f6;
    border-radius: 4px;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__text {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1 1 auto;
  }

  &__label {
    color: #111827;
    font-size: 12px;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__meta {
    margin-top: 2px;
    color: #6b7280;
    font-size: 11px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
