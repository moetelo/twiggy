import {
    Connection,
    Definition,
    DefinitionParams,
    Range,
    WorkspaceFolder,
} from 'vscode-languageserver';
import { getNodeRange } from '../utils/node';
import { SyntaxNode } from 'web-tree-sitter';
import {
    templateUsingFunctions,
    templateUsingStatements,
} from '../constants/template-usage';
import { Document, DocumentCache } from '../documents';
import { getStringNodeValue } from '../utils/node';
import { rangeContainsPosition, pointToPosition } from '../utils/position';
import { parseFunctionCall } from '../utils/node/parseFunctionCall';
import { positionsEqual } from '../utils/position/comparePositions';
import { documentUriToFsPath } from '../utils/uri';
import { PhpExecutor } from '../phpInterop/PhpExecutor';
import { findParentByType } from '../utils/node/findParentByType';

const isPathInsideTemplateEmbedding = (node: SyntaxNode): boolean => {
    if (node.type !== 'string' || !node.parent) {
        return false;
    }

    const isInsideStatement = templateUsingStatements.includes(
        node.parent.type,
    );

    if (isInsideStatement) {
        return true;
    }

    const isInsideFunctionCall =
        node.parent?.type === 'arguments' &&
        templateUsingFunctions.some((func) =>
            parseFunctionCall(node.parent!.parent)?.name === func,
        );

    return isInsideFunctionCall;
};

const isBlockIdentifier = (node: SyntaxNode): boolean => {
    if (!node.parent) {
        return false;
    }

    if (node.parent.type === 'block' && node.type === 'identifier') {
        return true;
    }

    if (node.parent.parent?.type === 'call_expression') {
        const call = parseFunctionCall(node.parent.parent);
        return !!call && node.type === 'string' && call.name === 'block' && !call.object;
    }

    return false;
};

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
        const document = this.documentCache.get(params.textDocument.uri);

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
            };
        }

        if (isBlockIdentifier(cursorNode)) {
            const blockName = cursorNode.type === 'string'
                ? getStringNodeValue(cursorNode)
                : cursorNode.text;

            let extendedDocument: Document | undefined = document;
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
