import { SyntaxNode } from 'web-tree-sitter';
import { onHoverHandlerReturn } from './hover-provider';
import { twigFilters } from '../common';

export function filters(cursorNode: SyntaxNode): onHoverHandlerReturn {
  if (
    (cursorNode.type === 'variable' || cursorNode.type === 'function') &&
    cursorNode.previousSibling?.text === '|'
  ) {
    for (const item of twigFilters) {
      if (item.label === cursorNode.text) {
        if (item.documentation) {
          return {
            contents: item.documentation,
          };
        } else {
          return;
        }
      }
    }
  }
}
