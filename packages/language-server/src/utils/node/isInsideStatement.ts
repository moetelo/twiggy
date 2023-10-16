import { SyntaxNode } from 'web-tree-sitter';

export const isInsideStatement = (node: SyntaxNode) => node.text.startsWith('{%')
  && (
      node.firstChild?.type === 'embedded_begin'
    || node.parent!.firstChild!.type === 'embedded_begin'
  );
