import { Position } from 'vscode-languageserver/node';
import { Point } from 'web-tree-sitter';

export function pointToPosition(point: Point): Position {
  return Position.create(point.row, point.column);
}
