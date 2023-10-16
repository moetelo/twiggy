import { SyntaxNode } from 'web-tree-sitter';
import { twigGlobalVariables } from '../staticCompletionInfo';
import { Hover } from 'vscode-languageserver';

export function globalVariables(cursorNode: SyntaxNode): Hover | undefined {
    if (cursorNode.type !== 'variable') return;

    const variable = twigGlobalVariables.find(item => item.label === cursorNode.text);

    if (!variable) return;

    return {
        contents: variable?.documentation,
    };
}
