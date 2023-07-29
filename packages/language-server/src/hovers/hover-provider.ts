import { Connection, HoverParams } from 'vscode-languageserver';
import { Server } from '../server';
import { findNodeByPosition } from '../utils/find-element-by-position';
import { twigGlobalVariables } from '../common';
import { bottomTopCursorIterator } from '../utils/bottom-top-cursor-iterator';
import { globalVariables } from './global-variables';
import { localVariables } from './local-variables';
import { forLoop } from './for-loop';

export type onHoverHandlerReturn = ReturnType<
  Parameters<Connection['onHover']>[0]
>;

export class HoverProvider {
  server: Server;

  constructor(server: Server) {
    this.server = server;

    this.server.connection.onHover(this.onHover.bind(this));
  }

  async onHover(params: HoverParams) {
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

    let result;
    let hovers = [globalVariables, localVariables, forLoop];

    for (const fn of hovers) {
      if ((result = fn(cursorNode))) {
        break;
      }
    }

    return result;
  }
}
