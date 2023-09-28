import {
  CompletionItem,
  CompletionItemKind,
  DocumentUri,
} from 'vscode-languageserver/node';
import { documentUriToFsPath } from '../utils/document-uri-to-fs-path';
import path from 'path';
import { SyntaxNode } from 'web-tree-sitter';
import { templateUsingFunctions, templateUsingStatements } from '../constants/template-usage';

export function templatePaths(
  cursorNode: SyntaxNode,
  templatesPath: string,
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
    templateUsingStatements.includes(node.type) ||
    // {{ include('template.html') }}
    // {{ source('template.html') }}
    (node.type === 'arguments' &&
      templateUsingFunctions.includes(
        node.parent?.childForFieldName('name')?.text || ''
      )) ||
    // {{ block("title", "common_blocks.twig") }}
    (node.type === 'arguments' &&
      node.parent?.childForFieldName('name')?.text === 'block' &&
      cursorNode?.equals(node.namedChildren[1]))
  ) {
    for (const twigPath of documentsPaths) {
      if (!twigPath.startsWith(templatesPath)) {
        continue;
      }

      const relativePath = path.relative(templatesPath, twigPath);

      completions.push({
        label: relativePath,
        kind: CompletionItemKind.File,
      });
    }
  }

  return completions;
}
