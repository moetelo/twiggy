import { CompletionItem, CompletionItemKind } from 'vscode-languageserver/node';
import { SyntaxNode } from 'web-tree-sitter';
import { twigFunctions } from '../common';

export function functionsAndFilters(cursorNode: SyntaxNode) {
  let completions: CompletionItem[] = [];

  if (cursorNode.type !== 'identifier') {
    return;
  }

  for (const item of twigFunctions) {
    completions.push(
      Object.assign(
        {
          kind: CompletionItemKind.Function,
        },
        item
      )
    );
  }

  return completions;
}
