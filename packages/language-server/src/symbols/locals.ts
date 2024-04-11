import {
    FunctionArgument,
    LocalSymbolInformation,
    TwigBlock,
    TwigImport,
    TwigMacro,
    TwigVariable,
} from './types';
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

    // TODO: `comment` node. refac later
    const valueNode = node.childForFieldName('value') || node.childForFieldName('type');

    return {
        name: variableNode.text,
        nameRange: getNodeRange(variableNode),
        value: valueNode!.text,
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

function resolveImportPath(pathNode: SyntaxNode) {
    if (pathNode.type === 'string') {
        return getStringNodeValue(pathNode);
    }

    return undefined;
}

function toImport(node: SyntaxNode): TwigImport {
    const pathNode = node.childForFieldName('expr')!;
    const aliasNode = node.childForFieldName('variable')!;

    return {
        name: aliasNode.text,
        path: resolveImportPath(pathNode),
        range: getNodeRange(node),
        nameRange: getNodeRange(aliasNode),
    };
}

export function collectLocals(tree: SyntaxNode | null): LocalSymbolInformation {
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
            case 'comment':
                const node = cursor.currentNode();
                if (node.namedChildCount === 0) {
                    continue;
                }
                const variable = toVariable(node);
                localSymbols.variable.push(variable);
                continue;
            case 'macro':
                const macro = toMacro(cursor.currentNode());
                localSymbols.macro.push(macro);
                continue;

            case 'if':
            case 'elseif':
            case 'else':
                cursor.gotoFirstChild();
                continue;

            case 'source_elements':
                const sourceElementsLocals = collectLocals(cursor.currentNode());
                localSymbols.variable.push(...sourceElementsLocals.variable);
                localSymbols.macro.push(...sourceElementsLocals.macro);
                localSymbols.block.push(...sourceElementsLocals.block);
                localSymbols.imports.push(...sourceElementsLocals.imports);
                cursor.gotoParent();
                continue;
        }
    } while (cursor.gotoNextSibling());

    return localSymbols;
}
