/**
 * Demo role — a role only exists **inside a live room**. Derived from
 * real SDK state (NOT operator-picked):
 *
 * - `Unassigned`: not currently in any live room (`currentLive.liveId`
 *   is empty). Role is undefined at this stage because "role" is a
 *   relationship to a specific room; without a room there's nothing
 *   to be a role of. This is the default after login, before any
 *   `startLive`/`joinLive` call. The `roleOk` gate treats
 *   `Unassigned` as "let any card run" — you MUST be allowed to call
 *   `startLive` / `joinLive` to acquire a role in the first place.
 * - `Host`: `currentLive.liveOwner.userId === session.userId`
 *   (set by calling `startLive` — you own the room you started).
 * - `Admin`: appears in `audienceList` with `userRole === TUIRole.kAdministrator`
 *   (set by the host calling `setAdministrator(yourUserId)` — so admin
 *   is a promotion FROM audience, granted by the room owner).
 * - `Audience`: entered a room via `joinLive` and has not been
 *   promoted to admin.
 *
 * The derivation lives in `services/session/derivedRole.ts` and mounts
 * a `watchEffect` from `App.vue` setup so `session.role` reflects the
 * SDK truth in real time.
 *
 * `RunnableRole` intentionally EXCLUDES `Unassigned`: cards declare
 * `roles: Role[]` to say "who this API is meant for after
 * roles have been established". The runtime gate then explicitly
 * allows `Unassigned` to run everything (see `ExampleCard`'s
 * `roleOk`), so pre-room APIs like `startLive` still work before
 * any role exists.
 */
enum Role {
  Unassigned = 'unassigned',
  Host = 'host',
  Audience = 'audience',
  Admin = 'admin',
}

/**
 * Roles that a card can declare as its target audience — excludes
 * `Unassigned` because "pre-room" is a transient state, not a
 * target audience (see the JSDoc on `Role` above for rationale).
 *
 * Defined as a union of the specific enum members (not `Exclude`)
 * so TypeScript narrows array literals like `[Role.Host, Role.Admin]`
 * to `RunnableRole[]` rather than widening to `Role[]`.
 */
type RunnableRole = Role.Host | Role.Audience | Role.Admin;

/**
 * Enumerates only the *acquired* roles (excludes `Unassigned`).
 * Used where iterating over "all possible established roles" is
 * meaningful — e.g. building a role legend, or filtering log rows.
 */
const ALL_ROLES: Role[] = [Role.Host, Role.Audience, Role.Admin];

const ROLE_LABEL: Record<Role, string> = {
  [Role.Unassigned]: '未进房',
  [Role.Host]: '主播',
  [Role.Audience]: '观众',
  [Role.Admin]: '管理员',
};

/**
 * i18n key for a role's short label (e.g. `Role.Host`). Use together with
 * `ROLE_LABEL[role]` as the fallback so the badge still renders Chinese when
 * i18n is unavailable: `t(roleI18nKey(role), ROLE_LABEL[role])`.
 */
function roleI18nKey(role: Role): string {
  return `Role.${role.charAt(0).toUpperCase()}${role.slice(1)}`;
}

export { ALL_ROLES, ROLE_LABEL, Role, roleI18nKey };
export type { RunnableRole };
