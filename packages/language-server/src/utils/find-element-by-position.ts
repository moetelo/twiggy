import { Position } from 'vscode-languageserver';
import { SyntaxNode } from 'web-tree-sitter';
import { rangeContainsPosition } from './range-contains-position';
import { pointToPosition } from './point-to-position';
import { positionsToRange } from './positions-to-range';

export function findNodeByPosition(
  node: SyntaxNode,
  position: Position
): SyntaxNode | undefined {
  const range = positionsToRange(
    pointToPosition(node.startPosition),
    pointToPosition(node.endPosition)
  );

  if (rangeContainsPosition(range, position)) {
    if (node.children.length > 0) {
      for (let i = 0; i < node.children.length; i++) {
        const child = findNodeByPosition(node.children[i], position);

        if (child) {
          return child;
        }
      }
    } else {
      return node;
    }
  }
}
