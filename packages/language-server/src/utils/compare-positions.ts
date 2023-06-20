import { Position } from 'vscode-languageserver/node';

export function comparePositions(a: Position, b: Position): number {
  if (a.line < b.line) return -1;
  if (a.line > b.line) return 1;

  if (a.character < b.character) return -1;
  if (a.character > b.character) return 1;

  return 0;
}
