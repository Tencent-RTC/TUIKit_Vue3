import { PlayerControlButton } from '../../../types/player';
import type { CustomButton } from '../../../types/player';

type ControlItem =
  | { kind: 'default'; key: string; id: PlayerControlButton }
  | { kind: 'custom'; key: string; button: CustomButton };

export type { ControlItem };
