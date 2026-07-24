/**
 * Inline `[[label|linkKey]]` token resolver.
 *
 * The link DATA (the `LINKS` registry) lives in `./links.config.ts` so it
 * can be edited without touching logic. This module resolves a token target
 * via `resolveLink` and re-exports the registry + types so existing
 * imports keep working.
 *
 * Why a config + resolver split: previously every inline link target
 * (external URL or `state.apiId`) was hardcoded directly inside
 * description / notes / field.help strings — and duplicated across the
 * zh-CN + en-US i18n files. Changing one doc URL meant editing every
 * string that mentioned it. `links.config.ts` is now the single source of
 * truth for *where a link points*; the *label* (language-specific,
 * translatable) stays in the token, so translators never touch a URL or a
 * card id.
 *
 * Usage in a string: `[[visible label|linkKey]]`
 *   e.g. '登录后通常接着 [[开始直播|startLive]]，详见 [[官方文档|officialDocsLogin]]。'
 */
import { LINKS, LinkTarget, sdkDocHref, SDK_DOC_ANCHORS, API_CARD_LINKS, API_CARD_COLLISIONS, resolveApiCard } from './links.config';

type ResolvedLink =
  | { kind: 'link'; href?: string; to?: { state: string; apiId: string } }
  | { kind: 'text' };

/**
 * Resolve a token target into a concrete link (or plain text).
 *
 * Resolution order:
 *   1. Managed link key from `LINKS` (preferred — centralized, easy to
 *      update in one place).
 *   2. Backward-compat literal: `http(s)://` URL → external link.
 *   3. Backward-compat literal: `state.apiId` (no protocol) → internal
 *      card jump.
 *   4. A bare SDK identifier (interface type / state field / enum type)
 *      resolves to its documentation anchor on the atomicx-core SDK doc
 *      page via `sdkDocHref` (e.g. `LoginUserInfo`,
 *      `loginUserInfo`, `SeatLayoutTemplate`).
 *   5. Unrecognized → plain text (the token label is shown, no link).
 *
 * Steps 2–3 keep pre-existing strings that embed a raw URL or
 * `state.apiId` working without migration.
 */
function resolveLink(target: string): ResolvedLink {
  const key = target.trim();

  const def = LINKS[key];
  if (def && (def.to || def.href)) {
    return { kind: 'link', href: def.href, to: def.to };
  }
  if (/^https?:\/\//i.test(key)) {
    return { kind: 'link', href: key };
  }
  const dot = key.lastIndexOf('.');
  if (dot > 0) {
    const state = key.slice(0, dot);
    const apiId = key.slice(dot + 1);
    if (state && apiId) {
      return { kind: 'link', to: { state, apiId } };
    }
  }
  const sdkHref = sdkDocHref(key);
  if (sdkHref) {
    return { kind: 'link', href: sdkHref };
  }
  return { kind: 'text' };
}

// Public API — exports are collected at the end of the file (project rule).
export {
  LINKS,
  SDK_DOC_ANCHORS,
  resolveLink,
  sdkDocHref,
  API_CARD_LINKS,
  API_CARD_COLLISIONS,
  resolveApiCard,
};
export type { LinkTarget, ResolvedLink };
