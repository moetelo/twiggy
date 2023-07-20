import { HoverParams } from 'vscode-languageserver/node';
import { BasicHover } from './basic-hover';
import { findNodeByPosition } from '../utils/find-element-by-position';
import { globalVariables } from '../common';

export class GlobalVariables extends BasicHover {
  onHover(params: HoverParams) {
    const uri = params.textDocument.uri;
    const document = this.server.documentCache.getDocument(uri);

    if (!document) {
      return;
    }

    return document.cst().then((cst) => {
      const cursorNode = findNodeByPosition(cst.rootNode, params.position);

      if (cursorNode && cursorNode.type === 'identifier') {
        const globalVariable = globalVariables.find(
          (item) => item.label === cursorNode.text
        );

        if (globalVariable) {
          return {
            contents: globalVariable.documentation,
          };
        }
      }
    });
  }
}
