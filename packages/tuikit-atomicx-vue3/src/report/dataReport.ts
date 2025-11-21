import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';
import { MetricsKey } from './MetricsKey';

const KEY_METRICS_API = 'KeyMetricsStats';

type Task = () => void;

export class DataReport {
  private taskQueue: Task[] = [];
  private isReady = false;

  constructor() {
    this.bindEvent();
  }

  public reportCount(key: MetricsKey) {
    const task = this.createReportCountTask(key);
    if (!this.isReady) {
      this.taskQueue.push(task);
    } else {
      task();
    }
  }

  private bindEvent() {
    TUIRoomEngine.once('ready', () => {
      this.isReady = true;
      this.executePendingTasks();
    });
  }

  private executePendingTasks() {
    this.taskQueue.forEach(task => {
      try {
        task();
      } catch (error) {
        console.error('Task execution failed:', error);
      }
    });
    this.taskQueue = [];
  }

  private createReportCountTask(key: MetricsKey): Task {
    return () => {
      TUIRoomEngine.callExperimentalAPI(
        JSON.stringify({
          api: KEY_METRICS_API,
          params: { key },
        })
      );
    };
  }
}

export const dataReport = new DataReport();
