import {
    Connection,
    Definition,
    DefinitionParams,
    Range,
    WorkspaceFolder,
} from 'vscode-languageserver';
import { getNodeRange, isBlockIdentifier, isPathInsideTemplateEmbedding } from '../utils/node';
import { Document, DocumentCache } from '../documents';
import { getStringNodeValue } from '../utils/node';
import { pointToPosition } from '../utils/position';
import { positionsEqual } from '../utils/position/comparePositions';
import { documentUriToFsPath } from '../utils/uri';
import { PhpExecutor } from '../phpInterop/PhpExecutor';
import { findParentByType } from '../utils/node/findParentByType';

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

        if (!document) {
            return;
        }

        const cursorNode = document.deepestAt(params.position);
        if (!cursorNode) {
            return;
        }

        if (isPathInsideTemplateEmbedding(cursorNode)) {
            const document = await this.documentCache.resolveByTwigPath(
                getStringNodeValue(cursorNode),
            );

            if (!document) return;

            return {
                uri: document.uri,
                range: Range.create(0, 0, 0, 0),
                // range: Range.create(
                //     cursorNode.startPosition.row, cursorNode.startPosition.column,
                //     cursorNode.endPosition.row, cursorNode.endPosition.column,
                // ),
            };
        }

        if (isBlockIdentifier(cursorNode)) {
            if (cursorNode.parent?.type !== 'block') {
                let extendedDocument: Document | undefined = document;

                const blockArgumentNode = cursorNode.parent!.namedChildren[0];
                const templateArgumentNode = cursorNode.parent!.namedChildren[1];

                const blockName = blockArgumentNode.type === 'string'
                    ? getStringNodeValue(blockArgumentNode)
                    : blockArgumentNode.text;

                if (templateArgumentNode) {
                    const path = getStringNodeValue(templateArgumentNode);
                    const document = await this.documentCache.resolveByTwigPath(path);

                    if (!document) {
                        // target template not found
                        return;
                    }

                    if (cursorNode.equals(templateArgumentNode)) {
                        return {
                            uri: document.uri,
                            range: Range.create(0, 0, 0, 0),
                            // range: Range.create(
                            //     templateArgumentNode.startPosition.row, templateArgumentNode.startPosition.column,
                            //     templateArgumentNode.endPosition.row, templateArgumentNode.endPosition.column,
                            // ),
                        };
                    }
                    extendedDocument = document;
                }

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
            }
            return;

        }

        if (cursorNode.type === 'variable') {
            const cursorPosition = pointToPosition(cursorNode.startPosition);
            const scopedVariables = document.getLocalsAt(cursorPosition);

            const symbol = scopedVariables.find((x) => x.name === cursorNode.text);

            if (!symbol) return;

            return {
                uri: document.uri,
                range: symbol.nameRange,
            };
        }

        if (cursorNode.type === 'property') {
            const macroName = cursorNode.text;
            const importName = cursorNode.parent!.firstChild!.text;

            const importedDocument = await this.documentCache.resolveImport(document, importName, params.position);
            if (!importedDocument) return;

            const macro = importedDocument.locals.macro.find(macro => macro.name === macroName);
            if (!macro) return;

            return {
                uri: importedDocument.uri,
                range: macro.nameRange,
            };
        }

        const typeIdentifierNode = findParentByType(cursorNode, 'qualified_name');
        if (typeIdentifierNode) {
            if (!this.phpExecutor) return;

            const result = await this.phpExecutor.getClassDefinition(typeIdentifierNode.text);
            if (!result?.path) return;

            return {
                uri: result.path,
                range: getNodeRange(typeIdentifierNode),
            };
        }
    }

    private async getExtendedTemplate(document: Document) {
        if (!document.locals.extends) {
            return undefined;
        }

        return await this.documentCache.resolveByTwigPath(document.locals.extends);
    }
}
