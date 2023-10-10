import {
    FunctionArgument,
    LocalSymbolInformation,
    TwigBlock,
    TwigImport,
    TwigMacro,
    TwigVariable,
} from './types';
import { IWalkable } from '../types/IWalkable';
import { getNodeRange, getStringNodeValue } from '../utils/node';
import { SyntaxNode } from 'web-tree-sitter';

function toBlock(node: SyntaxNode): TwigBlock {
    const nameNode = node.childForFieldName('name')!;
    const bodyNode = node.childForFieldName('body');

    return {
        name: nameNode.text,
        range: getNodeRange(node),
        nameRange: getNodeRange(nameNode),
        symbols: collectLocals(bodyNode),
    };
}

function toVariable(node: SyntaxNode): TwigVariable {
    const variableNode = node.childForFieldName('variable')!;
    const valueNode = node.childForFieldName('value')!;

    return {
        name: variableNode.text,
        nameRange: getNodeRange(variableNode),
        value: valueNode.text,
        range: getNodeRange(node),
    };
}

function toMacro(node: SyntaxNode): TwigMacro {
    const nameNode = node.childForFieldName('name')!;
    const argumentsNode = node.childForFieldName('arguments');
    const bodyNode = node.childForFieldName('body');

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
        symbols: collectLocals(bodyNode),
    };
}

function toImport(node: SyntaxNode): TwigImport {
    const pathNode = node.childForFieldName('expr')!;
    const aliasNode = node.childForFieldName('variable')!;

    return {
        name: aliasNode.text,
        path: getStringNodeValue(pathNode),
        range: getNodeRange(node),
        nameRange: getNodeRange(aliasNode),
    };
}

export function collectLocals(tree: IWalkable | null): LocalSymbolInformation {
    const localSymbols: LocalSymbolInformation = {
        variable: [],
        macro: [],
        block: [],
        imports: [],
    };

    if (!tree) {
        return localSymbols;
    }

    const cursor = tree.walk();
    cursor.gotoFirstChild();

    do {
        switch (cursor.nodeType) {
            case 'extends':
                const exprNode = cursor.currentNode().childForFieldName('expr');

                if (exprNode?.type === 'string') {
                    localSymbols.extends = getStringNodeValue(exprNode);
                }

                continue;
            case 'import':
                const twigImport = toImport(cursor.currentNode());
                localSymbols.imports.push(twigImport);
                continue;
            case 'block':
                const block = toBlock(cursor.currentNode());
                localSymbols.block.push(block);
                continue;
            case 'set':
                const variable = toVariable(cursor.currentNode());
                localSymbols.variable.push(variable);
                continue;
            case 'macro':
                const macro = toMacro(cursor.currentNode());
                localSymbols.macro.push(macro);
                continue;
        }
    } while (cursor.gotoNextSibling());

    return localSymbols;
}
