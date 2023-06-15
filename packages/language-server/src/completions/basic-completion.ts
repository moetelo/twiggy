import { CompletionItem, Connection } from 'vscode-languageserver/node';

export abstract class BasicCompletion {
  connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;

    this.connection.onCompletion(this.onCompletion.bind(this));
    this.connection.onCompletionResolve(this.onCompletionResolve.bind(this));
  }

  abstract onCompletion(): CompletionItem[];
  abstract onCompletionResolve(item: CompletionItem): CompletionItem;
}
