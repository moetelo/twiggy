import {
    CompletionItem,
    CompletionItemKind,
} from 'vscode-languageserver/node';
import { SyntaxNode } from 'web-tree-sitter';

export const commonCompletionItem: Partial<CompletionItem> = {
    kind: CompletionItemKind.EnumMember,
    commitCharacters: [`'"`],
    detail: 'symfony path',
};

const isInStringInsideOfPathCall = (cursorNode: SyntaxNode): boolean => {
    return cursorNode.type === 'string'
        && cursorNode.parent?.type === 'arguments'
        && !!cursorNode.parent.firstNamedChild?.equals(cursorNode)
        && cursorNode.parent.parent!.childForFieldName('name')?.text === 'path';
}

export function symfonyPathNames(cursorNode: SyntaxNode, pathNames: string[]): CompletionItem[] {
    if (isInStringInsideOfPathCall(cursorNode)) {
        const completions: CompletionItem[] = pathNames.map((pathName) => ({
            ...commonCompletionItem,
            label: pathName,
        }));

        return completions;
    }

    return [];
}
