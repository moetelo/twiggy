import { SyntaxNode } from "web-tree-sitter";
import { parseFunctionCall } from "./parseFunctionCall";

export const isBlockIdentifier = (node: SyntaxNode): boolean => {
    if (!node.parent) {
        return false;
    }

    if (node.parent.type === 'block' && node.type === 'identifier') {
        return true;
    }

    if (node.parent.parent?.type === 'call_expression') {
        const call = parseFunctionCall(node.parent.parent);
        return !!call && node.type === 'string' && call.name === 'block' && !call.object;
    }

    return false;
};
