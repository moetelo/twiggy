import { SyntaxNode } from 'web-tree-sitter';

export function closestByPredicate(
  node: SyntaxNode,
  predicate: (node: SyntaxNode) => boolean
): SyntaxNode | null {
  if (predicate(node)) {
    return node;
  }

  if (!node.parent) {
    return null;
  }

  return closestByPredicate(node.parent, predicate);
}
