import { SyntaxNode } from 'web-tree-sitter';

export function getStringNodeValue(stringNode: SyntaxNode) {
    if (stringNode.type !== 'string') {
        throw new Error('Node is not a string. ' + stringNode.type);
    }

    return stringNode.text.slice('"'.length, -'"'.length)
}
