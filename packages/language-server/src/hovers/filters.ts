import { SyntaxNode } from 'web-tree-sitter';
import { twigFilters } from '../staticCompletionInfo';
import { Hover } from 'vscode-languageserver';

const nodeTypes = [ 'variable', 'function' ];

export function filters(cursorNode: SyntaxNode): Hover | undefined {
    if (
        !nodeTypes.includes(cursorNode.type)
        && cursorNode.previousSibling?.text !== '|'
    ) {
        return;
    }

    const filter = twigFilters.find(item => item.label === cursorNode.text);

    if (!filter?.documentation) return;

    return {
        contents: filter.documentation,
    };
}
