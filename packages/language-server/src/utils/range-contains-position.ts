import { Position, Range } from 'vscode-languageserver/node';
import { comparePositions } from './compare-positions';

export function rangeContainsPosition(
  range: Range,
  position: Position
): boolean {
  return (
    comparePositions(position, range.start) >= 0 &&
    comparePositions(position, range.end) <= 0
  );
}
