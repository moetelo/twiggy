import type { SyntaxNode } from 'web-tree-sitter';
import { twigFunctions } from '../staticCompletionInfo';
import type { Hover } from 'vscode-languageserver';

const nodeTypes = new Set([ 'variable', 'function' ]);

export function functions(cursorNode: SyntaxNode): Hover | undefined {
    if (!nodeTypes.has(cursorNode.type)) return undefined;

    const variable = twigFunctions.find(item => item.label === cursorNode.text);

    if (variable?.documentation === undefined) return undefined;

    return {
        contents: variable.documentation,
    };
}
