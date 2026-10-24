import type { SyntaxNode } from 'web-tree-sitter';
import { twigFilters } from '../staticCompletionInfo';
import type { Hover } from 'vscode-languageserver';

const nodeTypes = new Set([ 'variable', 'function' ]);

export function filters(cursorNode: SyntaxNode): Hover | undefined {
    if (
        !nodeTypes.has(cursorNode.type)
        && cursorNode.previousSibling?.text !== '|'
    ) {
        return undefined;
    }

    const filter = twigFilters.find(item => item.label === cursorNode.text);

    if (filter?.documentation === undefined) return undefined;

    return {
        contents: filter.documentation,
    };
}
