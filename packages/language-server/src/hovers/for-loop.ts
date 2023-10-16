import { SyntaxNode } from 'web-tree-sitter';
import { forLoopProperties } from '../staticCompletionInfo';
import { findParentByType } from '../utils/node';
import { Hover } from 'vscode-languageserver';

export function forLoop(cursorNode: SyntaxNode): Hover | undefined {
    if (!findParentByType(cursorNode, 'for')) {
        return;
    }

    if (
        cursorNode.type === 'property' &&
        cursorNode.previousSibling?.text === '.' &&
        cursorNode.previousSibling?.previousSibling?.type === 'variable' &&
        cursorNode.previousSibling?.previousSibling?.text === 'loop'
    ) {
        const property = forLoopProperties.find(
            item => item.label === cursorNode.text,
        );

        if (!property?.detail) return;

        return {
            contents: property.detail,
        };
    }
}
