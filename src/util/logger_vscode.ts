import { LogChannel } from "./logger";
import * as vscode from 'vscode';

export class LoggerChannelVscode implements LogChannel {
  _channel: vscode.LogOutputChannel;

  private static _instance: LoggerChannelVscode;

  private constructor() {
    this._channel = vscode.window.createOutputChannel('DevChat', { log: true });
  }

  public static getInstance(): LoggerChannelVscode {
    if (!this._instance) {
      this._instance = new LoggerChannelVscode();
    }
    return this._instance;
  }

  info(message: string, ...args: any[]): void {
    this._channel.info(message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this._channel.warn(message, ...args);
  }

  error(message: string | Error, ...args: any[]): void {
    this._channel.error(message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    this._channel.debug(message, ...args);
  }

  show(): void {
    this._channel.show();
  }
}