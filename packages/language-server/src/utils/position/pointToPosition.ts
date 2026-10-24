import { Position } from 'vscode-languageserver/node';
import type { Point } from 'web-tree-sitter';

export function pointToPosition(point: Point): Position {
  return Position.create(point.row, point.column);
}
