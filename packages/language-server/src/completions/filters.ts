import { CompletionItem, CompletionItemKind } from 'vscode-languageserver/node';
import { SyntaxNode } from 'web-tree-sitter';
import { twigFilters } from '../staticCompletionInfo';
import { TwigFunctionLike } from './debug-twig';

const commonCompletionItem: Partial<CompletionItem> = {
    kind: CompletionItemKind.Function,
    detail: 'filter',
};

const completions: CompletionItem[] = twigFilters.map((item) => ({
    ...commonCompletionItem,
    ...item,
}));

export function filters(cursorNode: SyntaxNode, filters: TwigFunctionLike[]): CompletionItem[] {
    if (
        cursorNode.text === '|' ||
        (cursorNode.type === 'function' &&
            cursorNode.parent!.type === 'filter_expression')
    ) {
        const completionsPhp = filters.map(
            (func): CompletionItem => ({
                ...commonCompletionItem,
                label: func.identifier,
            }),
        );

        return [
            ...completions,
            ...completionsPhp.filter((comp) => !completions.find((item) => item.label === comp.label)),
        ];
    }

    return [];
}
