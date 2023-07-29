import { Connection, HoverParams } from 'vscode-languageserver';
import { Server } from '../server';
import { findNodeByPosition } from '../utils/find-element-by-position';
import { twigGlobalVariables } from '../common';
import { bottomTopCursorIterator } from '../utils/bottom-top-cursor-iterator';

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

    if (cursorNode.type === 'variable') {
      // Global variable
      for (const item of twigGlobalVariables) {
        if (item.label === cursorNode.text) {
          return {
            contents: item.documentation,
          };
        }
      }

      // Local variable
      for (let node of bottomTopCursorIterator(cursorNode)) {
        if (node.type === 'set') {
          let cursor = node.walk();

          cursor.gotoFirstChild();

          const keys = [];
          const values = [];

          while (cursor.gotoNextSibling()) {
            if (cursor.currentFieldName() === 'variable') {
              keys.push(cursor.nodeText);
            } else if (cursor.currentFieldName() === 'value') {
              values.push(cursor.nodeText);
            }
          }

          for (let i = 0; i < keys.length; i++) {
            if (keys[i] === cursorNode.text) {
              return {
                contents: values[i],
              };
            }
          }
        }
      }
    }
  }
}
