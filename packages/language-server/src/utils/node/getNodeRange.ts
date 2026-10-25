import { Range } from 'vscode-languageserver';
import type { TreeCursor, SyntaxNode } from 'web-tree-sitter';
import { pointToPosition } from '../position';

export const getNodeRange = (node: TreeCursor | SyntaxNode): Range =>
    Range.create(pointToPosition(node.startPosition), pointToPosition(node.endPosition));
