import {
  CompletionItem,
  CompletionItemKind,
  CompletionParams,
} from 'vscode-languageserver/node';
import { BasicCompletion } from './basic-completion';
import { findNodeByPosition } from '../utils/find-element-by-position';
import { documentUriToFsPath } from '../utils/document-uri-to-fs-path';
import { relative } from 'path';

export class TemplateName extends BasicCompletion {
  async onCompletion(
    completionParams: CompletionParams
  ): Promise<CompletionItem[]> {
    const completions: CompletionItem[] = [];
    const uri = completionParams.textDocument.uri;
    const document = this.server.documentCache.getDocument(uri);
    const cst = await document?.cst();
    const rootNode = cst?.rootNode;
    let node;

    if (rootNode) {
      node = findNodeByPosition(rootNode, completionParams.position);

      if (node) {
        // {% include 'template.html' %}
        if (
          node.parent?.type === 'tag_statement' &&
          node.previousSibling?.type === 'tag' &&
          node.previousSibling?.text === 'include'
        ) {
          const twigPaths = this.server.documentCache.documents.keys();
          const currentPath = documentUriToFsPath(
            completionParams.textDocument.uri
          );

          for (const twigPath of twigPaths) {
            completions.push({
              label: relative(currentPath, documentUriToFsPath(twigPath)),
              kind: CompletionItemKind.File,
            });
          }
        }
      }
    }

    return completions;
  }
}
