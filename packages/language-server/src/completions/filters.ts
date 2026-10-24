import type { CompletionItem } from 'vscode-languageserver/node';
import { CompletionItemKind } from 'vscode-languageserver/node';
import type { SyntaxNode } from 'web-tree-sitter';
import { twigFilters } from '../staticCompletionInfo';
import type { TwigFunctionLike } from '../twigEnvironment/types';

const commonCompletionItem: Partial<CompletionItem> = {
    kind: CompletionItemKind.Function,
    detail: 'filter',
};

const completions: CompletionItem[] = twigFilters.map((item) => ({
    ...commonCompletionItem,
    ...item,
}));

export function filters(cursorNode: SyntaxNode, environmentFilters: TwigFunctionLike[]): CompletionItem[] {
    if (
        cursorNode.text === '|' ||
        (cursorNode.type === 'function' &&
            cursorNode.parent?.type === 'filter_expression')
    ) {
        const completionsPhp = environmentFilters.map(
            (func): CompletionItem => ({
                ...commonCompletionItem,
                label: func.identifier,
            }),
        );

        return [
            ...completions,
            ...completionsPhp.filter((comp) => !completions.some((item) => item.label === comp.label)),
        ];
    }

    return [];
}
