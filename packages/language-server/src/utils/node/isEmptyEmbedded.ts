import type { SyntaxNode } from 'web-tree-sitter';

const outputNodesToNamedChildCount = new Map([
    ['output', 1],
    ['if', 2],
    ['for', 2],
]);

export const isEmptyEmbedded = (node: SyntaxNode) => {
    const minNamedChildCount = outputNodesToNamedChildCount.get(node.type);
    return minNamedChildCount !== undefined && node.namedChildCount < minNamedChildCount;
};

export const isInExpressionScope = (node: SyntaxNode) => isEmptyEmbedded(node)
    // Cursor might be in the `embedded_begin` node.
    // TODO: remove `embedded_begin` from the AST?
    // or rework this logic to compare the type to `embedded_begin` and `embedded_end`.
    || node.parent && isEmptyEmbedded(node.parent);
