import {
  CompletionItem,
  CompletionItemKind,
  CompletionParams,
} from 'vscode-languageserver/node';
import { BasicCompletion } from './basic-completion';
import { findNodeByPosition } from '../utils/find-element-by-position';
import { SyntaxNode } from 'web-tree-sitter';

export class LocalVariables extends BasicCompletion {
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
        // Travel previous siblings
        let previousSibling: SyntaxNode | null = node.parent;

        while (previousSibling) {
          if (
            previousSibling.type === 'statement_directive' &&
            previousSibling.firstNamedChild?.type === 'assignment_statement'
          ) {
            let label = previousSibling.firstNamedChild?.namedChild(1)?.text;

            if (label) {
              completions.push({
                label,
                kind: CompletionItemKind.Variable,
              });
            }
          } else if (
            previousSibling.type === 'statement_directive' &&
            previousSibling.firstNamedChild?.type === 'for_statement'
          ) {
            for (const item of previousSibling.firstNamedChild.children) {
              if (item.type === 'variable') {
                completions.push({
                  label: item.text,
                  kind: CompletionItemKind.Variable,
                });
              }
            }
          }

          previousSibling = previousSibling.previousSibling;
        }
      }
    }

    return completions;
  }
}
