import { SyntaxNode } from 'web-tree-sitter';

export function findParentByType(
  cursorNode: SyntaxNode,
  type: string
): SyntaxNode | undefined {
  let node = cursorNode;

  while (node.parent) {
    if (node.type === type) {
      return node;
    }
    node = node.parent;
  }
}
