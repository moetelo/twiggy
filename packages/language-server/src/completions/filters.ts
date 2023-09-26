import { CompletionItem, CompletionItemKind } from 'vscode-languageserver/node';
import { SyntaxNode } from 'web-tree-sitter';
import { twigFilters } from '../common';
import { TwigFunctionLike } from './debug-twig';

const commonCompletionItem: Partial<CompletionItem> = {
  kind: CompletionItemKind.Function,
  detail: 'filter',
};

const completions: CompletionItem[] = twigFilters.map((item) => ({
  ...commonCompletionItem,
  ...item,
}));

export function filters(cursorNode: SyntaxNode, filters: TwigFunctionLike[]) {
  if (cursorNode.text === '|') {
    const completionsPhp = filters.map((func): CompletionItem => ({
      ...commonCompletionItem,
      label: func.identifier,
    }));

    return [
      ...completions.filter(comp => !completionsPhp.find(compPhp => compPhp.label === comp.label)),
      ...completionsPhp,
    ];
  }
}
