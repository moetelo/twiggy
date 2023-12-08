import { CompletionItem, CompletionItemKind, InsertTextFormat } from 'vscode-languageserver/node';
import { SyntaxNode } from 'web-tree-sitter';
import { forLoopProperties } from '../staticCompletionInfo';
import { Document, DocumentCache } from '../documents';
import { triggerParameterHints } from '../signature-helps/triggerParameterHintsCommand';
import { TwigMacro } from '../symbols/types';

const macroToCompletionItem = (macro: TwigMacro) => ({
    label: macro.name,
    kind: CompletionItemKind.Function,
    insertTextFormat: InsertTextFormat.Snippet,
    command: triggerParameterHints,
    insertText: `${macro.name}($1)$0`,
})

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
        const localMacros = importedDocument.locals.macro.map(macroToCompletionItem);

        if (importedDocument !== document) {
            return localMacros;
        }

        const scopedMacros = importedDocument.getScopeAt(cursorNode.startPosition)?.symbols.macro.map(macroToCompletionItem) || [];

        return [
            ...localMacros,
            ...scopedMacros,
        ];
    }

    return [];
}
