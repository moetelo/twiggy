import { parseTwig } from '../utils/parseTwig';
import { readFile } from 'fs/promises';
import { DocumentUri } from 'vscode-languageserver';
import Parser from 'web-tree-sitter';
import { collectLocals } from '../symbols/locals';
import { LocalSymbol, LocalSymbolInformation } from '../symbols/types';
import { documentUriToFsPath } from '../utils/document-uri-to-fs-path';

class NoTextError extends Error {}
class TreeNotParsedError extends Error {}

export class Document {
    readonly uri: DocumentUri;

    #text: string | null = null;

    #tree?: Parser.Tree;
    #locals?: LocalSymbolInformation;

    constructor(uri: DocumentUri) {
        this.uri = uri;
    }

    get tree() {
        if (!this.#tree) throw new TreeNotParsedError;

        return this.#tree;
    }

    get locals() {
        if (!this.#locals) throw new TreeNotParsedError;

        return this.#locals;
    }

    get text() {
        if (!this.#text) throw new NoTextError;

        return this.#text;
    }

    async setText(text: string) {
        if (text === this.#text) {
            return;
        }

        this.#text = text;

        this.#tree = await parseTwig(this.#text);
        this.#locals = collectLocals(this.#tree);
    }

    async ensureParsed(): Promise<void> {
        if (this.#tree) {
            return;
        }

        const fsPath = documentUriToFsPath(this.uri);
        const text = await readFile(fsPath, 'utf-8');
        await this.setText(text);
    }

    async getSymbolByName(
        name: string,
        symbolType: keyof LocalSymbolInformation,
    ): Promise<LocalSymbol | undefined> {
        const symbol = this.locals[symbolType].find((s) => s.name === name);
        if (symbol) return symbol;

        if (symbolType === 'block') {
            return this.locals.block
                .flatMap((b) => b.symbols.block)
                .find((s) => s.name === name);
        }
    }
}
