import {
  Command,
  CompletionItem,
  CompletionItemKind,
  InsertTextFormat,
} from 'vscode-languageserver/node';
import { SyntaxNode } from 'web-tree-sitter';
import { twigFunctions } from '../common';

const triggerParameterHints = Command.create(
  'Trigger parameter hints',
  'editor.action.triggerParameterHints'
);

const twigFunctionSnippets: CompletionItem[] = twigFunctions.map((item) =>
  Object.assign({}, item, {
    kind: CompletionItemKind.Function,
    insertText: `${item.label}($1)$0`,
    insertTextFormat: InsertTextFormat.Snippet,
    command: triggerParameterHints,
  })
);

export function functions(cursorNode: SyntaxNode) {
  if (cursorNode.type !== 'identifier') {
    return;
  }

  return twigFunctionSnippets;
}
