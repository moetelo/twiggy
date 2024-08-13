import { CompletionItem, CompletionItemKind } from 'vscode-languageserver/node';
import { SyntaxNode } from 'web-tree-sitter';
import { Document } from '../documents';
import { FunctionArgument, hasReflectedType, TwigVariableDeclaration } from '../symbols/types';
import { isInExpressionScope } from '../utils/node';
import { pointToPosition } from '../utils/position';
import { positionsEqual } from '../utils/position/comparePositions';

const toCompletionItem = (variable: TwigVariableDeclaration | FunctionArgument): CompletionItem => ({
    label: variable.name,
    kind: CompletionItemKind.Field,
    detail: hasReflectedType(variable) ? variable.type : variable.value,
});

export function localVariables(document: Document, cursorNode: SyntaxNode): CompletionItem[] {
    if (cursorNode.type !== 'variable' && !isInExpressionScope(cursorNode)) {
        return [];
    }

    const locals = document.getLocalsAt(
        pointToPosition(cursorNode.startPosition),
    );

    // excludes the current variable from the completion list
    // so it doesn't show up when the cursor is on the variable name
    const localsWithoutCurrentVariable = locals.filter(local =>
        !(positionsEqual(local.nameRange.start, pointToPosition(cursorNode.startPosition))
        && positionsEqual(local.nameRange.end, pointToPosition(cursorNode.endPosition)))
    );

    return localsWithoutCurrentVariable.map(toCompletionItem);
}
