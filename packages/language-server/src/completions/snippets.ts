import { SyntaxNode } from 'web-tree-sitter';
import { commonCompletionItem as commonFunctionCompletionItem } from './functions';
import { SnippetLike, miscSnippets, twigFunctions, twigKeywords } from '../staticCompletionInfo';
import { CompletionItem, CompletionItemKind, InsertTextFormat } from 'vscode-languageserver';
import { commonCompletionItem as commonKeywordCompletionItem } from './keywords';
import { triggerCompletion } from './triggerCompletionCommand';

const commonSnippetItem: Partial<CompletionItem> = {
    kind: CompletionItemKind.Snippet,
    insertTextFormat: InsertTextFormat.Snippet,
    detail: 'snippet',
};

const snippetLikeToCompletionItem = (snippetLike: SnippetLike): CompletionItem => ({
    ...commonKeywordCompletionItem,
    ...commonSnippetItem,
    label: snippetLike.label,
    command: triggerCompletion,
    insertText: snippetLike.snippet!.join('\n'),
});

const functionSnippets: CompletionItem[] = twigFunctions
    .filter(x => x.createSnippet)
    .map((item) => ({
        ...item,
        ...commonFunctionCompletionItem,
        ...commonSnippetItem,
        insertText: `{{ ${item.label}($1) }}$0`,
    }));

const keywordSnippets: CompletionItem[] = twigKeywords
    .filter(item => item.snippet)
    .map(snippetLikeToCompletionItem);

const miscSnippetCompletions = miscSnippets.map(snippetLikeToCompletionItem);

export function snippets(cursorNode: SyntaxNode) {
    if (cursorNode.type !== 'content') {
        return [];
    }

    return [
        ...functionSnippets,
        ...keywordSnippets,
        ...miscSnippetCompletions,
    ];
}
