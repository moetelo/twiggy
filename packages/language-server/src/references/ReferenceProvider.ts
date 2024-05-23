import { Connection, Range, ReferenceParams } from 'vscode-languageserver/node';
import { DocumentCache } from '../documents/DocumentCache';
import { pointToPosition } from '../utils/position';
import { TwigVariableDeclaration, hasReferences } from '../symbols/types';

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

        const cursorNode = document.deepestAt(params.position);
        if (!cursorNode || cursorNode.type !== 'variable') {
            return;
        }

        const variableName = cursorNode.text;
        const cursorPosition = pointToPosition(cursorNode.startPosition);
        const scopedVariables = document.getLocalsAt(cursorPosition);
        const variable = scopedVariables.find((x) => x.name === variableName);

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
