import { DocumentUri, Position } from 'vscode-languageserver';
import Parser, { SyntaxNode } from 'web-tree-sitter';
import { LocalSymbol, LocalSymbolInformation, TwigBlock } from '../symbols/types';
import { documentUriToFsPath } from '../utils/uri';
import { pointToPosition, rangeContainsPosition } from '../utils/position';
import { getNodeRange } from '../utils/node';

class NoTextError extends Error {
    get message() {
        return 'Document text is not set. File: ' + documentUriToFsPath(this.uri);
    }

    constructor(readonly uri: DocumentUri) {
        super();
    }
}
class TreeNotParsedError extends Error {
    get message() {
        return 'Document tree is not parsed yet. File: ' + documentUriToFsPath(this.uri);
    }

    constructor(readonly uri: DocumentUri) {
        super();
    }
}

export class Document {
    readonly uri: DocumentUri;

    #text: string | null = null;

    #tree?: Parser.Tree;
    #locals?: LocalSymbolInformation;

    constructor(uri: DocumentUri) {
        this.uri = uri;
    }

    get tree() {
        if (!this.#tree) throw new TreeNotParsedError(this.uri);

        return this.#tree;
    }

    set tree(tree: Parser.Tree) {
        this.#tree = tree;
    }

    get locals() {
        if (!this.#locals) throw new TreeNotParsedError(this.uri);

        return this.#locals;
    }

    set locals(locals: LocalSymbolInformation) {
        this.#locals = locals;
    }

    get text() {
        if (!this.#text) throw new NoTextError(this.uri);

        return this.#text;
    }

    set text(text: string) {
        this.#text = text;
    }

    getBlock(name: string): TwigBlock | undefined {
        const symbol = this.locals.block.find((s) => s.name === name);
        if (symbol) return symbol;

        return this.locals.block
            .flatMap((b) => b.symbols.block)
            .find((s) => s.name === name);
    }

    getScopeAt(pos: Position): LocalSymbolInformation {
        const scopes = [
            ...this.locals.macro,
            ...this.locals.block,
        ];

        return scopes.find((scope) => rangeContainsPosition(scope.range, pos))?.symbols
            || this.locals;
    }

    getLocalsAt(cursorPosition: Position): LocalSymbol[] {
        const blocks = this.locals.block.filter(x => rangeContainsPosition(x.range, cursorPosition));
        const macroses = this.locals.macro.filter(x => rangeContainsPosition(x.range, cursorPosition));

        const scopedVariables = [ ...macroses, ...blocks ].flatMap(x => [ ...x.symbols.variable, ...x.symbols.imports ]);

        return [
            ...scopedVariables,
            ...macroses.flatMap(x => x.args),
            ...this.locals.variable,
            ...this.locals.imports,
        ];
    }

    variableAt(pos: Position): LocalSymbol | undefined {
        const cursorNode = this.deepestAt(pos);
        if (!cursorNode || cursorNode.type !== 'variable') {
            return;
        }

        const variableName = cursorNode.text;
        const cursorPosition = pointToPosition(cursorNode.startPosition);
        const scopedVariables = this.getLocalsAt(cursorPosition);
        const variable = scopedVariables.find((x) => x.name === variableName);

        return variable;
    }

    deepestAt(pos: Position): SyntaxNode {
        let node = this.tree.rootNode;
        while (node.childCount > 0) {
            const foundNode = node.children.find((n) => rangeContainsPosition(getNodeRange(n), pos))!;

            if (!foundNode) return node;

            node = foundNode;
        }

        return node;
    }
}
