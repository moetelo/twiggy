import { Connection, PrepareRenameParams, Range, ReferenceParams, RenameParams } from 'vscode-languageserver/node';
import { DocumentCache } from '../documents/DocumentCache';
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
        const document = this.documentCache.get(params.textDocument.uri);
        if (!document) {
            return;
        }

        const variable = document.variableAt(params.position);
        if (!variable) {
            return;
        }

        if (!hasReferences(variable)) {
            return;
        }

        return {
            range: variable.nameRange,
            placeholder: variable.name,
        };
    }

    async onRenameRequest(params: RenameParams) {
        const document = this.documentCache.get(params.textDocument.uri);
        if (!document) {
            return;
        }

        const variable = document.variableAt(params.position);
        if (!variable) {
            return;
        }

        if (!hasReferences(variable)) {
            return;
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
