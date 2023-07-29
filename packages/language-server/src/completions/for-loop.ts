import { CompletionItem, CompletionItemKind } from 'vscode-languageserver/node';
import { SyntaxNode } from 'web-tree-sitter';

const completions: CompletionItem[] = [
  {
    label: 'index',
    detail: 'The current iteration of the loop. (1 indexed)',
    kind: CompletionItemKind.Property,
  },
  {
    label: 'index0',
    detail: 'The current iteration of the loop. (0 indexed)',
    kind: CompletionItemKind.Property,
  },
  {
    label: 'revindex',
    detail: 'The number of iterations from the end of the loop (1 indexed)',
    kind: CompletionItemKind.Property,
  },
  {
    label: 'revindex0',
    detail: 'The number of iterations from the end of the loop (0 indexed)',
    kind: CompletionItemKind.Property,
  },
  {
    label: 'first',
    detail: 'True if first iteration',
    kind: CompletionItemKind.Property,
  },
  {
    label: 'last',
    detail: 'True if last iteration',
    kind: CompletionItemKind.Property,
  },
  {
    label: 'length',
    detail: 'The number of items in the sequence',
    kind: CompletionItemKind.Property,
  },
  {
    label: 'parent',
    detail: 'The parent context',
    kind: CompletionItemKind.Property,
  },
];

export function forLoop(cursorNode: SyntaxNode) {
  let forNode;
  let node = cursorNode;

  while (node.parent) {
    if (node.type === 'for') {
      forNode = node;
      break;
    }
    node = node.parent;
  }

  if (!forNode) {
    return;
  }

  if (
    cursorNode.text === '.' &&
    cursorNode.previousSibling?.type === 'variable' &&
    cursorNode.previousSibling?.text === 'loop'
  ) {
    return completions;
  }

  if (cursorNode.type === 'variable') {
    return [
      {
        label: 'loop',
        kind: CompletionItemKind.Variable,
      },
    ];
  }
}
