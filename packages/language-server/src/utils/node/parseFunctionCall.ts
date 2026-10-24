import type { Range } from 'vscode-languageserver';
import type { SyntaxNode } from 'web-tree-sitter';
import { getNodeRange } from './getNodeRange';

type FunctionCallArgument = {
    name: string,
    range: Range,
};

type FunctionCall = {
    object?: string,
    name: string,
    args: FunctionCallArgument[],
};

const toFunctionCallArgument = (node: SyntaxNode): FunctionCallArgument => ({
    name: node.text,
    range: getNodeRange(node)
});

export const parseFunctionCall = (
    node: SyntaxNode | null,
): FunctionCall | undefined => {
    const isCall = !!node && node.type === 'call_expression';
    if (!isCall) return undefined;

    const nameNode = node.childForFieldName('name')!;

    const objectNode = nameNode.childForFieldName('object');
    const functionNameNode = nameNode.type === 'function'
        ? nameNode
        : nameNode.childForFieldName('property');

    const argNodes = node.childForFieldName('arguments')?.namedChildren;
    const args = argNodes?.map((argNode) => toFunctionCallArgument(argNode)) ?? [];

    return {
        object: objectNode?.text,
        name: functionNameNode!.text,
        args,
    };
};
