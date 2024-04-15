import { CompletionItem, CompletionItemKind } from 'vscode-languageserver/node';
import { SyntaxNode } from 'web-tree-sitter';
import { PhpExecutor } from '../phpInterop/PhpExecutor';
import { primitives } from '../phpInterop/primitives';
import { closestByPredicate } from '../utils/node';

type VarVariable = {
    fullClassName: string,
    className: string,
};

const toCompletionItem = (variable: VarVariable): CompletionItem => ({
    label: variable.fullClassName,
    kind: CompletionItemKind.Class,
    detail: variable.className,
    insertText: variable.fullClassName,
});

const primitiveCompletions = primitives.map(
    primitive => toCompletionItem({ fullClassName: primitive, className: primitive }),
);

const typeNodes = new Set([
    'primitive_type',
    'qualified_name',
    'incomplete_type',
]);

// `\Foo|Bar & | #}`
// `|` is a cursor
const isAtTheEndOfVarDeclaration = (node: SyntaxNode) => node.type === 'comment_end' && node.parent!.type === 'var_declaration';

export async function phpClasses(
    node: SyntaxNode,
    phpExecutor: PhpExecutor | null,
): Promise<CompletionItem[]> {
    const typeNode = closestByPredicate(node, (n) => typeNodes.has(n.type))
    if (!typeNode && !isAtTheEndOfVarDeclaration(node)) return [];

    if (!phpExecutor) return primitiveCompletions;

    const classNames = await phpExecutor.getClassCompletion(typeNode?.text || '');
    const classes = classNames.map(fullClassName => {
        fullClassName = '\\' + fullClassName;
        const parts = fullClassName.split('\\');
        const className = parts[parts.length - 1];
        return toCompletionItem({ fullClassName, className });
    });

    return [
        ...primitiveCompletions,
        ...classes,
    ];
}
