import { CompletionItem, CompletionItemKind } from 'vscode-languageserver/node';
import { SyntaxNode } from 'web-tree-sitter';
import { globalVariables as gV } from '../common';

export function globalVariables(cursorNode: SyntaxNode) {
  let completions: CompletionItem[] = [];

  if (cursorNode.type !== 'identifier') {
    return;
  }

  for (const item of gV) {
    completions.push(
      Object.assign(
        {
          kind: CompletionItemKind.Variable,
          detail: 'Global variable',
        },
        item
      )
    );
  }

  return completions;
}
