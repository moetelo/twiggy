import type { CompletionItem } from 'vscode-languageserver/node';
import { CompletionItemKind } from 'vscode-languageserver/node';
import type { SyntaxNode } from 'web-tree-sitter';
import { twigGlobalVariables } from '../staticCompletionInfo';
import type { TwigVariable } from '../twigEnvironment/types';
import { isInExpressionScope } from '../utils/node';

const commonCompletionItem: Partial<CompletionItem> = {
    kind: CompletionItemKind.Variable,
    commitCharacters: ['|', '.'],
    detail: 'global variable',
};

const completions: CompletionItem[] = twigGlobalVariables.map(item => ({
    ...commonCompletionItem,
    ...item,
}));

export function globalVariables(cursorNode: SyntaxNode, globals: TwigVariable[]): CompletionItem[] {
    if (cursorNode.type === 'variable' || isInExpressionScope(cursorNode)) {
        const completionsPhp = globals.map((variable): CompletionItem => ({
            ...commonCompletionItem,
            label: variable.identifier,
        }));

        return [
            ...completions,
            ...completionsPhp.filter(comp => !completions.some(item => item.label === comp.label)),
        ];
    }

    return [];
}
