import { SemanticTokenTypes, SemanticTokensLegend } from 'vscode-languageserver';
import { TreeCursor } from 'web-tree-sitter';

const aliasedNodes = new Map([
    ['comment_begin', SemanticTokenTypes.comment],
    ['comment_end', SemanticTokenTypes.comment],
    ['php_identifier', SemanticTokenTypes.class],
    ['primitive_type', SemanticTokenTypes.type],
    ...'()[]{}:.,='.split('').map((operator) => [operator, SemanticTokenTypes.operator] as const),
]);

export class TokenTypeResolver {
    readonly #tokenTypes: Map<string, number>;

    constructor(semanticTokensLegend: SemanticTokensLegend) {
        this.#tokenTypes = new Map(
            semanticTokensLegend.tokenTypes.map((tokenType, index) => [tokenType, index]),
        );
    }

    get methodTokenType() {
        return this.#tokenTypes.get(SemanticTokenTypes.method)!;
    }

    resolve(node: TreeCursor) {
        if (
            node.nodeType === 'property' &&
            node.currentNode.parent!.nextSibling?.type === 'arguments'
        ) {
            return this.methodTokenType;
        }

        const aliasedNodeTokenType = aliasedNodes.get(node.nodeType);
        if (aliasedNodeTokenType) {
            return this.#tokenTypes.get(aliasedNodeTokenType);
        }

        return this.#tokenTypes.get(node.nodeType);
    };
}
