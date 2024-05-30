import { CompletionItem, CompletionItemKind, InsertTextFormat } from 'vscode-languageserver/node';
import { SyntaxNode } from 'web-tree-sitter';
import { forLoopProperties } from '../staticCompletionInfo';
import { Document, DocumentCache } from '../documents';
import { triggerParameterHints } from '../signature-helps/triggerParameterHintsCommand';
import { TwigMacro } from '../symbols/types';
import { PhpExecutor } from '../phpInterop/PhpExecutor';
import { pointToPosition } from '../utils/position';
import { Position } from 'vscode-languageserver-textdocument';

const macroToCompletionItem = (macro: TwigMacro) => ({
    label: macro.name,
    kind: CompletionItemKind.Function,
    insertTextFormat: InsertTextFormat.Snippet,
    command: triggerParameterHints,
    insertText: `${macro.name}($1)$0`,
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

export async function variableProperties(
    document: Document,
    documentCache: DocumentCache,
    cursorNode: SyntaxNode,
    phpExecutor: PhpExecutor | null,
    pos: Position,
): Promise<CompletionItem[]> {
    const variableNode = getVariableNode(cursorNode);
    if (!variableNode) {
        return [];
    }

    const variableName = variableNode.text;

    if (variableName === 'loop') {
        return forLoopProperties;
    }

    const variable = document.locals.variable.find((x) => x.name === variableName);
    if (variable && variable.type) {
        if (!phpExecutor) return [];

        const result = await phpExecutor.completeInstanceProperties(variable.type);

        if (!result) return [];

        const properties = result.properties.map((prop) => (({
            label: prop.name,
            detail: prop.type,
            kind: CompletionItemKind.Property
        }) as CompletionItem));

        if (cursorNode.parent!.type === 'subscript_expression') {
            return properties;
        }

        return [
            ...properties,
            ...result.methods.map((method) => (({
                label: method.name,
                kind: CompletionItemKind.Method,
                insertText: `${method.name}($1)$0`,
                insertTextFormat: InsertTextFormat.Snippet,
                detail: method.returnType
            }) as CompletionItem)),
        ];
    }

    const importedDocument = await documentCache.resolveImport(document, variableName, pos);
    if (importedDocument) {
        await importedDocument.ensureParsed();
        const localMacros = importedDocument.locals.macro.map(macroToCompletionItem);

        if (importedDocument !== document) {
            return localMacros;
        }

        const scopedMacros = importedDocument
            .getScopeAt(pointToPosition(cursorNode.startPosition))
            ?.macro.map(macroToCompletionItem) || [];

        return [
            ...localMacros,
            ...scopedMacros,
        ];
    }

    return [];
}
