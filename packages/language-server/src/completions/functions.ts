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

const completions: CompletionItem[] = twigFunctions.map((item) =>
  Object.assign({}, item, {
    kind: CompletionItemKind.Function,
    insertText: `${item.label}($1)$0`,
    insertTextFormat: InsertTextFormat.Snippet,
    command: triggerParameterHints,
    detail: 'function',
  })
);

export function functions(cursorNode: SyntaxNode) {
  if (cursorNode.type === 'variable' || cursorNode.type === 'function') {
    return completions;
  }
}
