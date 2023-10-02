import {
    FunctionArgument,
    LocalSymbolInformation,
    TwigBlock,
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

    const args =
        argumentsNode
            ?.descendantsOfType('argument')
            .map((argumentNode): FunctionArgument => {
                const argNameNode =
                    argumentNode.childForFieldName('key') || argumentNode;
                const value = argumentNode.childForFieldName('value')?.text;

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
        args,
        range: getNodeRange(node),
        symbols: collectLocals(bodyNode),
    };
}

export function collectLocals(tree: IWalkable | null): LocalSymbolInformation {
    const localSymbols: LocalSymbolInformation = {
        variable: [],
        macro: [],
        block: [],
    };

    if (!tree) {
        return localSymbols;
    }

    const cursor = tree.walk();
    cursor.gotoFirstChild();

    do {
        switch (cursor.nodeType) {
            case 'extends':
                const expr = cursor.currentNode().childForFieldName('expr');

                if (expr) {
                    localSymbols.extends = getStringNodeValue(expr);
                }

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
