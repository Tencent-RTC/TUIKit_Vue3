<script setup lang="ts">
/**
 * RichText renders a plain string that MAY contain inline link tokens.
 *
 * Why a custom component instead of `v-html` / Markdown:
 * - The site's descriptions / notes are single i18n strings resolved via
 *   `t(key, fallback)`. We must NOT introduce `v-html`, which would let a
 *   mistranslated `<` break the card layout or inject script (XSS). The
 *   `notes` panel historically used `v-html`; this component is the safe
 *   replacement we migrate towards.
 * - Markdown would need a parser dependency and a second syntax the
 *   translators must learn, diverging from the `t(key, fallback)` contract.
 *
 * Two link sources are supported:
 *
 * 1. Explicit tokens (language-neutral, hand-written in the string):
 *
 *        [[display label|linkKey]]
 *
 *    - `linkKey` is a stable key resolved from the central `LINKS`
 *      registry in `../links.config.ts` — the single source of truth for
 *      *where* a link points. Prefer this so a URL / card id only ever
 *      changes in ONE place. e.g. [[开始直播|startLive]]
 *    - Backward-compat fallbacks are also accepted verbatim as the target:
 *        - full `http(s)://` URL → external link
 *          e.g. [[官方文档|https://cloud.tencent.com/...]]
 *        - `state.apiId` (no protocol) → internal card jump
 *          e.g. [[生成测试签名|live-list.genTestUserSig]]
 *        - a bare SDK identifier (interface type / state field / enum type)
 *          → its documentation anchor, e.g. [[LoginUserInfo|LoginUserInfo]].
 *      New links should use a `linkKey`; literals are only kept working for
 *      already-written strings.
 *
 * 2. Auto-links for known SDK identifiers. Any of the names listed in
 *    `SDK_DOC_ANCHORS` (e.g. `LoginUserInfo`, `loginUserInfo`,
 *    `SeatLayoutTemplate`) that appears in the prose is linked to its doc
 *    anchor automatically — in BOTH i18n languages, with no per-string
 *    token. This keeps card prose in sync with the SDK docs without
 *    duplicating tokens across zh-CN + en-US files.
 *
 * Internal jumps reuse App's existing `activeState` watcher (via
 * `router.push({ name:'example', params:{ state, apiId } })`), so the
 * left menu auto-expands/highlights the target card.
 *
 * Safety: external `href` is restricted to `http(s)://` (or a `linkKey`
 * whose registry entry is an `href`); anything unrecognized is rendered
 * as plain text. The parser never produces DOM attributes from raw string
 * content, and no `v-html` / `innerHTML` is used.
 */
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  resolveLink,
  sdkDocHref,
  SDK_DOC_ANCHORS,
  API_CARD_LINKS,
  API_CARD_COLLISIONS,
  resolveApiCard,
} from '../links';

const props = defineProps<{
  text: string;
  cardId?: string;
  apiLinks?: boolean;
  // Shared set of already-rendered link keys, used to render a repeated
  // link only once inside one "使用须知" block. Pass the SAME set instance
  // to every `RichText` in that block; leave it undefined to disable.
  seen?: Set<string>;
}>();

const router = useRouter();

// Label group excludes `[` and `]` (never crosses a token boundary or the
// closing `]]`), but DOES allow `|` so a single link can display a union like
// `HostEvent | GuestEvent`. The split happens at the last `|` before the
// closing `]]`, so a `|` inside the label is kept as part of the label.
const TOKEN_PATTERN = '\\[\\[([^\\[\\]]*)\\|([^\\]]+)\\]\\]';

type Segment =
  | { kind: 'text'; value: string }
  | { kind: 'link'; label: string; href?: string; to?: { state: string; apiId: string } };

// Matches any known SDK identifier so prose auto-links to its doc anchor.
// Longest-first ordering stops a shorter name from shadowing a longer one
// it is a substring of (e.g. `SeatInfo` inside `TUISeatInfo`). Word
// boundaries anchor the match to identifier edges; identifiers are ASCII so
// `\b` behaves as expected even next to CJK characters.
const SDK_NAME_RE = (() => {
  const names = Object.keys(SDK_DOC_ANCHORS).sort((a, b) => b.length - a.length);
  const escaped = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`\\b(${escaped.join('|')})\\b`, 'g');
})();

// Split a plain-text segment, turning recognized SDK identifiers into links.
// Runs only on `text` segments (never on `link` labels), so a type name
// inside an existing token's label is left untouched — no nested links.
function linkifyText(text: string): Segment[] {
  const out: Segment[] = [];
  const re = new RegExp(SDK_NAME_RE.source, 'g');
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      out.push({ kind: 'text', value: text.slice(last, m.index) });
    }
    const name = m[0];
    const href = sdkDocHref(name);
    if (href) {
      out.push({ kind: 'link', label: name, href });
    } else {
      out.push({ kind: 'text', value: name });
    }
    last = re.lastIndex;
  }
  if (last < text.length) {
    out.push({ kind: 'text', value: text.slice(last) });
  }
  return out;
}

// Known API-card names (unique `api` ids + the few colliding ones) so a
// bare API name appearing in the "使用须知" prose links to its card. Longest
// first; `\b` keeps `mute` from matching inside `unmute` /
// `muteRemoteHostAudio`, and `refresh` from matching `refreshGiftList`.
//
// A few colliding names (`state`, `subscribeEvent`, `unsubscribeEvent`) are
// deliberately excluded from the automatic regex because they are either
// extremely common English words (`state` would match inside normal prose like
// '"state": startLive creates…') or too ambiguous. They can still be linked
// by writing an explicit `[[state|…]]` token in the i18n string.
const AUTO_LINK_EXCLUDE = new Set<string>(['state']);
const API_NAME_RE = (() => {
  const names = [
    ...Object.keys(API_CARD_LINKS),
    ...[...API_CARD_COLLISIONS].filter((n) => !AUTO_LINK_EXCLUDE.has(n)),
  ].sort((a, b) => b.length - a.length);
  const escaped = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`\\b(${escaped.join('|')})\\b`, 'g');
})();

// The `state` slug of the card being rendered — used to disambiguate the
// colliding API names (`state` / `subscribeEvent` / `unsubscribeEvent`).
const currentState = computed(() => (props.cardId ? props.cardId.split('.')[0] : ''));

// Split a plain-text segment, turning recognized API-card names into
// internal card-jump links (resolved via `resolveApiCard`, which falls back
// to the current card's `state` for the colliding names). Runs only on
// `text` segments, so an API name inside an existing token label is left
// untouched — no nested links.
function linkifyApiText(text: string): Segment[] {
  const out: Segment[] = [];
  const re = new RegExp(API_NAME_RE.source, 'g');
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      out.push({ kind: 'text', value: text.slice(last, m.index) });
    }
    const name = m[0];
    const to = resolveApiCard(name, currentState.value);
    if (to) {
      out.push({ kind: 'link', label: name, to });
    } else {
      out.push({ kind: 'text', value: name });
    }
    last = re.lastIndex;
  }
  if (last < text.length) {
    out.push({ kind: 'text', value: text.slice(last) });
  }
  return out;
}

const segments = computed<Segment[]>(() => {
  // Stage 1: resolve `[[label|target]]` tokens into text / link segments.
  const raw: Segment[] = [];
  // Fresh regex per evaluation — `g` flag carries `lastIndex` state, so
  // reusing one instance across computed calls would skip matches.
  const re = new RegExp(TOKEN_PATTERN, 'g');
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(props.text)) !== null) {
    if (m.index > last) {
      raw.push({ kind: 'text', value: props.text.slice(last, m.index) });
    }
    const label = m[1].trim();
    const resolved = resolveLink(m[2].trim());
    if (resolved.kind === 'link') {
      raw.push({ kind: 'link', label, href: resolved.href, to: resolved.to });
    } else {
      // Unrecognized target (not a linkKey, not a URL, not state.apiId,
      // not a known SDK identifier): keep the raw token text rather than
      // silently dropping it.
      raw.push({ kind: 'text', value: m[0] });
    }
    last = re.lastIndex;
  }
  if (last < props.text.length) {
    raw.push({ kind: 'text', value: props.text.slice(last) });
  }

  // Stage 2: auto-link known SDK identifiers inside plain-text segments.
  // Stage 3 (opt-in via `apiLinks`): auto-link API-card names inside the
  // remaining plain-text segments, so "使用须知" prose that mentions another
  // API (e.g. "需先 leaveLive 或 endLive") jumps to that card. Both run
  // only on `text` segments, so existing links / token labels are never
  // re-linked or nested.
  const out: Segment[] = [];
  for (const seg of raw) {
    if (seg.kind !== 'text') {
      out.push(seg);
      continue;
    }
    const sdkLinked = linkifyText(seg.value);
    if (props.apiLinks) {
      for (const s of sdkLinked) {
        out.push(...(s.kind === 'text' ? linkifyApiText(s.value) : [s]));
      }
    } else {
      out.push(...sdkLinked);
    }
  }

  // Stage 4 (opt-in via `seen`): within one "使用须知" block, render a
  // repeated link only the first time it appears. `seen` is a plain (non-
  // reactive) set shared by every `RichText` in the block; we add each
  // link's destination key on first sight and downgrade later repeats to
  // plain text. Dedup is by destination, so the same target with a
  // different label still counts as a repeat. DOM order decides which
  // occurrence wins (the first `<li>` is evaluated first).
  if (!props.seen) {
    return out;
  }
  const final: Segment[] = [];
  for (const seg of out) {
    if (seg.kind !== 'link') {
      final.push(seg);
      continue;
    }
    const key = seg.href
      ? `ext:${seg.href}`
      : seg.to
        ? `int:${seg.to.state}.${seg.to.apiId}`
        : `label:${seg.label}`;
    if (props.seen.has(key)) {
      final.push({ kind: 'text', value: seg.label });
    } else {
      props.seen.add(key);
      final.push(seg);
    }
  }
  return final;
});

function onInternalClick(to: { state: string; apiId: string }): void {
  // Equivalent to App.select(state, apiId): pushes the example route,
  // which reuses the existing left-menu auto-expand logic.
  router.push({ name: 'example', params: { state: to.state, apiId: to.apiId } });
}
</script>

<template>
  <span class="rich-text">
    <template v-for="(seg, i) in segments" :key="i">
      <a
        v-if="seg.kind === 'link' && seg.href"
        :href="seg.href"
        target="_blank"
        rel="noopener noreferrer"
        class="rich-text__link rich-text__link--ext"
      >{{ seg.label }}</a>
      <a
        v-else-if="seg.kind === 'link' && seg.to"
        href="#"
        class="rich-text__link rich-text__link--int"
        @click.prevent="onInternalClick(seg.to)"
      >{{ seg.label }}</a>
      <template v-else-if="seg.kind === 'link'">{{ seg.label }}</template>
      <template v-else>{{ seg.value }}</template>
    </template>
  </span>
</template>

<style scoped lang="scss">
.rich-text {
  // Inherits font-size / color / line-height from the host element
  // (.card__desc, .card__notes-list li, .field__help, …).
  display: inline;
}

.rich-text__link {
  color: #2563eb;
  text-decoration: none;
  cursor: pointer;

  &:hover {
    color: #1d4ed8;
    text-decoration: underline;
  }

  // Small outbound glyph for external links, mirroring common UX.
  &--ext::after {
    content: '↗';
    margin-left: 1px;
    font-size: 0.8em;
  }
}
</style>
