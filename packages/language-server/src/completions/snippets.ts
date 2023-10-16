import { SyntaxNode } from 'web-tree-sitter';
import { commonCompletionItem as commonFunctionCompletionItem } from './functions';
import { twigFunctions } from '../staticCompletionInfo';
import { CompletionItem } from 'vscode-languageserver';

const functionSnippets: CompletionItem[] = twigFunctions
    .filter(x => x.createSnippet)
    .map((item) => ({
        ...item,
        ...commonFunctionCompletionItem,
        insertText: `{{ ${item.label}($1) }}$0`,
    }));

export function snippets(cursorNode: SyntaxNode) {
    if (cursorNode.type !== 'content') {
        return [];
    }

    return [
        ...functionSnippets,
    ];
}
