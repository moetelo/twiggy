import { SyntaxNode } from 'web-tree-sitter';
import { commonCompletionItem as commonFunctionCompletionItem } from './functions';
import { twigFunctions, twigKeywords } from '../staticCompletionInfo';
import { CompletionItem, CompletionItemKind, InsertTextFormat } from 'vscode-languageserver';
import { commonCompletionItem as commonKeywordCompletionItem } from './keywords';
import { triggerCompletion } from './triggerCompletionCommand';

const commonSnippetItem: Partial<CompletionItem> = {
    kind: CompletionItemKind.Snippet,
    insertTextFormat: InsertTextFormat.Snippet,
    detail: 'snippet',
};

const functionSnippets: CompletionItem[] = twigFunctions
    .filter(x => x.createSnippet)
    .map((item) => ({
        ...item,
        ...commonFunctionCompletionItem,
        ...commonSnippetItem,
        insertText: `{{ ${item.label}($1) }}$0`,
    }));

const keywordSnippets: CompletionItem[] = twigKeywords
    .filter(item => item.body)
    .map(item => ({
        ...commonKeywordCompletionItem,
        ...commonSnippetItem,
        label: item.label,
        command: triggerCompletion,
        insertText: item.body!.join('\n'),
    }));

export function snippets(cursorNode: SyntaxNode) {
    if (cursorNode.type !== 'content') {
        return [];
    }

    return [
        ...functionSnippets,
        ...keywordSnippets,
    ];
}
