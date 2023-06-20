import { SyntaxNode } from 'web-tree-sitter';

export default async function* toPreviousSiblingOrParentIterator(
  node: SyntaxNode
): AsyncGenerator<SyntaxNode> {
  let previousSibling: SyntaxNode | null = node;

  while ((previousSibling = previousSibling.previousSibling)) {
    yield previousSibling;
  }

  if (node.parent) {
    yield* toPreviousSiblingOrParentIterator(node.parent);
  }
}
