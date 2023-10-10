import { Command, CompletionItem, CompletionItemKind, InsertTextFormat } from 'vscode-languageserver/node';
import { SyntaxNode } from 'web-tree-sitter';
import { forLoopProperties } from '../common';
import { Document, DocumentCache } from '../documents';
import { triggerParameterHints } from '../signature-helps/triggerParameterHintsCommand';

export async function variableProperties(document: Document, documentCache: DocumentCache, cursorNode: SyntaxNode): Promise<CompletionItem[]> {
    if (
        cursorNode.text === '.' &&
        cursorNode.previousSibling?.type === 'variable'
    ) {
        const variableName = cursorNode.previousSibling.text;

        if (variableName === 'loop') {
            return forLoopProperties;
        }

        const importedDocument = await documentCache.resolveImport(document, variableName);
        if (!importedDocument) return [];

        await importedDocument.ensureParsed();
        return importedDocument.locals.macro.map(macro => ({
            label: macro.name,
            kind: CompletionItemKind.Function,
            insertTextFormat: InsertTextFormat.Snippet,
            command: triggerParameterHints,
            insertText: `${macro.name}($1)$0`,
        }));
    }

    return [];
}
