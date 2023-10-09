import { SyntaxNode } from 'web-tree-sitter';

export const isEmptyEmbedded = (node: SyntaxNode) => node.type === 'ERROR'
  && node.childCount === 1
  && node.firstChild!.type === 'embedded_begin';
