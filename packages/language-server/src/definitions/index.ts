import type {
    Connection,
    Definition,
    DefinitionParams,
    WorkspaceFolder,
} from 'vscode-languageserver';
import {
    Range,
} from 'vscode-languageserver';
import { getNodeRange, getStringNodeValue, isBlockIdentifier, isPathInsideTemplateEmbedding } from '../utils/node';
import type { Document, DocumentCache } from '../documents';
import { pointToPosition } from '../utils/position';
import { positionsEqual } from '../utils/position/comparePositions';
import { documentUriToFsPath } from '../utils/uri';
import type { PhpExecutor } from '../phpInterop/PhpExecutor';
import { findParentByType } from '../utils/node/findParentByType';
import type { SyntaxNode } from 'web-tree-sitter';

export class DefinitionProvider {
    workspaceFolderPath: string;
    phpExecutor: PhpExecutor | null = null;

    constructor(
        private readonly connection: Connection,
        private readonly documentCache: DocumentCache,
        workspaceFolder: WorkspaceFolder,
    ) {
        this.workspaceFolderPath = documentUriToFsPath(workspaceFolder.uri);
        this.connection.onDefinition(this.onDefinition.bind(this));
    }

    async onDefinition(
        params: DefinitionParams,
    ): Promise<Definition | undefined> {
        const document = await this.documentCache.get(params.textDocument.uri);
        const cursorNode = document.deepestAt(params.position);

        if (isPathInsideTemplateEmbedding(cursorNode)) {
            const templateDocument = await this.documentCache.resolveByTwigPath(
                getStringNodeValue(cursorNode),
            );

            if (!templateDocument) return undefined;

            return {
                uri: templateDocument.uri,
                range: Range.create(0, 0, 0, 0),
            };
        }

        if (isBlockIdentifier(cursorNode)) {
            if (!cursorNode.parent) {
                return;
            }

            if (cursorNode.parent.type === 'block') {
                const blockName = cursorNode.type === 'string'
                    ? getStringNodeValue(cursorNode)
                    : cursorNode.text;

                return this.#resolveBlockSymbol(blockName, document, cursorNode);
            }

            if (cursorNode.parent.type === 'arguments') {
                const [blockNameArgNode, templatePathArgNode] = cursorNode.parent.namedChildren;

                const blockName = blockNameArgNode.type === 'string'
                    ? getStringNodeValue(blockNameArgNode)
                    : blockNameArgNode.text;

                if (!templatePathArgNode) {
                    return this.#resolveBlockSymbol(blockName, document, cursorNode);
                }

                const path = getStringNodeValue(templatePathArgNode);
                const resolvedDocument = await this.documentCache.resolveByTwigPath(path);

                if (!resolvedDocument) {
                    // target template not found
                    return;
                }

                if (!cursorNode.equals(templatePathArgNode)) {
                    return this.#resolveBlockSymbol(blockName, resolvedDocument, cursorNode);
                }

                return {
                    uri: resolvedDocument.uri,
                    range: Range.create(0, 0, 0, 0),
                };
            }

            return;
        }

        if (cursorNode.type === 'variable') {
            const cursorPosition = pointToPosition(cursorNode.startPosition);
            const scopedVariables = document.getLocalsAt(cursorPosition);

            const symbol = scopedVariables.find((x) => x.name === cursorNode.text);

            if (!symbol) return undefined;

            return {
                uri: document.uri,
                range: symbol.nameRange,
            };
        }

        if (cursorNode.type === 'property') {
            const macroName = cursorNode.text;
            const importName = cursorNode.parent!.firstChild!.text;

            const importedDocument = await this.documentCache.resolveImport(document, importName, params.position);
            if (!importedDocument) return undefined;

            const macro = importedDocument.locals.macro.find((x) => x.name === macroName);
            if (!macro) return undefined;

            return {
                uri: importedDocument.uri,
                range: macro.nameRange,
            };
        }

        const typeIdentifierNode = findParentByType(cursorNode, 'qualified_name');
        if (typeIdentifierNode) {
            if (!this.phpExecutor) return undefined;

            const result = await this.phpExecutor.getClassDefinition(typeIdentifierNode.text);
            if (!result?.path) return undefined;

            return {
                uri: result.path,
                range: getNodeRange(typeIdentifierNode),
            };
        }
    }

    async #resolveBlockSymbol(blockName: string, initialDocument: Document, cursorNode: SyntaxNode) {
        let extendedDocument: Document | undefined = initialDocument;
        while (extendedDocument) {
            const blockSymbol = extendedDocument.getBlock(blockName);
            if (!blockSymbol || positionsEqual(blockSymbol.nameRange.start, getNodeRange(cursorNode).start)) {
                extendedDocument = await this.getExtendedTemplate(extendedDocument);
                continue;
            }
            return {
                uri: extendedDocument.uri,
                range: blockSymbol.nameRange,
            };
        }
        return undefined;
    }

    private async getExtendedTemplate(document: Document) {
        if (!document.locals.extends) {
            return undefined;
        }

        return this.documentCache.resolveByTwigPath(document.locals.extends);
    }
}
