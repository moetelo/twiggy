import type { SyntaxNode } from 'web-tree-sitter';
import type { Hover } from 'vscode-languageserver';
import type { Document } from '../documents';
import { pointToPosition } from '../utils/position';
import type { TwigImport, TwigVariableDeclaration } from '../symbols/types';
import { isTwigImport } from '../symbols/types';

export function localVariables(document: Document, cursorNode: SyntaxNode): Hover | undefined {
    if (cursorNode.type !== 'variable') return undefined;

    const locals = document.getLocalsAt(
        pointToPosition(cursorNode.startPosition),
    );

    const result = locals.find(({ name }) => name === cursorNode.text) as TwigImport | TwigVariableDeclaration | undefined;

    if (!result) return undefined;

    if (isTwigImport(result)) {
        return {
            contents: {
                kind: 'markdown',
                value: `import '${result.path}'`,
            },
        };
    }

    if (result.type) {
        return {
            contents: {
                kind: 'markdown',
                value: result.type,
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
