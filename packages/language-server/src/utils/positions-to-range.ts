import { Position, Range } from 'vscode-languageserver/node';

export function positionsToRange(a: Position, b: Position): Range {
  return Range.create(a, b)
}
