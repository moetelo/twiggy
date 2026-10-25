import type {
    LocalSymbolInformation,
    TwigBlock,
    TwigImport,
    TwigMacro,
    TwigVariableDeclaration,
} from './types';
import { getNodeRange, getStringNodeValue } from '../utils/node';
import type { SyntaxNode } from 'web-tree-sitter';
import type { ITypeResolver } from '../typing/ITypeResolver';
import { ExpressionTypeResolver } from '../typing/ExpressionTypeResolver';
import { toMacro, toVariable, toBlock, toImport } from './nodeToSymbolMapping';
import type { ReflectedType } from '../phpInterop/ReflectedType';

const nodesToDiveInto: ReadonlySet<string> = new Set([
    'if',
    'elseif',
    'output',
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
    'array',
    'pair',
    'source_elements',

    // Tags whose whole subtree is expressions, and so is safe to walk flat.
    // Without these the walker skips the tag entirely, so a variable used only
    // inside one is never marked as referenced and is reported as unused.
    //
    // Kept narrow on purpose. A tag belongs here only if it neither introduces a
    // scope nor has a field that is something other than an expression:
    //
    //   `embed`   scopes its body and owns its blocks, so its symbols belong to
    //             the embedded template, not this one.
    //   `with`    scopes its body, and its context keys are bindings.
    //   `apply`   its `filter` field is not an expression scope: in the chained
    //             form the first filter parses as a `variable`.
    //   `cache`   its `key` field is an expression, so a bare keyword there --
    //             `{% cache globally %}` -- would be collected as a local.
    //   `tag`     the generic node for unknown tags parses every argument as an
    //             expression, so bare keywords become locals.
    //   `use`     nothing to find: block-name aliases sit in `as_operator`
    //             nodes, which are not walked, and its template name is a
    //             string literal.
    'include',
    'autoescape',
    'sandbox',
    'do',
    'deprecated',
]);

export class LocalSymbolCollector {
    localSymbols: LocalSymbolInformation;

    private readonly exprTypeResolver: ExpressionTypeResolver | null = null;

    constructor(
        private readonly tree: SyntaxNode | null,
        private readonly typeResolver: ITypeResolver | null,
        variableDefinitionMap = new Map<string, TwigImport | TwigVariableDeclaration>(),
    ) {
        this.localSymbols = {
            variableDefinition: variableDefinitionMap,
            extends: undefined,
            variable: [],
            macro: [],
            block: [],
            imports: [],
        };

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
                case 'extends':
                    this.#visitExtends(cursor.currentNode);
                    continue;

                case 'import':
                    this.#visitImport(cursor.currentNode);
                    continue;

                case 'block':
                    await this.#visitBlock(cursor.currentNode);
                    continue;

                case 'set':
                case 'set_block':
                case 'var_declaration':
                    await this.#visitVariableDeclaration(cursor.currentNode);
                    continue;

                case 'types':
                    await this.#visitTypes(cursor.currentNode);
                    continue;

                case 'macro':
                    await this.#visitMacro(cursor.currentNode);
                    continue;

                case 'for':
                    await this.#visitFor(cursor.currentNode);
                    continue;

                case 'variable':
                    await this.#visitVariable(cursor.currentNode);
                    continue;

                // No default
            }
        } while (cursor.gotoNextSibling());

        return this.localSymbols;
    }

    async #visitFor(currentNode: SyntaxNode) {
        const forVariableNodes = currentNode.childrenForFieldName('variable');
        for (const variable of forVariableNodes) {
            await this.#visitVariable(variable, false);
        }

        const expr = currentNode.childForFieldName('expr');
        await this.collect(expr);

        const bodyNode = currentNode.childForFieldName('body');
        await this.collect(bodyNode);
    }

    async #visitVariable(currentNode: SyntaxNode, isUsedInPlace = true) {
        const nameRange = getNodeRange(currentNode);

        const alreadyDefinedVar = this.localSymbols.variableDefinition.get(currentNode.text);
        if (alreadyDefinedVar) {
            alreadyDefinedVar.references.push(nameRange);
            return;
        }

        const { parent } = currentNode;
        if (!parent) return;

        const reflectedType = await this.#reflectVariableDeclarationType(currentNode);
        const implicitVariable: TwigVariableDeclaration = {
            name: currentNode.text,
            nameRange,
            range: getNodeRange(parent),
            // Implicitly defined variables are used in-place.
            // i.e. when you meet a variable for the first time,
            // it's "defined" and used in the same place.
            references: isUsedInPlace ? [nameRange] : [],
            reflectedType,
        };
        this.localSymbols.variable.push(implicitVariable);
        this.localSymbols.variableDefinition.set(implicitVariable.name, implicitVariable);
    }

    async #visitMacro(currentNode: SyntaxNode) {
        const macro = toMacro(currentNode);
        if (!macro) return;

        const bodyNode = currentNode.childForFieldName('body');

        const scopedSymbolCollector = new LocalSymbolCollector(bodyNode, this.typeResolver);
        await scopedSymbolCollector.collect();

        const macroWithSymbols: TwigMacro = {
            ...macro,
            symbols: scopedSymbolCollector.localSymbols,
        };
        this.localSymbols.macro.push(macroWithSymbols);
    }

    async #visitTypes(currentNode: SyntaxNode) {
        const typesVariableNodes = currentNode.namedChildren;
        for (const variable of typesVariableNodes) {
            switch (variable.type) {
                case 'types_optional_declaration':
                case 'types_required_declaration':
                    await this.#visitVariableDeclaration(variable);
                    continue;

                // No default
            }
        }
    }

    async #visitVariableDeclaration(currentNode: SyntaxNode) {
        const variableDeclaration = toVariable(currentNode);
        if (!variableDeclaration) return;

        const alreadyDefinedVar = this.localSymbols.variableDefinition.get(
            variableDeclaration.name,
        );
        if (alreadyDefinedVar) {
            const nameRange = getNodeRange(currentNode);
            alreadyDefinedVar.references.push(nameRange);
        } else {
            this.localSymbols.variable.push(variableDeclaration);
            this.localSymbols.variableDefinition.set(variableDeclaration.name, variableDeclaration);
        }

        const valueNode = currentNode.childForFieldName('value');
        variableDeclaration.reflectedType = await this.#reflectVariableDeclarationType(
            currentNode,
            true,
        );

        await this.collect(valueNode);
    }

    async #reflectVariableDeclarationType(
        varDeclarationNode: SyntaxNode,
        isDeclaration?: boolean,
    ): Promise<ReflectedType | null> {
        if (!this.exprTypeResolver) return null;

        if (isDeclaration) {
            if (varDeclarationNode.type === 'set') {
                const valueNode = varDeclarationNode.childForFieldName('value');
                if (!valueNode) return null;
                return this.exprTypeResolver.resolveExpression(valueNode, this.localSymbols);
            }

            return this.exprTypeResolver.resolveExpression(varDeclarationNode, this.localSymbols);
        }

        const valueNode = varDeclarationNode.childForFieldName('value');
        if (valueNode) {
            return this.exprTypeResolver.resolveExpression(valueNode, this.localSymbols);
        }

        const forLoopArrayNode =
            varDeclarationNode.parent?.type === 'for' ? varDeclarationNode.nextNamedSibling : null;
        if (forLoopArrayNode) {
            const forLoopArrayType = await this.exprTypeResolver.resolveExpression(
                forLoopArrayNode,
                this.localSymbols,
            );

            return forLoopArrayType?.arrayType?.itemReflectedType ?? null;
        }

        return null;
    }

    async #visitBlock(currentNode: SyntaxNode) {
        const block = toBlock(currentNode);
        if (!block) return;

        const bodyNode = currentNode.childForFieldName('body');

        const scopedSymbolCollector = new LocalSymbolCollector(
            bodyNode,
            this.typeResolver,
            this.localSymbols.variableDefinition,
        );

        const blockWithSymbols: TwigBlock = {
            ...block,
            symbols: await scopedSymbolCollector.collect(),
        };
        this.localSymbols.block.push(blockWithSymbols);
    }

    #visitImport(currentNode: SyntaxNode) {
        const twigImport = toImport(currentNode);
        if (!twigImport) return;

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
