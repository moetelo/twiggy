import type { SyntaxNode } from 'web-tree-sitter';
import { commonCompletionItem as commonFunctionCompletionItem } from './functions';
import type { SnippetLike } from '../staticCompletionInfo';
import { miscSnippets, twigFunctions, twigKeywords } from '../staticCompletionInfo';
import type { CompletionItem } from 'vscode-languageserver';
import { CompletionItemKind, InsertTextFormat } from 'vscode-languageserver';
import { commonCompletionItem as commonKeywordCompletionItem } from './keywords';
import { triggerCompletion } from './triggerCompletionCommand';

const commonSnippetItem: Partial<CompletionItem> = {
    kind: CompletionItemKind.Snippet,
    insertTextFormat: InsertTextFormat.Snippet,
    detail: 'snippet',
};

type Snippet = Required<SnippetLike>;

const hasSnippet = (snippetLike: SnippetLike): snippetLike is Snippet =>
    snippetLike.snippet !== undefined;

const snippetToCompletionItem = (snippet: Snippet): CompletionItem => ({
    ...commonKeywordCompletionItem,
    ...commonSnippetItem,
    label: snippet.label,
    command: triggerCompletion,
    insertText: snippet.snippet.join('\n'),
});

const functionSnippets: CompletionItem[] = twigFunctions
    .filter(x => x.createSnippet)
    .map(item => ({
        ...item,
        ...commonFunctionCompletionItem,
        ...commonSnippetItem,
        insertText: `{{ ${item.label}($1) }}$0`,
    }));

const keywordSnippets: CompletionItem[] = twigKeywords
    .filter(item => hasSnippet(item))
    .map(item => snippetToCompletionItem(item));

const miscSnippetCompletions = miscSnippets
    .filter(item => hasSnippet(item))
    .map(item => snippetToCompletionItem(item));

export function snippets(cursorNode: SyntaxNode) {
    if (cursorNode.type !== 'content') {
        return [];
    }

    return [...functionSnippets, ...keywordSnippets, ...miscSnippetCompletions];
}
