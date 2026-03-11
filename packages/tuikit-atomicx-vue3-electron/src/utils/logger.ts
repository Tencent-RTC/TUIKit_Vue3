interface LoggerOptions {
  prefix: string;
}

export class Logger {
  private prefix: string;

  constructor(options: LoggerOptions) {
    this.prefix = options.prefix;
  }

  log(...args: any[]): void {
    console.log?.(this.getTime(), this.prefix, ...args);
  }

  info(...args: any[]): void {
    console.info?.(this.getTime(), this.prefix, ...args);
  }

  warn(...args: any[]): void {
    console.warn?.(this.getTime(), this.prefix, ...args);
  }

  error(...args: any[]): void {
    console.error?.(this.getTime(), this.prefix, ...args);
  }

  debug(...args: any[]): void {
    console.debug?.(this.getTime(), this.prefix, ...args);
  }

  private getTime(): string {
    const date = new Date();

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
  }
}

const logger = new Logger({ prefix: '[tuikit]' });

export default logger;
