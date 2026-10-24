import type { Connection, PrepareRenameParams, RenameParams } from 'vscode-languageserver/node';
import type { DocumentCache } from '../documents/DocumentCache';
import { hasReferences } from '../symbols/types';

export class RenameProvider {
    constructor(
        connection: Connection,
        private readonly documentCache: DocumentCache,
    ) {
        connection.onPrepareRename(this.onPrepareRename.bind(this));
        connection.onRenameRequest(this.onRenameRequest.bind(this));
    }

    async onPrepareRename(params: PrepareRenameParams) {
        const document = await this.documentCache.get(params.textDocument.uri);

        const variable = document.variableAt(params.position);
        if (!variable) {
            return undefined;
        }

        if (!hasReferences(variable)) {
            return undefined;
        }

        return {
            range: variable.nameRange,
            placeholder: variable.name,
        };
    }

    async onRenameRequest(params: RenameParams) {
        const document = await this.documentCache.get(params.textDocument.uri);

        const variable = document.variableAt(params.position);
        if (!variable) {
            return undefined;
        }

        if (!hasReferences(variable)) {
            return undefined;
        }

        return {
            changes: {
                [document.uri]: [
                    {
                        range: variable.nameRange,
                        newText: params.newName,
                    },
                    ...variable.references.map(range => ({
                        range,
                        newText: params.newName,
                    })),
                ],
            },
        };
    }
}
