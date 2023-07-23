import {
  Command,
  CompletionItem,
  CompletionItemKind,
  InsertTextFormat,
} from 'vscode-languageserver/node';
import { SyntaxNode } from 'web-tree-sitter';
import { twigFilters } from '../common';

const twigFiltersSnippets: CompletionItem[] = twigFilters.map((item) =>
  Object.assign({}, item, {
    kind: CompletionItemKind.Function,
    detail: 'Filter',
  })
);

export function filters(cursorNode: SyntaxNode) {
  if (cursorNode.text !== '|') {
    return;
  }

  return twigFiltersSnippets;
}
