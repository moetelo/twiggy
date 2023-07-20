import { SyntaxNode } from 'web-tree-sitter';

export function* bottomTopCursorIterator(startNode: SyntaxNode) {
  let node: SyntaxNode | null = startNode;

  while (node) {
    yield node;

    node = node.previousNamedSibling ?? node.parent;
  }
}
