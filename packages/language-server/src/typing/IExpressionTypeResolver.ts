import { SyntaxNode } from 'web-tree-sitter';
import { ReflectedType } from '../phpInterop/ReflectedType';
import { LocalSymbolInformation } from '../symbols/types';

export interface IExpressionTypeResolver {
    resolveExpression(expr: SyntaxNode, locals: LocalSymbolInformation): Promise<ReflectedType | null>;
}
