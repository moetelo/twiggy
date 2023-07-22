import { CompletionItem, CompletionItemKind } from 'vscode-languageserver/node';
import { SyntaxNode } from 'web-tree-sitter';
import { twigGlobalVariables } from '../common';

export function globalVariables(cursorNode: SyntaxNode) {
  let completions: CompletionItem[] = [];

  if (cursorNode.type !== 'identifier') {
    return;
  }

  for (const item of twigGlobalVariables) {
    completions.push(
      Object.assign(
        {
          kind: CompletionItemKind.Constant,
        },
        item
      )
    );
  }

  return completions;
}
