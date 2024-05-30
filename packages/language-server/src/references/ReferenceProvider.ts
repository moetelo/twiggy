import { Connection, Range, ReferenceParams } from 'vscode-languageserver/node';
import { DocumentCache } from '../documents/DocumentCache';
import { hasReferences } from '../symbols/types';

const rangeToLocation = (range: Range, uri: string) => ({ uri, range });

export class ReferenceProvider {
    constructor(
        connection: Connection,
        private readonly documentCache: DocumentCache,
    ) {
        connection.onReferences(this.onReferences.bind(this));
    }

    async onReferences(params: ReferenceParams) {
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

        return [
            rangeToLocation(variable.nameRange, document.uri),
            ...variable.references.map(range => rangeToLocation(range, document.uri)),
        ];
    }
}
