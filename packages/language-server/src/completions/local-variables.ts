import {
  CompletionItem,
  CompletionItemKind,
  CompletionParams,
} from 'vscode-languageserver/node';
import { BasicCompletion } from './basic-completion';
import { findNodeByPosition } from '../utils/find-element-by-position';
import { bottomTopCursorIterator } from '../utils/bottom-top-cursor-iterator';

export class Variables extends BasicCompletion {
  async onCompletion(completionParams: CompletionParams) {
    const completions: CompletionItem[] = [];
    const uri = completionParams.textDocument.uri;
    const document = this.server.documentCache.getDocument(uri);

    if (!document) {
      return;
    }

    const cst = await document.cst();
    let cursorNode = findNodeByPosition(
      cst.rootNode,
      completionParams.position
    );

    if (!cursorNode || cursorNode.type !== 'identifier') {
      return;
    }

    for (let node of bottomTopCursorIterator(cursorNode)) {
      if (node.type === 'set') {
        let cursor = node.walk();

        cursor.gotoFirstChild();

        while (cursor.gotoNextSibling()) {
          if (cursor.currentFieldName() === 'variable') {
            completions.push({
              label: cursor.nodeText,
              kind: CompletionItemKind.Variable,
            });
          }
        }
      }
    }

    return completions;
  }
}
