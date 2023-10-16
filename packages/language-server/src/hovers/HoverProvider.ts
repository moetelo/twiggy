import { HoverParams } from 'vscode-languageserver';
import { Server } from '../server';
import { findNodeByPosition } from '../utils/node';
import { globalVariables } from './global-variables';
import { localVariables } from './local-variables';
import { forLoop } from './for-loop';
import { functions } from './functions';
import { filters } from './filters';

export class HoverProvider {
  server: Server;

  constructor(server: Server) {
    this.server = server;

    this.server.connection.onHover(this.onHover.bind(this));
  }

  async onHover(params: HoverParams) {
    const uri = params.textDocument.uri;
    const document = this.server.documentCache.get(uri);

    if (!document) {
      return;
    }

    const cursorNode = findNodeByPosition(document.tree.rootNode, params.position);

    if (!cursorNode) {
      return;
    }

    let result;
    let hovers = [globalVariables, localVariables, functions, filters, forLoop];

    for (const fn of hovers) {
      if ((result = fn(cursorNode))) {
        break;
      }
    }

    return result;
  }
}
