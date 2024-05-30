import {
    IWithReferences,
    IWithReflectedType,
    LocalSymbolInformation,
    TwigBlock,
    TwigMacro,
    TwigVariableDeclaration,
    type TwigImport,
} from './types';
import { getNodeRange, getStringNodeValue } from '../utils/node';
import { SyntaxNode } from 'web-tree-sitter';
import { ITypeResolver } from '../typing/ITypeResolver';
import { ExpressionTypeResolver } from '../typing/ExpressionTypeResolver';
import { toMacro, toVariable, toBlock, toImport } from './nodeToSymbolMapping';

const nodesToDiveInto: ReadonlySet<string> = new Set([
    'if',
    'elseif',
    'else',
    'for',
    'output',
    'primary_expression',
    'unary_expression',
    'binary_expression',
    'ternary_expression',
    'subscript_expression',
    'member_expression',
    'filter_expression',
    'parenthesized_expression',
    'call_expression',
    'arguments',
    'object',
    'pair',
    'source_elements',
]);

export class LocalSymbolCollector {
    localSymbols: LocalSymbolInformation = {
        variableDefinition: undefined as any, // ctor init
        extends: undefined,
        variable: [],
        macro: [],
        block: [],
        imports: [],
    };

    private readonly exprTypeResolver: ExpressionTypeResolver | null = null;

    constructor(
        private readonly tree: SyntaxNode,
        private readonly typeResolver: ITypeResolver | null,
        variableDefinitionMap: Map<string, TwigImport | TwigVariableDeclaration> = new Map(),
    ) {
        this.localSymbols.variableDefinition = variableDefinitionMap;

        if (this.typeResolver) {
            this.exprTypeResolver = new ExpressionTypeResolver(this.typeResolver);
        }
    }

    async collect(subtree: SyntaxNode | null = this.tree): Promise<typeof this.localSymbols> {
        if (!subtree) {
            return this.localSymbols;
        }

        const cursor = subtree.walk();
        cursor.gotoFirstChild();

        do {
            if (nodesToDiveInto.has(cursor.nodeType)) {
                await this.collect(cursor.currentNode);
                continue;
            }

            switch (cursor.nodeType) {
                case 'extends': {
                    this.#visitExtends(cursor.currentNode);
                    continue;
                }

                case 'import': {
                    this.#visitImport(cursor.currentNode);
                    continue;
                }

                case 'block': {
                    await this.#visitBlock(cursor.currentNode);
                    continue;
                }

                case 'set':
                case 'set_block':
                case 'var_declaration': {
                    await this.#visitVariableDeclaration(cursor.currentNode);
                    continue;
                }

                case 'macro': {
                    await this.#visitMacro(cursor.currentNode);
                    continue;
                }

                case 'variable': {
                    this.#visitVariable(cursor.currentNode);
                    continue;
                }
            }
        } while (cursor.gotoNextSibling());

        return this.localSymbols;
    }

    #visitVariable(currentNode: SyntaxNode) {
        const nameRange = getNodeRange(currentNode);

        const alreadyDefinedVar = this.localSymbols.variableDefinition.get(currentNode.text);
        if (alreadyDefinedVar) {
            alreadyDefinedVar.references.push(nameRange);
            return;
        }

        const implicitVariable: TwigVariableDeclaration = {
            name: currentNode.text,
            nameRange,
            range: getNodeRange(currentNode.parent!),
            // Implicitly defined variables are used in-place.
            // i.e. when you meet a variable for the first time,
            // it's "defined" and used in the same place.
            references: [ nameRange ],
            reflectedType: null,
        };
        this.localSymbols.variable.push(implicitVariable);
        this.localSymbols.variableDefinition.set(implicitVariable.name, implicitVariable);
    }

    async #visitMacro(currentNode: SyntaxNode) {
        const macro = toMacro(currentNode);
        const bodyNode = currentNode.childForFieldName('body')!;

        const scopedSymbolCollector = new LocalSymbolCollector(bodyNode, this.typeResolver);
        await scopedSymbolCollector.collect();

        const macroWithSymbols: TwigMacro = {
            ...macro,
            symbols: scopedSymbolCollector.localSymbols,
        };
        this.localSymbols.macro.push(macroWithSymbols);
    }

    async #visitVariableDeclaration(currentNode: SyntaxNode) {
        const variableDeclaration = toVariable(currentNode);
        const valueNode = currentNode.childForFieldName('value');

        if (!variableDeclaration.type) {
            if (this.exprTypeResolver && valueNode) {
                variableDeclaration.reflectedType = await this.exprTypeResolver.resolveExpression(
                    valueNode,
                    this.localSymbols,
                );
            }
        } else if (this.typeResolver) {
            variableDeclaration.reflectedType = await this.typeResolver.reflectType(variableDeclaration.type);
        }

        this.localSymbols.variable.push(variableDeclaration);
        this.localSymbols.variableDefinition.set(variableDeclaration.name, variableDeclaration);

        await this.collect(valueNode);
    }

    async #visitBlock(currentNode: SyntaxNode) {
        const block = toBlock(currentNode);
        const bodyNode = currentNode.childForFieldName('body')!;

        const scopedSymbolCollector = new LocalSymbolCollector(bodyNode, this.typeResolver, this.localSymbols.variableDefinition);

        const blockWithSymbols: TwigBlock = {
            ...block,
            symbols: await scopedSymbolCollector.collect(),
        };
        this.localSymbols.block.push(blockWithSymbols);
    }

    #visitImport(currentNode: SyntaxNode) {
        const twigImport = toImport(currentNode);
        this.localSymbols.imports.push(twigImport);
        this.localSymbols.variableDefinition.set(twigImport.name, twigImport);
    }

    #visitExtends(currentNode: SyntaxNode) {
        const exprNode = currentNode.childForFieldName('expr');

        if (exprNode?.type === 'string') {
            this.localSymbols.extends = getStringNodeValue(exprNode);
        }
    }
}
