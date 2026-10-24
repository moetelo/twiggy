import type { SyntaxNode } from 'web-tree-sitter';
import type { ReflectedType } from '../phpInterop/ReflectedType';
import type { LocalSymbolInformation } from '../symbols/types';

export interface IExpressionTypeResolver {
    resolveExpression(expr: SyntaxNode, locals: LocalSymbolInformation): Promise<ReflectedType | null>;
}
