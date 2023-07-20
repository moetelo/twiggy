import { CompletionItem, CompletionParams } from 'vscode-languageserver/node';
import { Server } from '../server';
import type { Connection } from 'vscode-languageserver';

type onCompletionHandler = Parameters<Connection['onCompletion']>[0];

export abstract class BasicCompletion {
  server: Server;

  constructor(server: Server) {
    this.server = server;

    this.server.connection.onCompletion(this.onCompletion.bind(this));
    this.server.connection.onCompletionResolve(
      this.onCompletionResolve.bind(this)
    );
  }

  abstract onCompletion(
    ...args: Parameters<onCompletionHandler>
  ): ReturnType<onCompletionHandler>;

  async onCompletionResolve(item: CompletionItem): Promise<CompletionItem> {
    return Promise.resolve(item);
  }
}
