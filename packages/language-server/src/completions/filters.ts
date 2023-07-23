import { CompletionItem, CompletionItemKind } from 'vscode-languageserver/node';
import { SyntaxNode } from 'web-tree-sitter';
import { twigFilters } from '../common';

const completions: CompletionItem[] = twigFilters.map((item) =>
  Object.assign({}, item, {
    kind: CompletionItemKind.Function,
    detail: 'filter',
  })
);

export function filters(cursorNode: SyntaxNode) {
  if (cursorNode.text !== '|') {
    return;
  }

  return completions;
}
