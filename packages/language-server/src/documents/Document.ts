import { parser } from '../utils/parser';
import { readFile } from 'fs/promises';
import { DocumentUri } from 'vscode-languageserver';
import Parser from 'web-tree-sitter';
import { collectLocals } from '../symbols/locals';
import { LocalSymbolInformation, TwigBlock, TwigMacro } from '../symbols/types';
import { documentUriToFsPath } from '../utils/uri';
import { pointToPosition, rangeContainsPosition } from '../utils/position';

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

    get locals() {
        if (!this.#locals) throw new TreeNotParsedError(this.uri);

        return this.#locals;
    }

    get text() {
        if (!this.#text) throw new NoTextError(this.uri);

        return this.#text;
    }

    setText(text: string) {
        if (text === this.#text) {
            return;
        }

        this.#text = text;

        this.#tree = parser.parse(this.#text);
        this.#locals = collectLocals(this.#tree);
    }

    async ensureParsed(): Promise<void> {
        if (this.#tree) {
            return;
        }

        const fsPath = documentUriToFsPath(this.uri);
        const text = await readFile(fsPath, 'utf-8');
        this.setText(text);
    }

    getBlock(name: string): TwigBlock | undefined {
        const symbol = this.locals.block.find((s) => s.name === name);
        if (symbol) return symbol;

        return this.locals.block
            .flatMap((b) => b.symbols.block)
            .find((s) => s.name === name);
    }

    getScopeAt(point: Parser.Point): TwigBlock | TwigMacro | undefined {
        const scopes = [
            ...this.locals.macro,
            ...this.locals.block,
        ];

        return scopes.find((scope) => rangeContainsPosition(scope.range, pointToPosition(point)));
    }
}
