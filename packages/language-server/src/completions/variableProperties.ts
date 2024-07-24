import { CompletionItem, CompletionItemKind, InsertTextFormat } from 'vscode-languageserver/node';
import { SyntaxNode } from 'web-tree-sitter';
import { forLoopProperties } from '../staticCompletionInfo';
import { Document, DocumentCache } from '../documents';
import { triggerParameterHints } from '../signature-helps/triggerParameterHintsCommand';
import { TwigMacro } from '../symbols/types';
import { pointToPosition } from '../utils/position';
import { Position } from 'vscode-languageserver-textdocument';
import { ReflectedType } from '../phpInterop/ReflectedType';
import { IExpressionTypeResolver } from '../typing/IExpressionTypeResolver';
import { ExpressionTypeResolver } from '../typing/ExpressionTypeResolver';

const macroToCompletionItem = (macro: TwigMacro) => ({
    label: macro.name,
    kind: CompletionItemKind.Function,
    insertTextFormat: InsertTextFormat.Snippet,
    command: triggerParameterHints,
    insertText: !macro.args.length
        ? `${macro.name}()$0`
        : macro.name,
});

const getVariableNode = (cursorNode: SyntaxNode) => {
    if (
        cursorNode.text === '.'
        && cursorNode.previousSibling?.type === 'variable'
    ) {
        return cursorNode.previousSibling;
    }

    if (
        cursorNode.parent?.type === 'subscript_expression'
        && cursorNode.type === 'string'
    ) {
        return cursorNode.parent.childForFieldName('object')!;
    }

    return null;
};

const getExpressionNode = (cursorNode: SyntaxNode) => {
    if (
        cursorNode.text === '.'
        && cursorNode.parent?.firstNamedChild
        && ExpressionTypeResolver.supportedTypes.has(cursorNode.parent.firstNamedChild.type)
    ) {
        return cursorNode.previousSibling;
    }

    return null;
};

const reflectedTypeToCompletions = (reflectedType: ReflectedType, options: { includeMethods: boolean }) => {
    const properties = reflectedType.properties.map((prop) => (({
        label: prop.name,
        detail: prop.type,
        kind: CompletionItemKind.Property
    }) as CompletionItem));

    if (!options.includeMethods) return properties;

    return [
        ...properties,
        ...reflectedType.methods.map((method) => (({
            label: method.name,
            kind: CompletionItemKind.Method,
            command: triggerParameterHints,
            insertTextFormat: InsertTextFormat.Snippet,
            detail: method.type,
            insertText: !method.parameters.length
                ? `${method.name}()$0`
                : `${method.name}($1)$0`,
        }) as CompletionItem)),
    ];
}

export async function variableProperties(
    document: Document,
    documentCache: DocumentCache,
    cursorNode: SyntaxNode,
    exprTypeResolver: IExpressionTypeResolver | null,
    pos: Position,
): Promise<CompletionItem[]> {
    const variableNode = getVariableNode(cursorNode);
    if (!variableNode) {
        if (!exprTypeResolver) return [];

        const expressionNode = getExpressionNode(cursorNode);
        if (!expressionNode) return [];

        const type = await exprTypeResolver.resolveExpression(expressionNode, document.locals);
        if (!type) return [];

        return reflectedTypeToCompletions(type, { includeMethods: true });
    }

    const variableName = variableNode.text;

    if (variableName === 'loop') {
        return forLoopProperties;
    }

    const variable = document.locals.variableDefinition.get(variableName);
    if (variable && 'reflectedType' in variable) {
        if (!exprTypeResolver || !variable.reflectedType) return [];

        return reflectedTypeToCompletions(variable.reflectedType, {
            includeMethods: cursorNode.parent!.type !== 'subscript_expression',
        });
    }

    const importedDocument = await documentCache.resolveImport(document, variableName, pos);
    if (importedDocument) {
        const localMacros = importedDocument.locals.macro;

        if (importedDocument !== document) {
            return localMacros.map(macroToCompletionItem);
        }

        const scopedMacros = importedDocument
            .getScopeAt(pointToPosition(cursorNode.startPosition))
            ?.macro || [];

        const allMacros = new Set([
            ...localMacros,
            ...scopedMacros,
        ]);

        return [...allMacros].map(macroToCompletionItem);
    }

    return [];
}
