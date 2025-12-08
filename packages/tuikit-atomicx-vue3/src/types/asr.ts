export interface TranscriptRawData {
  type: number;
  sender: string;
  start_ms_ts: number;
  end_ms_ts: number;
  payload: {
    end: boolean;
    end_time: string;
    end_time_ms: string;
    roundid: string;
    start_time: string;
    start_time_ms: string;
    taskid: string;
    text: string;
  };
}

export interface Transcript {
  userId: string;
  userName: string;
  avatarUrl: string;
  text: string;
  startTime: number;
  endTime: number;
  end: boolean;
  rawData: TranscriptRawData;
}

export enum ASREvent {
  TRANSCRIPT_RECEIVED = 'transcript_received',
}
