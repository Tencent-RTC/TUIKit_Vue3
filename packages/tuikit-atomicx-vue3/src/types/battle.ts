export type BattleConfig =  {
  duration: number;
  needResponse: boolean;
  extensionInfo: string;
}

export type BattleInfo = {
  battleId: string;
  config: BattleConfig;
  startTime: number,
  endTime: number;
}