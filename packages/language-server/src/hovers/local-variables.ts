import { SyntaxNode } from 'web-tree-sitter';
import { Hover } from 'vscode-languageserver';
import { Document } from '../documents';
import { pointToPosition } from '../utils/position';
import { TwigVariable } from '../symbols/types';

export function localVariables(document: Document, cursorNode: SyntaxNode): Hover | undefined {
    if (cursorNode.type !== 'variable') return undefined;

    const locals = document.getLocalsAt(
        pointToPosition(cursorNode.startPosition),
    );

    const result: TwigVariable | undefined = locals.find(({ name }) => name === cursorNode.text);

    if (!result) return undefined;

    if (result.type) {
        return {
            contents: {
                kind: 'markdown',
                value: `**${result.name}**: ${result.type}`,
            },
        };
    }

    if (result.value) {
        return {
            contents: {
                kind: 'markdown',
                value: `**${result.name}** = ${result.value}`,
            },
        };
    }

    return undefined;
}
