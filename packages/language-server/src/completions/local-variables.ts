import { CompletionItem, CompletionItemKind } from 'vscode-languageserver/node';
import { SyntaxNode } from 'web-tree-sitter';
import { bottomTopCursorIterator } from '../utils/bottom-top-cursor-iterator';

export function localVariables(cursorNode: SyntaxNode) {
  let completions: CompletionItem[] = [];

  if (cursorNode.type !== 'identifier') {
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
