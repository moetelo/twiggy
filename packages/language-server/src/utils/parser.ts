import * as path from 'node:path';
import Parser from 'web-tree-sitter';

export let parser!: Parser;

export const initializeParser = async (wasmPath?: string) => {
    if (parser) {
        return parser;
    }

    await Parser.init();
    parser = new Parser();

    if (!wasmPath) {
        wasmPath = path.join(__dirname, 'tree-sitter-twig.wasm');
    }

    parser.setLanguage(await Parser.Language.load(wasmPath));

    return parser;
};
