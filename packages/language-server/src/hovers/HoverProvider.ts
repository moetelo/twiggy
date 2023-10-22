import { Connection, HoverParams } from 'vscode-languageserver';
import { findNodeByPosition } from '../utils/node';
import { globalVariables } from './global-variables';
import { localVariables } from './local-variables';
import { forLoop } from './for-loop';
import { functions } from './functions';
import { filters } from './filters';
import { DocumentCache } from '../documents';

export class HoverProvider {
    constructor(
        private readonly connection: Connection,
        private readonly documentCache: DocumentCache,
    ) {
        this.connection.onHover(this.onHover.bind(this));
    }

    async onHover(params: HoverParams) {
        const uri = params.textDocument.uri;
        const document = this.documentCache.get(uri);

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

        const hovers = [
            globalVariables,
            localVariables,
            functions,
            filters,
            forLoop,
        ];

        for (const fn of hovers) {
            const result = fn(cursorNode);

            if (result) {
                return result;
            }
        }
    }
}
