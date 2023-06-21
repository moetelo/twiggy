import { CompletionItem, CompletionParams } from 'vscode-languageserver/node';
import { Server } from '../server';

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
    completionParams: CompletionParams
  ): Promise<CompletionItem[]>;

  async onCompletionResolve(item: CompletionItem): Promise<CompletionItem> {
    return Promise.resolve(item);
  }
}
