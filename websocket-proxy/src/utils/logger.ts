/**
 * Simple structured logger
 */

import { config } from './config';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

const LOG_LEVEL_MAP: Record<string, LogLevel> = {
  error: LogLevel.ERROR,
  warn: LogLevel.WARN,
  info: LogLevel.INFO,
  debug: LogLevel.DEBUG,
};

class Logger {
  private level: LogLevel;

  constructor() {
    this.level = LOG_LEVEL_MAP[config.logLevel] || LogLevel.INFO;
  }

  private formatMessage(level: string, message: string, meta?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  error(message: string, meta?: Record<string, unknown>): void {
    if (this.level >= LogLevel.ERROR) {
      console.error(this.formatMessage('ERROR', message, meta));
    }
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    if (this.level >= LogLevel.WARN) {
      console.warn(this.formatMessage('WARN', message, meta));
    }
  }

  info(message: string, meta?: Record<string, unknown>): void {
    if (this.level >= LogLevel.INFO) {
      console.log(this.formatMessage('INFO', message, meta));
    }
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    if (this.level >= LogLevel.DEBUG) {
      console.log(this.formatMessage('DEBUG', message, meta));
    }
  }

  setLevel(level: keyof typeof LOG_LEVEL_MAP): void {
    this.level = LOG_LEVEL_MAP[level];
  }
}

export const logger = new Logger();
