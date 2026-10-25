import type { SemanticTokensParams, Connection } from 'vscode-languageserver';
import { SemanticTokensBuilder } from 'vscode-languageserver';
import { PreOrderCursorIterator } from '../utils/node';
import { pointToPosition } from '../utils/position';
import { semanticTokensLegend } from './tokens-provider';
import type { DocumentCache } from '../documents';
import { TokenTypeResolver } from './TokenTypeResolver';

export class SemanticTokensProvider {
    readonly #tokenTypeResolver: TokenTypeResolver;

    constructor(
        private readonly connection: Connection,
        private readonly documentCache: DocumentCache,
    ) {
        this.connection.languages.semanticTokens.on(this.serverRequestHandler.bind(this));

        this.#tokenTypeResolver = new TokenTypeResolver(semanticTokensLegend);
    }

    async serverRequestHandler(params: SemanticTokensParams) {
        const document = await this.documentCache.get(params.textDocument.uri);

        const tokensBuilder = new SemanticTokensBuilder();
        const nodes = new PreOrderCursorIterator(document.tree.walk());

        for (const node of nodes) {
            const tokenType = this.#tokenTypeResolver.resolve(node);

            if (tokenType === undefined) {
                continue;
            }

            const start = pointToPosition(node.startPosition);
            const lines = node.nodeText.split('\n');
            let lineNumber = start.line;
            let charNumber = start.character;

            for (const line of lines) {
                tokensBuilder.push(lineNumber, charNumber, line.length, tokenType, 0);
                lineNumber += 1;
                charNumber = 0;
            }
        }

        return tokensBuilder.build();
    }
}
