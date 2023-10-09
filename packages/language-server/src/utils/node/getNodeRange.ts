import { Range } from 'vscode-languageserver';
import { TreeCursor, SyntaxNode } from 'web-tree-sitter';
import { pointToPosition } from '../position';

export const getNodeRange = (node: TreeCursor | SyntaxNode): Range => {
  return Range.create(
    pointToPosition(node.startPosition),
    pointToPosition(node.endPosition)
  );
};
