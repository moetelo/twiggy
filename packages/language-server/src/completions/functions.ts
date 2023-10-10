import {
  Command,
  CompletionItem,
  CompletionItemKind,
  InsertTextFormat,
} from 'vscode-languageserver/node';
import { SyntaxNode } from 'web-tree-sitter';
import { twigFunctions } from '../common';
import { TwigFunctionLike } from './debug-twig';
import { isEmptyEmbedded } from '../utils/node';
import { triggerParameterHints } from '../signature-helps/triggerParameterHintsCommand';

const commonCompletionItem: Partial<CompletionItem> = {
    kind: CompletionItemKind.Function,
    insertTextFormat: InsertTextFormat.Snippet,
    command: triggerParameterHints,
    detail: 'function',
};

const completions: CompletionItem[] = twigFunctions.map((item) => ({
    ...item,
    ...commonCompletionItem,
    insertText: `${item.label}($1)$0`,
}));

export function functions(cursorNode: SyntaxNode, functions: TwigFunctionLike[]): CompletionItem[] {
    if (['variable', 'function'].includes(cursorNode.type) || isEmptyEmbedded(cursorNode)) {
        const completionsPhp = functions.map((func): CompletionItem => ({
            ...commonCompletionItem,
            label: func.identifier,
            insertText: `${func.identifier}($1)$0`,
        }));

        return [
            ...completions.filter(comp => !completionsPhp.find(compPhp => compPhp.label === comp.label)),
            ...completionsPhp,
        ];
    }

    return [];
}
