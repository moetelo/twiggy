import type { CompletionItem } from 'vscode-languageserver/node';
import { CompletionItemKind } from 'vscode-languageserver/node';
import type { SyntaxNode } from 'web-tree-sitter';
import { findParentByType, isInExpressionScope } from '../utils/node';

export function forLoop(cursorNode: SyntaxNode): CompletionItem[] {
    if (!findParentByType(cursorNode, 'for')) {
        return [];
    }

    if (cursorNode.type === 'variable' || isInExpressionScope(cursorNode)) {
        return [
            {
                label: 'loop',
                kind: CompletionItemKind.Variable,
            },
        ];
    }

    return [];
}
