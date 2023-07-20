import {
  CompletionItem,
  CompletionItemKind,
  DocumentUri,
} from 'vscode-languageserver/node';
import { documentUriToFsPath } from '../utils/document-uri-to-fs-path';
import { dirname, relative } from 'path';
import { trimTwigExtension } from '../utils/trim-twig-extension';
import { SyntaxNode } from 'web-tree-sitter';

export function templatePaths(
  cursorNode: SyntaxNode,
  currentDocumentUri: DocumentUri,
  documentsPaths: IterableIterator<DocumentUri>
) {
  if (cursorNode.type !== 'string') {
    return;
  }

  const completions: CompletionItem[] = [];
  let node = cursorNode.parent;

  if (!node) {
    return;
  }

  // This case for array or ternary wrappers
  // ['template.html']
  // ajax ? 'ajax.html' : 'not_ajax.html'
  if (['array', 'ternary'].includes(node.type)) {
    node = node.parent;
  }

  if (!node) {
    return;
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
    const currentPath = dirname(documentUriToFsPath(currentDocumentUri));

    for (const twigPath of documentsPaths) {
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
