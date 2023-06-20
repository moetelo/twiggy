import {
  CompletionItem,
  CompletionItemKind,
  CompletionParams,
} from 'vscode-languageserver/node';
import { BasicCompletion } from './basic-completion';
import { findNodeByPosition } from '../utils/find-element-by-position';
import { documentUriToFsPath } from '../utils/document-uri-to-fs-path';
import { dirname, relative } from 'path';
import { trimTwigExtension } from '../utils/trim-twig-extension';

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
        // This case for array or ajax wrapper
        // ['template.html']
        // ajax ? 'ajax.html' : 'not_ajax.html'
        if (
          node.parent?.type === 'array' ||
          node.parent?.type === 'ternary_expression'
        ) {
          node = node.parent;
        }

        if (
          // {% import "forms.html" as forms %}
          // {% from "macros.twig" import hello %}
          (node.parent &&
            ['import_statement', 'from_statement'].includes(
              node.parent?.type
            )) ||
          // {% include 'template.html' %}
          // {% extends 'template.html' %}
          // {% use 'template.html' %}
          (node.parent?.type === 'tag_statement' &&
            node.previousSibling?.type === 'tag' &&
            ['include', 'extends', 'use', 'import', 'from'].includes(
              node.previousSibling?.text
            )) ||
          // {% include('template.html') %}
          // {% source('template.html') %}
          (node.parent?.parent?.parent?.parent?.type === 'function_call' &&
            node.parent?.parent?.parent?.previousSibling &&
            ['include', 'source'].includes(
              node.parent?.parent?.parent?.previousSibling?.text
            )) ||
          // {{ block("title", "common_blocks.twig") }}
          (node.parent?.parent?.parent?.parent?.type === 'function_call' &&
            node.parent?.parent?.parent?.previousSibling?.text === 'block' &&
            node.parent?.parent.id ===
              node.parent?.parent?.parent?.children.at(-2)?.id)
        ) {
          const twigPaths = this.server.documentCache.documents.keys();
          const currentPath = dirname(documentUriToFsPath(uri));

          for (const twigPath of twigPaths) {
            completions.push({
              label: relative(
                currentPath,
                documentUriToFsPath(trimTwigExtension(twigPath))
              ),
              kind: CompletionItemKind.File,
            });
          }
        }
      }
    }

    return completions;
  }
}
