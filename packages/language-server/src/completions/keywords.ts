import { CompletionItem, CompletionItemKind } from 'vscode-languageserver/node';
import { SyntaxNode } from 'web-tree-sitter';
import { twigKeywords } from '../staticCompletionInfo';
import { isInsideStatement } from '../utils/node/isInsideStatement';

export const commonCompletionItem: Partial<CompletionItem> = {
    kind: CompletionItemKind.Keyword,
    commitCharacters: [' '],
};

const completions: CompletionItem[] = twigKeywords.map(item => ({
    ...commonCompletionItem,
    label: item.label,
    insertText: item.label,
}));

export function keywords(cursorNode: SyntaxNode): CompletionItem[] {
    if (isInsideStatement(cursorNode)) {
        return completions;
    }

    return [];
}
