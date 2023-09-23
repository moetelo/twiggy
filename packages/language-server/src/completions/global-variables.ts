import { CompletionItem, CompletionItemKind } from 'vscode-languageserver/node';
import { SyntaxNode } from 'web-tree-sitter';
import { twigGlobalVariables } from '../common';
import { isEmptyEmbedded } from '../utils/is-empty-embedded';

const completions: CompletionItem[] = twigGlobalVariables.map((item) =>
  Object.assign({}, item, {
    kind: CompletionItemKind.Variable,
    detail: 'global variable',
  })
);

export function globalVariables(cursorNode: SyntaxNode) {
  if (cursorNode.type === 'variable' || isEmptyEmbedded(cursorNode)) {
    return completions;
  }
}
