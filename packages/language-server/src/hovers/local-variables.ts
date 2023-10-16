import { SyntaxNode } from 'web-tree-sitter';
import { collectLocals } from '../symbols/locals';
import { closestByPredicate } from '../utils/node';
import { Hover } from 'vscode-languageserver';

export function localVariables(cursorNode: SyntaxNode): Hover | undefined {
    if (cursorNode.type !== 'variable') return;

    const templateFragmentNode = closestByPredicate(cursorNode, node =>
        ['macro', 'block', 'template'].includes(node.type),
    );
    const bodyNode = templateFragmentNode?.childForFieldName('body') || templateFragmentNode;
    const locals = collectLocals(bodyNode);

    const result = locals.variable.find(({ name }) => name === cursorNode.text);

    if (!result) return;

    return { contents: result.value };
}
