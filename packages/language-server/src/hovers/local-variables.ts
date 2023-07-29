import { SyntaxNode } from 'web-tree-sitter';
import { onHoverHandlerReturn } from './hover-provider';
import { bottomTopCursorIterator } from '../utils/bottom-top-cursor-iterator';

export function localVariables(cursorNode: SyntaxNode): onHoverHandlerReturn {
  if (cursorNode.type !== 'variable') {
    return;
  }

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
