import { SyntaxNode } from 'web-tree-sitter';
import { onHoverHandlerReturn } from './HoverProvider';
import { forLoopProperties } from '../common';
import { findParentByType } from '../utils/node';

export function forLoop(cursorNode: SyntaxNode): onHoverHandlerReturn {
  if (!findParentByType(cursorNode, 'for')) {
    return;
  }

  if (
    cursorNode.type === 'property' &&
    cursorNode.previousSibling?.text === '.' &&
    cursorNode.previousSibling?.previousSibling?.type === 'variable' &&
    cursorNode.previousSibling?.previousSibling?.text === 'loop'
  ) {
    const property = forLoopProperties.find(
      (item) => item.label === cursorNode.text
    );

    if (property && property.detail) {
      return {
        contents: property.detail,
      };
    }
  }
}
