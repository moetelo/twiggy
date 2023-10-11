import {
    Connection,
    Definition,
    DefinitionParams,
    Range,
} from 'vscode-languageserver';
import { Server } from '../server';
import { findNodeByPosition, getNodeRange } from '../utils/node';
import { SyntaxNode } from 'web-tree-sitter';
import {
    templateUsingFunctions,
    templateUsingStatements,
} from '../constants/template-usage';
import { Document } from '../documents';
import { getStringNodeValue } from '../utils/node';
import { rangeContainsPosition, pointToPosition } from '../utils/position';
import { parseFunctionCall } from '../utils/node/parseFunctionCall';
import { positionsEqual } from '../utils/position/comparePositions';

export type onDefinitionHandlerReturn = ReturnType<
    Parameters<Connection['onDefinition']>[0]
>;

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
    server: Server;

    constructor(server: Server) {
        this.server = server;

        this.server.connection.onDefinition(this.onDefinition.bind(this));
    }

    async onDefinition(
        params: DefinitionParams,
    ): Promise<Definition | undefined> {
        const document = this.server.documentCache.get(params.textDocument.uri);

        if (!document) {
            return;
        }

        const cursorNode = findNodeByPosition(
            document.tree.rootNode,
            params.position,
        );

        if (!cursorNode) {
            return;
        }

        if (isPathInsideTemplateEmbedding(cursorNode)) {
            const document = await this.server.documentCache.resolveByTwigPath(
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
                await extendedDocument.ensureParsed();
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
            const blocks = document.locals.block.filter((x) =>
                rangeContainsPosition(x.range, cursorPosition),
            );
            const macroses = document.locals.macro.filter((x) =>
                rangeContainsPosition(x.range, cursorPosition),
            );

            const scopedVariables = [...macroses, ...blocks].flatMap(
                (x) => x.symbols.variable,
            );

            const symbol = [
                ...scopedVariables,
                ...macroses.flatMap((x) => x.args),
                ...document.locals.variable,
                ...document.locals.imports,
            ].find((x) => x.name === cursorNode.text);

            if (!symbol) return;

            return {
                uri: document.uri,
                range: symbol.nameRange,
            };
        }

        if (cursorNode.type === 'property') {
            const macroName = cursorNode.text;
            const importName = cursorNode.parent!.firstChild!.text;

            const importedDocument = await this.server.documentCache.resolveImport(document, importName);
            if (!importedDocument) return;

            await importedDocument.ensureParsed();

            const macro = importedDocument.locals.macro.find(macro => macro.name === macroName);
            if (!macro) return;

            return {
                uri: importedDocument.uri,
                range: macro.nameRange,
            };
        }
    }

    private async getExtendedTemplate(document: Document) {
        if (!document.locals.extends) {
            return undefined;
        }

        return await this.server.documentCache.resolveByTwigPath(document.locals.extends);
    }
}
