import {
  CompletionItem,
  CompletionItemKind,
  CompletionParams,
} from 'vscode-languageserver/node';
import { BasicCompletion } from './basic-completion';

export class TemplateName extends BasicCompletion {
  async onCompletion(
    completionParams: CompletionParams
  ): Promise<CompletionItem[]> {
    const uri = completionParams.textDocument.uri;
    const document = this.server.documentCache.getDocument(uri);

    const cst = await document?.cst();

    return [
      {
        label: `base.html`,
        kind: CompletionItemKind.File,
      },
    ];
  }
}
