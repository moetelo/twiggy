import {
  CompletionItem,
  CompletionItemKind,
  InsertTextFormat,
} from 'vscode-languageserver/node';
import { SyntaxNode } from 'web-tree-sitter';
import { twigFunctions } from '../common';

const twigFunctionSnippets: CompletionItem[] = twigFunctions.map((item) =>
  Object.assign({}, item, {
    kind: CompletionItemKind.Function,
    insertText: `${item.label}($1)$0`,
    insertTextFormat: InsertTextFormat.Snippet,
  })
);

export function functions(cursorNode: SyntaxNode) {
  if (cursorNode.type !== 'identifier') {
    return;
  }

  return twigFunctionSnippets;
}
