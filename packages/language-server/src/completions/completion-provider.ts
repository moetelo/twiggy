import { CompletionItem, CompletionParams } from 'vscode-languageserver/node';
import { Server } from '../server';
import { findNodeByPosition } from '../utils/find-element-by-position';
import { templatePaths } from './template-paths';
import { globalVariables } from './global-variables';
import { localVariables } from './local-variables';
import { functions } from './functions';
import { filters } from './filters';
import { forLoop } from './for-loop';

export class CompletionProvider {
  server: Server;

  constructor(server: Server) {
    this.server = server;

    this.server.connection.onCompletion(this.onCompletion.bind(this));
    this.server.connection.onCompletionResolve(
      this.onCompletionResolve.bind(this)
    );
  }

  async onCompletion(params: CompletionParams) {
    let completions: CompletionItem[] = [];
    const uri = params.textDocument.uri;
    const document = this.server.documentCache.getDocument(uri);

    if (!document) {
      return;
    }

    const cst = await document.cst();
    const cursorNode = findNodeByPosition(cst.rootNode, params.position);

    if (!cursorNode) {
      return;
    }

    [
      globalVariables(cursorNode),
      functions(cursorNode),
      filters(cursorNode),
      localVariables(cursorNode),
      forLoop(cursorNode),
      templatePaths(
        cursorNode,
        uri,
        this.server.documentCache.documents.keys()
      ),
    ].forEach((result) => {
      if (Array.isArray(result)) {
        completions.push(...result);
      }
    });

    return completions;
  }

  async onCompletionResolve(item: CompletionItem): Promise<CompletionItem> {
    return Promise.resolve(item);
  }
}
