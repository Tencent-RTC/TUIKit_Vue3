/**
 * Shared data models for the API Example site.
 *
 * Examples are data-driven: each `ExampleDef` declares its inputs, the API it
 * exercises, who can run it, and a runnable closure. This keeps cards uniform
 * and lets the coverage test compare declared APIs against the source hooks.
 */

import type { Role } from './role';
import type { MountSpec } from './mount';

/** Translator type handed to `StateFieldDef.format` (i18next `t` or a local lookup). */
type StateTranslator = (key: string, defaultValue: string) => string;

/**
 * Static metadata for an example group, available before the factory runs.
 *
 * Used by `safeBuildGroup` as a fallback when the factory throws (typically
 * a missing SDK export sentinel), so the menu can still render a greyed-out
 * tile in the right slot. Co-located with the factory in each example file
 * via `export const meta`, eliminating the central `FACTORY_SKELETONS` dict.
 */
interface GroupMeta {
  state: string;
  hook: string;
  title: string;
  category: string;
  source: string;
}

/**
 * Declarative rule: when an SDK event arrives, copy a value out of its payload
 * into this input field. Lets cards like `acceptApplication` auto-fill the
 * applicant's userId the moment `onGuestApplicationReceived` fires, instead of
 * forcing the operator to copy/paste from the log.
 */
interface AutoFillFromEvent {
  /** Group slug the event must originate from (e.g. `co-guest`). */
  source?: string;
  /** Event name(s) that trigger the fill (e.g. `onGuestApplicationReceived`). */
  events: string[];
  /** Dot-path into the event payload, e.g. `guestUser.userId`. */
  path: string;
  /** Only react to events from this role (omit = any). */
  fromRole?: Role.Host | Role.Audience | Role.Admin;
}

/** One option of a `select` field. */
interface FieldOption {
  label: string;
  value: unknown;
  /**
   * Optional thumbnail rendered alongside the label.
   *
   * Used by `rich-select` to show e.g. a gift icon next to each option. Plain
   * `<select>` ignores this (the browser's native `<option>` only renders
   * text), so it shows up only inside the `rich-select` grid renderer.
   */
  iconUrl?: string;
  /**
   * Optional secondary line under the label (e.g. `100 coins · level 2` for
   * a gift). Rendered as muted small text in `rich-select` only.
   */
  meta?: string;
}

/**
 * Either a static option list (resolved at example-construction time) or a
 * thunk re-evaluated whenever the card renders. Use the thunk form when the
 * choices depend on runtime SDK state (e.g. `resolutionList` only becomes
 * non-empty after the player starts pulling stream).
 */
type FieldOptions = FieldOption[] | (() => FieldOption[]);

/** Form field descriptor used to build the inputs panel of a card. */
interface FieldDef {
  key: string;
  label: string;
  /**
   * Renderer type:
   * - `text` / `number` / `boolean` / `json`: native HTML control.
   * - `select`: native `<select>` (text-only options).
   * - `pretty-select`: a custom dropdown that looks like an input in
   *   the collapsed state and pops a two-line-per-option panel
   *   downward on click. Solves two native-`<select>` pain points:
   *   the popup would flip upward and overlay the anchor on macOS
   *   when short on downward space, and native options can't show
   *   a secondary description line (see `FieldOption.meta`). Use
   *   for enums with ≤10 options where each value benefits from a
   *   plain-language subtitle (e.g. seatTemplate: enum name plus
   *   orientation / seat count).
   * - `rich-select`: an icon-grid renderer that shows `FieldOption.iconUrl`
   *   and `FieldOption.meta` next to each label. Use for gift pickers,
   *   theme thumbnails, and similar visual-heavy choices that a native
   *   `<select>` can't represent. Always-open (no popup); pick this
   *   over `pretty-select` when visual icons matter and the option
   *   count justifies a persistent grid.
   */
  type: 'text' | 'number' | 'boolean' | 'select' | 'pretty-select' | 'rich-select' | 'json';
  default?: unknown;
  placeholder?: string;
  options?: FieldOptions;
  help?: string;
  /**
   * Visible row count for `type: 'json'` textareas. Defaults to 1 so
   * short single-line payloads (e.g. `{"custom_key":"v1"}`, `["k1"]`)
   * stay aligned with sibling text/number inputs on the same row. Set
   * to a larger number when the default value is a multi-line
   * commented template that needs its full layout visible without a
   * manual resize drag — e.g. `updateLiveInfo`'s field-checklist JSON.
   */
  rows?: number;
  /** Auto-fill rule(s); the latest matching event wins. */
  autoFillFromEvent?: AutoFillFromEvent | AutoFillFromEvent[];
  /**
   * When true (only meaningful for `type: 'text'`), shows an inline
   * warning to the right of the input if the current value contains
   * CJK characters — TRTC userId and similar identifiers don't support
   * them. Used by `login.userId`; add to other identifier-like text
   * fields as needed.
   */
  noChinese?: boolean;
  /**
   * When true (or a function returning true), the Run button is disabled
   * while this field's value is empty. Use the function form when
   * "required" depends on runtime state — e.g. live-list.liveId is only
   * required when there is no session liveId fallback. Only meaningful
   * for text / number / json fields; select-family fields always carry a
   * value and boolean fields are never empty.
   */
  required?: boolean | (() => boolean);
}

/**
 * Post-run success toast configuration.
 *
 * Run success used to be silent — the only feedback was the Output panel
 * filling in and a single line in EventLog. For request-style APIs (e.g.
 * `applyForSeat`, `inviteToSeat`, `acceptApplication`) that's easy to
 * miss: the SDK's response event arrives milliseconds later in the log
 * and the operator can't tell whether THEIR call settled or whether
 * they're looking at remote activity. A small right-edge toast confirms
 * "your call resolved" without forcing focus changes.
 *
 * Three forms supported on `ExampleDef.successToast`:
 *   - `undefined` (default) → ExampleCard shows a generic
 *     `{ title: example.title, description: '调用成功' }` toast.
 *   - `false` → suppress entirely. Used by state-readout cards
 *     (`co-guest.state`, `live-seat.state`, every `subscribeEvent`)
 *     where toasting on every run would be visual noise.
 *   - `SuccessToastSpec` object → override title / description, optionally
 *     attach a follow-up action (jumps to another card on click).
 *
 * Failure path is intentionally NOT covered here: errors already get a
 * red Output panel + a red EventLog line, and pushing a third surface
 * (error toast) on the same failure would be noise.
 */
interface SuccessToastSpec {
  /** Custom title; falls back to `example.title`. */
  title?: string;
  /** Custom description; falls back to '调用成功'. Omit to suppress description line. */
  description?: string;
  /**
   * Optional follow-up action shown as a click-through CTA. Same shape
   * as `EventAction` so the toast component can route uniformly.
   * Imported via a structural type here to avoid pulling `eventActions.ts`
   * into the `types.ts` module graph.
   */
  action?: {
    state: string;
    apiId: string;
    label: string;
    roles?: Role[];
  };
}

/** Context handed to an example's `run` closure. */
interface RunContext {
  /** Current form values keyed by `FieldDef.key`. */
  inputs: Record<string, unknown>;
  /** Push a manual log line into the shared event log. */
  log: (event: string, payload?: unknown) => void;
  /**
   * i18n translator (i18next `t`) handed to `run()` so runtime
   * guard errors can be localized instead of hard-coded English. Use as
   * `throw new Error(t('Error.X', 'fallback en'), { defaultValue?, ...vars })`.
   */
  t: StateTranslator;
}

/**
 * A grouped bullet list rendered inside the "使用须知" collapsible on a card.
 *
 * Motivation: some APIs carry non-trivial mental model / gotcha content
 * that doesn't fit anywhere clean:
 *   - `description` is scanned quickly and should stay ~1 sentence.
 *   - `field.help` is only in view while filling that specific input.
 *   - `snippet` is code you copy-paste; noisy prose comments dilute it.
 *   - `Output` shows a single run's result, not upfront caveats.
 *
 * The joinLive card solved this UX problem for LiveView / startCameraTest
 * with a hard-coded `<details>` block styled as tone-coded groups
 * (「接入须知」/「业务/环境前提」). This structured
 * `notes` field lets ANY card opt into the same folded pattern — the UI
 * renders a matching `<details>` and reuses the same tone palette.
 *
 * `tone` maps to the existing `.card__notes-group--{must,env}` CSS
 * classes; keep it a closed enum so styling stays consistent across
 * cards.
 *
 * The `handled` tone (green — "组件已托管") was removed after user
 * feedback: descriptions of what the component does internally are
 * not actionable for the integrator, so notes should stick to what
 * integrators must do (must) or what environment must be true (env).
 * If a "the component already handles X" statement turns out to
 * matter, surface it on the specific API it constrains — never as
 * a standalone group here.
 */
interface ExampleNoteGroup {
  /**
   * Visual + semantic tone of the group:
   * - `must` (amber):  what integrators MUST get right
   * - `env`  (indigo): business / environment prerequisites
   */
  tone: 'must' | 'env';
  /**
   * Group heading (e.g. "关键点" or "常见陷阱"). Optional — the
   * ExampleCard renderer hides the heading when notes have only ONE
   * group, since the `<summary>` already labels the whole panel and
   * a solo heading is redundant. Provide `head` when 2+ groups
   * coexist (must + env) so the tone colors are anchored by text
   * labels.
   */
  head?: string;
  /**
   * Bullet lines. Rendered as `<li>` inside a `<ul>`; keep each line
   * concise (a paragraph fits fine, HTML tags do not — the renderer
   * treats items as plain text to avoid an XSS foot-gun).
   */
  items: string[];
}

interface ExampleNotes {
  /**
   * Text shown next to the collapsible toggle. Defaults to the API name
   * so the summary reads "使用须知 · fetchLiveList".
   */
  summary?: string;
  /** Ordered tone-grouped bullets. Rendered top-to-bottom in the panel. */
  groups: ExampleNoteGroup[];
}

/**
 * Declarative schema for rendering a state card's reactive snapshot as a
 * legible, humanized inspector — instead of a bare `JSON.stringify` dump.
 *
 * The raw snapshot object still comes from `run()` (data stays in one place,
 * untouched); `stateView` only describes HOW to present it. Keeping the two
 * separate means the card author — who already knows the enum semantics,
 * e.g. `DeviceStatus.On === 1` — writes the humanization once, next to the
 * card, rather than forcing the renderer to guess.
 *
 * See `StateInspector.vue` for the actual renderer.
 */
type StateFieldKind =
  /** Map raw value → enum name via `enumRef`; dot turns green when === `onValue`. */
  | 'enum'
  /** Localized On / Off with a colored dot. */
  | 'bool'
  /** Localized `N` (zh-CN: `N 个`). */
  | 'count'
  /** `N / 100` with a mini bar. */
  | 'volume'
  /** Localized `N` + inline preview of the first `preview` items. */
  | 'list'
  /** Plain string; localized `(empty)` when null / empty. */
  | 'text'
  /** Arbitrary via `format`. */
  | 'custom';

interface StateFieldDef {
  /** Key in the snapshot object returned by `run()`. */
  key: string;
  /** Human label (Chinese literal; i18n fallback mirrors the rest of the demo). */
  label: string;
  kind: StateFieldKind;
  /**
   * For `enum` / `bool`: the raw value meaning "on / active". Drives the
   * dot color (green vs grey) and the localized On / Off text.
   */
  onValue?: unknown;
  /** For `enum`: the TS enum object, e.g. `DeviceStatus`. */
  enumRef?: Record<string, string | number>;
  /** For `list`: how many items to inline under the row. */
  preview?: number;
  /**
   * For `custom`: arbitrary formatter. Receives `t` so it can localize
   * placeholders / units (e.g. "(未进入直播间)" / "3 次") instead of
   * hard-coding Chinese — the panel must stay locale-neutral.
   */
  format?: (value: unknown, t: StateTranslator) => string;
}

interface StateGroupDef {
  /** Section header, e.g. "摄像头". */
  title: string;
  rows: StateFieldDef[];
}

interface StateViewDef {
  /** Show the liveness badge (a pulsing dot; default true for state cards). */
  live?: boolean;
  groups: StateGroupDef[];
}

/** A single runnable example (one API or one tightly-coupled flow). */
interface ExampleDef {
  /** Stable id, e.g. `live-list.startLive`. */
  id: string;
  /** The API/method name this card primarily demonstrates. */
  api: string;
  title: string;
  /**
   * One-sentence plain-text summary, rendered in the card header via
   * `RichText`. May embed inline link tokens of the form
   * `[[label|linkKey]]`, where `linkKey` is a stable, language-neutral key
   * resolved from the central `LINKS` registry (`src/lib/links.config.ts`) — e.g.
   * `[[开始直播|startLive]]`. Keeping the destination in config (not in
   * the string) means a URL / card id changes in only ONE place. Literal
   * `http(s)://` URLs and raw `state.apiId` are still accepted as
   * fallbacks, but prefer a `linkKey`. Keep the token inside the
   * translatable string so translators only ever touch ONE string (and
   * never the URL / card id). Never put HTML here; `RichText` parses
   * tokens without `v-html`.
   */
  description?: string;
  /** TS signature string shown read-only on the card. */
  signature: string;
  /**
   * TARGET roles this example is meant for, once a role has been
   * established. This field carries TWO responsibilities intentionally:
   *
   * 1. Documentation label — "who is this API for?" — shown to the
   *    operator in the disabled-reason string
   *    ("当前角色不可用，仅限：主播 / 管理员") and used by
   *    `event-log/actions.ts` to gate follow-up suggestions.
   * 2. Runtime gate — combined with a special-case in
   *    `ExampleCard.roleOk`, which additionally treats `unassigned`
   *    (no live room) as "allow". That carve-out is essential: the
   *    pre-room APIs like `startLive` / `joinLive` declare
   *    `roles: ['host']` / `['audience', 'admin']` for documentation
   *    but MUST be runnable before any role exists.
   *
   * `unassigned` is intentionally NOT part of the accepted type
   * (`RunnableRole` excludes it): "this API is for pre-room users"
   * is not a meaningful business statement — the pre-room state is
   * a transient bootstrapping window, not a target audience. If a
   * future need arises to strictly gate a card (i.e. block
   * `unassigned` too), add an explicit `strictRoles?: boolean` flag
   * rather than smuggling `unassigned` into this list.
   */
  roles: Role[];
  deprecated?: boolean;
  /** Whether login is required before Run is enabled (default true). */
  requireLogin?: boolean;
  /**
   * Optional runtime gate evaluated reactively before each render.
   * Returns a non-empty reason string to disable the Run button (the
   * string is shown as the hint below the button), or an empty string
   * to allow. Checked AFTER `roles` and `requireLogin`, so it can add
   * finer-grained conditions (e.g. "user already on seat") on top of
   * the static role gate.
   */
  disabled?: () => string;
  fields?: FieldDef[];
  /** The actual call. Return value is serialized into the Output panel. */
  run?: (ctx: RunContext) => unknown | Promise<unknown>;
  /**
   * Post-run success toast. See `SuccessToastSpec` for the full contract.
   * Omit for the default generic toast, set to `false` to suppress.
   */
  successToast?: false | SuccessToastSpec;
  /** Copyable minimal `<script setup>` snippet. */
  snippet: string;
  /** Event names (from the matrix) this card relates to, for log filtering. */
  events?: string[];
  /**
   * Render carrier this card mounts so pull-stream / preview actually shows
   * video. Without it, control APIs succeed but there is no picture.
   */
  mount?: MountSpec;
  /**
   * Optional "使用须知" folded panel. Use for mental-model content that
   * doesn't fit `description` (too long), `field.help` (wrong scope),
   * `snippet` (code, not prose), or `Output` (per-run only).
   *
   * Renders as a `<details>` folded by default so it doesn't crowd the
   * card's primary Inputs / Run / Output flow — same interaction pattern
   * as the joinLive LiveView notes.
   */
  notes?: ExampleNotes;
  /**
   * Humanized rendering schema for `api: 'state'` cards. When present,
   * the card renders a `StateInspector` (grouped, enum-labeled,
   * change-flashing) instead of a raw JSON `<pre>`. Absent → falls back
   * to the existing JSON Output panel, so non-state cards and unmigrated
   * state cards are unaffected.
   *
   * The schema references keys from this card's `run()` snapshot object;
   * only keys listed here are displayed.
   */
  stateView?: StateViewDef;
  /**
   * Optional one-shot hook run when this card becomes the active example
   * (i.e. the operator clicks it in the menu). Fires once per activation —
   * NOT on every `run()`/`watchEffect` tick — so it is the right place to
   * kick off side-effecting setup like enumerating device lists, rather than
   * stuffing those calls into `run()` (which would spam the SDK on every
   * reactive snapshot refresh).
   *
   * Intentionally returns `void` for fire-and-forget: the results surface
   * reactively (e.g. `cameraList`/`microphoneList` refs update and the
   * state inspector re-renders), so awaiting here buys nothing and would
   * only delay painting the rest of the card.
   */
  onActivate?: () => void;
}

/** A group of examples for one state hook (matches a matrix section). */
interface ExampleGroup {
  /** URL slug, e.g. `live-list`. */
  state: string;
  /** Hook name, e.g. `useLiveListState`. */
  hook: string;
  /** Display title. */
  title: string;
  /**
   * Optional role badges rendered next to the group title in the menu.
   *
   * When the whole group targets a strict subset of roles (e.g. the
   * player-control group is audience + admin only), set this instead
   * of appending "（观众 / 管理员）" to the title string — the badges
   * reuse the same colored-pill style as per-API role tags so the
   * visual language stays consistent.
   */
  roles?: Role[];
  /** Matrix section, e.g. `6.1`. */
  category: string;
  /** Source file (relative to repo) for the "view source" link. */
  source: string;
  examples: ExampleDef[];
  /**
   * Optional group-level "about this group" banner rendered ONCE above the
   * card (see `GroupIntro.vue`), not repeated on every card. Use it for the
   * mental model / global prerequisite that NO single card can own — e.g. the
   * login group's "what does useXxxState() return" primer, or the live-list
   * group's "currentLive is the global switch" reminder. Reuses the same
   * `ExampleNotes` shape; i18n keys follow `Card.<Group>Intro<…>`
   * (see `GroupIntro.introKey`).
   */
  intro?: ExampleNotes;
  /** True when the group is scaffolded but examples are not yet implemented. */
  pending?: boolean;
  /**
   * Non-null when the group's factory could not be constructed under
   * the currently-selected SDK version — typically because the example
   * source references an export the SDK does not provide (the missing-
   * export shim plugin papers over the import-time SyntaxError, but
   * any module-top-level access to the sentinel — e.g. a `default:
   * SeatLayoutTemplate.X` field value — still throws when the factory
   * runs). The menu greys the group out and clicking it shows a
   * placeholder card instead of trying to render its (broken) examples.
   */
  disabledReason?: string;
  /** Specific export names that triggered `disabledReason`, when known. */
  disabledMissingNames?: string[];
}

export type {
  AutoFillFromEvent,
  ExampleDef,
  ExampleGroup,
  ExampleNoteGroup,
  ExampleNotes,
  FieldDef,
  FieldOption,
  FieldOptions,
  GroupMeta,
  RunContext,
  StateTranslator,
  StateFieldDef,
  StateFieldKind,
  StateGroupDef,
  StateViewDef,
  SuccessToastSpec,
};
