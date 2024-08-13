import { SyntaxNode } from 'web-tree-sitter';
import { ReflectedType } from '../phpInterop/ReflectedType';
import { ITypeResolver } from './ITypeResolver';
import { LocalSymbolInformation, hasReflectedType } from '../symbols/types';
import { IExpressionTypeResolver } from './IExpressionTypeResolver';
import { primitives } from '../phpInterop/primitives';

// TODO: provide Twig environment, resolve type for `{{ something() }}`

export class ExpressionTypeResolver implements IExpressionTypeResolver {
    static supportedTypes = new Set([
        'call_expression',
        'member_expression',
        'variable',
        'var_declaration',
        // TODO: handle these
        // 'subscript_expression',
        // 'filter_expression',
        // 'parenthesized_expression',
    ]);

    constructor(
        private readonly typeResolver: ITypeResolver,
    ) {
    }

    async resolveExpression(expr: SyntaxNode, locals: LocalSymbolInformation): Promise<ReflectedType | null> {
        if (expr.type === 'call_expression') {
            const memberExpr = expr.childForFieldName('name');
            if (!memberExpr) return null;

            return await this.resolveExpression(memberExpr, locals);
        }

        if (expr.type === 'member_expression') {
            const objectNode = expr.childForFieldName('object');
            if (!objectNode) return null;

            const objectType = await this.resolveExpression(objectNode, locals);
            if (!objectType) return null;

            const propertyName = expr.childForFieldName('property')?.text;
            if (!propertyName) return null;

            const propertyOrMethod = [
                ...objectType.methods,
                ...objectType.properties,
            ].find(m => m.name === propertyName);

            if (!propertyOrMethod) return null;

            if (propertyOrMethod.type === 'self') {
                return objectType;
            }

            if (primitives.has(propertyOrMethod.type)) {
                return null;
            }

            return await this.typeResolver.reflectType(propertyOrMethod.type);
        }

        if (expr.type === 'variable') {
            const variable = locals.variableDefinition.get(expr.text);
            if (!variable || !hasReflectedType(variable) || !variable.type) return null;

            return variable.reflectedType;
        }

        if (expr.type === 'var_declaration') {
            const typeNode = expr.childForFieldName('type');

            if (!typeNode) return null;

            if (typeNode.type === 'array_type') {
                const arrayItemType = typeNode.firstChild?.text;

                // just in case
                if (!arrayItemType) return null;

                const itemReflectedType = await this.typeResolver.reflectType(arrayItemType);

                const reflectedType: ReflectedType = {
                    properties: [],
                    methods: [],
                    arrayType: {
                        itemType: arrayItemType,
                        itemReflectedType: itemReflectedType,
                    },
                };

                return reflectedType;
            }

            return this.typeResolver.reflectType(typeNode.text);
        }

        return null;
    }
}
