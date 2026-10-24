import type { SyntaxNode } from 'web-tree-sitter';
import { twigGlobalVariables } from '../staticCompletionInfo';
import type { Hover } from 'vscode-languageserver';

export function globalVariables(cursorNode: SyntaxNode): Hover | undefined {
    if (cursorNode.type !== 'variable') return undefined;

    const variable = twigGlobalVariables.find(item => item.label === cursorNode.text);

    if (!variable) return undefined;

    return {
        contents: variable.documentation,
    };
}
