import { CompletionItem, CompletionItemKind } from 'vscode-languageserver/node';
import { BasicCompletion } from './basic-completion';

export class GlobalVariables extends BasicCompletion {
  onCompletion(): CompletionItem[] {
    return [
      {
        label: `_self`,
        kind: CompletionItemKind.Variable,
        detail: 'Global variable',
        documentation: 'References the current template name',
      },
      {
        label: `_context`,
        kind: CompletionItemKind.Variable,
        detail: 'Global variable',
        documentation: 'References the current context',
      },
      {
        label: `_charset`,
        kind: CompletionItemKind.Variable,
        detail: 'Global variable',
        documentation: 'References the current charset',
      },
    ];
  }
}
