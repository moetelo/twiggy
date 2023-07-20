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
  async onCompletion(completionParams: CompletionParams) {
    const completions: CompletionItem[] = [];
    const uri = completionParams.textDocument.uri;
    const document = this.server.documentCache.getDocument(uri);

    if (!document) {
      return;
    }

    const cst = await document.cst();
    let cursorNode = findNodeByPosition(
      cst.rootNode,
      completionParams.position
    );
    let node = cursorNode;

    if (node?.type !== 'string' || !node.parent) {
      return;
    }

    node = node.parent;

    // This case for array or ternary wrappers
    // ['template.html']
    // ajax ? 'ajax.html' : 'not_ajax.html'
    if (['array', 'ternary'].includes(node.type)) {
      if (!node.parent) {
        return;
      }

      node = node.parent;
    }

    if (
      // {% import "forms.html" as forms %}
      // {% from "macros.twig" import hello %}
      // {% include 'template.html' %}
      // {% extends 'template.html' %}
      // {% use 'template.html' %}
      ['import', 'from', 'include', 'extends', 'use'].includes(node.type) ||
      // {{ include('template.html') }}
      // {{ source('template.html') }}
      (node.type === 'arguments' &&
        ['include', 'source'].includes(
          node.parent?.childForFieldName('name')?.text || ''
        )) ||
      // {{ block("title", "common_blocks.twig") }}
      (node.type === 'arguments' &&
        node.parent?.childForFieldName('name')?.text === 'block' &&
        cursorNode?.equals(node.namedChildren[1]))
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

    return completions;
  }
}
