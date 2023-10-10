import { CompletionItem, CompletionItemKind } from 'vscode-languageserver/node';
import { SyntaxNode } from 'web-tree-sitter';
import { findParentByType } from '../utils/node';
import { isEmptyEmbedded } from '../utils/node';

export function forLoop(cursorNode: SyntaxNode): CompletionItem[] {
    if (!findParentByType(cursorNode, 'for')) {
        return [];
    }

    if (cursorNode.type === 'variable' || isEmptyEmbedded(cursorNode)) {
        return [
            {
                label: 'loop',
                kind: CompletionItemKind.Variable,
            },
        ];
    }

    return [];
}
