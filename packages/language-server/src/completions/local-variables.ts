import { CompletionItem, CompletionItemKind } from 'vscode-languageserver/node';
import { SyntaxNode } from 'web-tree-sitter';
import { Document } from '../documents';
import { FunctionArgument, TwigVariable } from '../symbols/types';
import { isInExpressionScope } from '../utils/node';
import { pointToPosition } from '../utils/position';

const toCompletionItem = (variable: TwigVariable | FunctionArgument): CompletionItem => ({
    label: variable.name,
    kind: CompletionItemKind.Field,
    detail: variable.value,
});

export function localVariables(document: Document, cursorNode: SyntaxNode): CompletionItem[] {
    if (cursorNode.type !== 'variable' && !isInExpressionScope(cursorNode)) {
        return [];
    }

    const locals = document.getLocalsAt(
        pointToPosition(cursorNode.startPosition),
    );

    return locals.map(toCompletionItem);
}
