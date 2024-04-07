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

export function symfonyRouteNames(cursorNode: SyntaxNode, routeNames: string[]): CompletionItem[] {
    if (isInStringInsideOfPathCall(cursorNode)) {
        const completions: CompletionItem[] = routeNames.map((routeName) => ({
            ...commonCompletionItem,
            label: routeName,
        }));

        return completions;
    }

    return [];
}
