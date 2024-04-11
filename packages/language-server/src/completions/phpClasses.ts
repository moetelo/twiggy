import { CompletionItem, CompletionItemKind } from 'vscode-languageserver/node';
import { SyntaxNode } from 'web-tree-sitter';
import { findParentByType } from '../utils/node';
import { PhpExecutor } from '../phpInterop/PhpExecutor';

type VarVariable = {
    fullClassName: string;
    className: string;
};

const toCompletionItem = (variable: VarVariable): CompletionItem => ({
    label: variable.fullClassName,
    kind: CompletionItemKind.Class,
    detail: variable.className,
    insertText: variable.fullClassName,
})

export async function phpClasses(
    node: SyntaxNode,
    phpExecutor: PhpExecutor | null,
): Promise<CompletionItem[]> {
    if (!phpExecutor) return [];

    const closestTypeNode = findParentByType(node, 'type');
    if (!closestTypeNode) return [];

    const classNames = await phpExecutor.getClassCompletion(closestTypeNode.text);
    const classes = classNames.map(fullClassName => {
        fullClassName = '\\' + fullClassName;
        const parts = fullClassName.split('\\');
        const className = parts[parts.length - 1];
        return toCompletionItem({ fullClassName, className });
    });

    console.log(classNames.slice(0, 10));

    return classes;
}
