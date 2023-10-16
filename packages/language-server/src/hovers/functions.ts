import { SyntaxNode } from 'web-tree-sitter';
import { twigFunctions } from '../staticCompletionInfo';
import { Hover } from 'vscode-languageserver';

const nodeTypes = [ 'variable', 'function' ];

export function functions(cursorNode: SyntaxNode): Hover | undefined {
    if (!nodeTypes.includes(cursorNode.type)) return;

    const variable = twigFunctions.find(item => item.label === cursorNode.text);

    if (!variable?.documentation) return;

    return {
        contents: variable.documentation,
    };
}
