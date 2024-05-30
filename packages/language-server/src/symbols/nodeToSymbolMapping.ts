import {
    FunctionArgument,
    TwigBlock,
    TwigImport,
    TwigMacro,
    TwigVariableDeclaration,
} from './types';
import { getNodeRange, getStringNodeValue } from '../utils/node';
import { SyntaxNode } from 'web-tree-sitter';

export function toBlock(node: SyntaxNode): Omit<TwigBlock, 'symbols'> {
    const nameNode = node.childForFieldName('name')!;

    return {
        name: nameNode.text,
        range: getNodeRange(node),
        nameRange: getNodeRange(nameNode),
    };
}

export function toVariable(node: SyntaxNode): TwigVariableDeclaration {
    const variableNode = node.childForFieldName('variable')!;

    const type = node.type === 'set_block'
        ? 'string'
        : node.childForFieldName('type')?.text;

    return {
        name: variableNode.text,
        nameRange: getNodeRange(variableNode),
        value: node.childForFieldName('value')?.text,
        type,
        reflectedType: null,
        range: getNodeRange(node),
        references: [],
    };
}

export function toMacro(node: SyntaxNode): Omit<TwigMacro, 'symbols'> {
    const nameNode = node.childForFieldName('name')!;
    const argumentsNode = node.childForFieldName('arguments');

    const variableArgs = argumentsNode?.descendantsOfType('variable')
        .map((argumentNode): FunctionArgument => ({
            name: argumentNode.text,
            nameRange: getNodeRange(argumentNode),
            range: getNodeRange(argumentNode),
        })) || [];

    const namedArgs = argumentsNode
        ?.descendantsOfType('named_argument')
        .map((argumentNode): FunctionArgument => {
            const argNameNode = argumentNode.childForFieldName('key')!;
            const value = argumentNode.childForFieldName('value')!.text;

            return {
                name: argNameNode.text,
                nameRange: getNodeRange(argNameNode),
                value,
                range: getNodeRange(argumentNode),
            };
        }) || [];

    return {
        name: nameNode.text,
        nameRange: getNodeRange(nameNode),
        args: [...variableArgs, ...namedArgs],
        range: getNodeRange(node),
    };
}

function resolveImportPath(pathNode: SyntaxNode) {
    if (pathNode.type === 'string') {
        return getStringNodeValue(pathNode);
    }

    return undefined;
}

export function toImport(node: SyntaxNode): TwigImport {
    const pathNode = node.childForFieldName('expr')!;
    const aliasNode = node.childForFieldName('variable')!;

    return {
        name: aliasNode.text,
        path: resolveImportPath(pathNode),
        range: getNodeRange(node),
        nameRange: getNodeRange(aliasNode),
        references: [],
    };
}
