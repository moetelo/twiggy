import { SyntaxNode } from 'web-tree-sitter';
import { onHoverHandlerReturn } from './HoverProvider';
import { twigGlobalVariables } from '../common';

export function globalVariables(cursorNode: SyntaxNode): onHoverHandlerReturn {
  if (cursorNode.type !== 'variable') {
    return;
  }

  for (const item of twigGlobalVariables) {
    if (item.label === cursorNode.text) {
      return {
        contents: item.documentation,
      };
    }
  }
}
