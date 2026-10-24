import type { Connection, Range, ReferenceParams } from 'vscode-languageserver/node';
import type { DocumentCache } from '../documents/DocumentCache';
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
        const document = await this.documentCache.get(params.textDocument.uri);

        const variable = document.variableAt(params.position);
        if (!variable) {
            return undefined;
        }

        if (!hasReferences(variable)) {
            return undefined;
        }

        return [
            rangeToLocation(variable.nameRange, document.uri),
            ...variable.references.map(range => rangeToLocation(range, document.uri)),
        ];
    }
}
