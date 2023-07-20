import { Connection, HoverParams } from 'vscode-languageserver';
import { Server } from '../server';
import { findNodeByPosition } from '../utils/find-element-by-position';
import { globalVariables } from '../common';

// export type onHoverHandler = Parameters<Connection['onHover']>[0];

export class Hover {
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

    if (cursorNode.type === 'identifier') {
      // Global variables
      for (const item of globalVariables) {
        if (item.label === cursorNode.text) {
          return {
            contents: item.documentation,
          };
        }
      }
    }
  }
}
