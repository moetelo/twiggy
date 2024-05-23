import {
    FunctionArgument,
    LocalSymbolInformation,
    TwigBlock,
    TwigImport,
    TwigMacro,
    TwigVariableDeclaration,
} from './types';
import { getNodeRange, getStringNodeValue } from '../utils/node';
import { SyntaxNode } from 'web-tree-sitter';

function toBlock(node: SyntaxNode, variableDefinitionMap: Map<string, TwigVariableDeclaration>): TwigBlock {
    const nameNode = node.childForFieldName('name')!;
    const bodyNode = node.childForFieldName('body');

    return {
        name: nameNode.text,
        range: getNodeRange(node),
        nameRange: getNodeRange(nameNode),
        symbols: collectLocals(bodyNode, variableDefinitionMap),
    };
}

function toVariable(node: SyntaxNode): TwigVariableDeclaration {
    const variableNode = node.childForFieldName('variable')!;

    return {
        name: variableNode.text,
        nameRange: getNodeRange(variableNode),
        value: node.childForFieldName('value')?.text,
        type: node.childForFieldName('type')?.text,
        range: getNodeRange(node),
        references: [],
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
        references: [],
    };
}

export function collectLocals(tree: SyntaxNode | null, variableDefinitionMap = new Map<string, TwigVariableDeclaration>()): LocalSymbolInformation {
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
                const exprNode = cursor.currentNode.childForFieldName('expr');

                if (exprNode?.type === 'string') {
                    localSymbols.extends = getStringNodeValue(exprNode);
                }

                continue;
            case 'import':
                const twigImport = toImport(cursor.currentNode);
                localSymbols.imports.push(twigImport);
                variableDefinitionMap.set(twigImport.name, twigImport);
                continue;
            case 'block':
                const block = toBlock(cursor.currentNode, variableDefinitionMap);
                localSymbols.block.push(block);
                continue;
            case 'set':
            case 'set_block':
            case 'var_declaration': {
                const { currentNode } = cursor;
                const variableDeclaration = toVariable(currentNode);
                localSymbols.variable.push(variableDeclaration);
                variableDefinitionMap.set(variableDeclaration.name, variableDeclaration);

                const localsInAssignmentExpr = collectLocals(
                    currentNode.childForFieldName('value'),
                    variableDefinitionMap,
                );
                localSymbols.variable.push(...localsInAssignmentExpr.variable);
                continue;
            }
            case 'macro':
                const macro = toMacro(cursor.currentNode);
                localSymbols.macro.push(macro);
                continue;

            case 'variable':
                const { currentNode } = cursor;
                const nameRange = getNodeRange(currentNode);

                const alreadyDefinedVar = variableDefinitionMap.get(currentNode.text);
                if (alreadyDefinedVar) {
                    alreadyDefinedVar.references.push(nameRange);
                    continue;
                }

                const variable: TwigVariableDeclaration = {
                    name: currentNode.text,
                    nameRange,
                    range: getNodeRange(currentNode.parent!),
                    references: [],
                };
                localSymbols.variable.push(variable);
                variableDefinitionMap.set(variable.name, variable);
                continue;

            case 'if':
            case 'elseif':
            case 'else':
            case 'for':
            case 'output':
            case 'primary_expression':
            case 'unary_expression':
            case 'binary_expression':
            case 'ternary_expression':
            case 'member_expression':
            case 'call_expression':
            case 'arguments':
            case 'source_elements': {
                const sourceElementsLocals = collectLocals(cursor.currentNode, variableDefinitionMap);
                localSymbols.variable.push(...sourceElementsLocals.variable);
                localSymbols.macro.push(...sourceElementsLocals.macro);
                localSymbols.block.push(...sourceElementsLocals.block);
                localSymbols.imports.push(...sourceElementsLocals.imports);
                continue;
            }
        }
    } while (cursor.gotoNextSibling());

    return localSymbols;
}
