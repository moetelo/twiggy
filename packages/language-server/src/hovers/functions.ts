import { SyntaxNode } from 'web-tree-sitter';
import { onHoverHandlerReturn } from './hover-provider';
import { twigFunctions } from '../common';

export function functions(cursorNode: SyntaxNode): onHoverHandlerReturn {
  if (cursorNode.type === 'variable' || cursorNode.type === 'function') {
    for (const item of twigFunctions) {
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
