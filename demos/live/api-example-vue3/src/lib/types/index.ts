/**
 * Thin barrel re-export for the split type modules.
 *
 * Consumers import from `lib/types` (this file); the actual definitions
 * live in domain-specific files: `role.ts`, `mount.ts`, `example.ts`.
 */

export { ALL_ROLES, ROLE_LABEL, Role, roleI18nKey } from './role';
export type { RunnableRole } from './role';
export type { MountSpec } from './mount';
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
} from './example';
